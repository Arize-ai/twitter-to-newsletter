/**
 * One-time script to fetch live tweets from @arizeai and save as fixture data.
 * Run with: npx tsx evals/fetch-tweets.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { Tweet } from "@/types";
import { writeFileSync } from "fs";
import { resolve } from "path";

const TARGET_USERNAME = "arizeai";
const API_BASE = "https://api.twitter.com/2";

async function getBearerToken(): Promise<string> {
  const response = await fetch("https://api.twitter.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
        ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = (await response.json()) as { access_token: string };
  return decodeURIComponent(data.access_token);
}

async function twitterGet(
  bearer: string,
  path: string,
  params: Record<string, string>
) {
  const url = new URL(`${API_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${bearer}` },
  });
  if (!res.ok) {
    throw new Error(`Twitter API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  const bearer = await getBearerToken();

  // Look up user ID
  const userRes = (await twitterGet(bearer, `/users/by/username/${TARGET_USERNAME}`, {})) as {
    data: { id: string };
  };
  const userId = userRes.data.id;
  console.log(`Found @${TARGET_USERNAME} (ID: ${userId})`);

  // Fetch tweets with pagination (API max is 100 per request)
  const TARGET_COUNT = 100;
  const allTweets: Tweet[] = [];
  let paginationToken: string | undefined;

  while (allTweets.length < TARGET_COUNT) {
    const remaining = TARGET_COUNT - allTweets.length;
    if (remaining < 5) break; // Twitter API minimum is 5
    const params: Record<string, string> = {
      max_results: String(Math.min(remaining, 100)),
      "tweet.fields":
        "created_at,public_metrics,author_id,note_tweet,referenced_tweets,entities",
      expansions: "referenced_tweets.id,referenced_tweets.id.author_id",
      "user.fields": "username,name",
    };
    if (paginationToken) {
      params.pagination_token = paginationToken;
    }

    const tweetsRes = (await twitterGet(
      bearer,
      `/users/${userId}/tweets`,
      params
    )) as {
      data?: Array<Record<string, unknown>>;
      includes?: {
        tweets?: Array<Record<string, unknown>>;
        users?: Array<Record<string, unknown>>;
      };
      meta?: { next_token?: string };
    };

    if (!tweetsRes.data || tweetsRes.data.length === 0) break;

    // Build lookup maps for retweet resolution
    const includedTweets = new Map(
      (tweetsRes.includes?.tweets || []).map((t) => [t.id as string, t])
    );
    const includedUsers = new Map(
      (tweetsRes.includes?.users || []).map((u) => [u.id as string, u])
    );

    const tweets: Tweet[] = tweetsRes.data.map((t) => {
      const refs = t.referenced_tweets as
        | { id: string; type: string }[]
        | undefined;
      const retweetRef = refs?.find((ref) => ref.type === "retweeted");
      let retweet: Tweet["retweet"];

      if (retweetRef) {
        const originalTweet = includedTweets.get(retweetRef.id);
        if (originalTweet) {
          const originalAuthor = originalTweet.author_id
            ? includedUsers.get(originalTweet.author_id as string)
            : undefined;
          const noteTweet = originalTweet.note_tweet as
            | { text: string }
            | undefined;
          retweet = {
            original_author_username:
              (originalAuthor?.username as string) || "unknown",
            original_author_name:
              (originalAuthor?.name as string) || "Unknown",
            original_text: noteTweet?.text || (originalTweet.text as string),
          };
        }
      }

      const entities = t.entities as
        | {
            urls?: {
              display_url: string;
              expanded_url: string;
              title?: string;
            }[];
          }
        | undefined;
      const urls = (entities?.urls || [])
        .filter(
          (u) =>
            !u.expanded_url.includes("twitter.com") &&
            !u.expanded_url.includes("x.com")
        )
        .map((u) => ({
          display_url: u.display_url,
          expanded_url: u.expanded_url,
          title: u.title,
        }));

      const noteTweet = t.note_tweet as { text: string } | undefined;

      return {
        id: t.id as string,
        text: noteTweet?.text || (t.text as string),
        created_at: (t.created_at as string) || "",
        author_id: (t.author_id as string) || userId,
        public_metrics: (t.public_metrics as Tweet["public_metrics"]) || {
          retweet_count: 0,
          reply_count: 0,
          like_count: 0,
          quote_count: 0,
        },
        urls: urls.length > 0 ? urls : undefined,
        retweet,
      };
    });

    allTweets.push(...tweets);
    console.log(
      `Fetched ${tweets.length} tweets (total: ${allTweets.length})`
    );

    paginationToken = tweetsRes.meta?.next_token;
    if (!paginationToken) break;
  }

  console.log(
    `Done: ${allTweets.length} tweets from @${TARGET_USERNAME}`
  );

  const outPath = resolve(__dirname, "fixtures", "arizeai-tweets.json");
  writeFileSync(outPath, JSON.stringify(allTweets, null, 2));
  console.log(`Saved to ${outPath}`);
}

main().catch(console.error);
