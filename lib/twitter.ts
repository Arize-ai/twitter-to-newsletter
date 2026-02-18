import { TwitterApi } from 'twitter-api-v2';
import { Tweet } from '@/types';

const CLIENT_ID = process.env.TWITTER_OAUTH2_ID!;
const CLIENT_SECRET = process.env.TWITTER_OAUTH2_SECRET!;
const CALLBACK_URL = process.env.TWITTER_CALLBACK_URL!;

function createOAuthClient(): TwitterApi {
  return new TwitterApi({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
  });
}

export function generateAuthLink() {
  const client = createOAuthClient();
  const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
    CALLBACK_URL,
    { scope: ['tweet.read', 'users.read', 'offline.access'] }
  );
  return { url, codeVerifier, state };
}

export async function exchangeCodeForToken(code: string, codeVerifier: string) {
  const client = createOAuthClient();
  const { accessToken, client: loggedClient } = await client.loginWithOAuth2({
    code,
    codeVerifier,
    redirectUri: CALLBACK_URL,
  });
  return { accessToken, loggedClient };
}

export async function fetchUserTweets(
  accessToken: string,
  userId: string,
  startDate: string,
  endDate: string,
  maxResults: number = 100,
): Promise<{ tweets: Tweet[]; nextToken?: string; resultCount: number }> {
  const client = new TwitterApi(accessToken);

  const response = await client.v2.userTimeline(userId, {
    start_time: new Date(startDate).toISOString(),
    end_time: new Date(endDate).toISOString(),
    max_results: Math.min(maxResults, 100),
    'tweet.fields': ['created_at', 'public_metrics', 'attachments', 'author_id', 'note_tweet', 'referenced_tweets', 'entities'],
    expansions: ['referenced_tweets.id', 'referenced_tweets.id.author_id'],
    'user.fields': ['username', 'name'],
  });

  // Build lookup maps from the includes for retweet resolution
  const includedTweets = new Map(
    (response.data.includes?.tweets || []).map((t) => [t.id, t])
  );
  const includedUsers = new Map(
    (response.data.includes?.users || []).map((u) => [u.id, u])
  );

  const tweets: Tweet[] = (response.data.data || []).map((t) => {
    const retweetRef = t.referenced_tweets?.find((ref) => ref.type === 'retweeted');
    let retweet: Tweet['retweet'];

    if (retweetRef) {
      const originalTweet = includedTweets.get(retweetRef.id);
      if (originalTweet) {
        const originalAuthor = originalTweet.author_id
          ? includedUsers.get(originalTweet.author_id)
          : undefined;
        const originalText =
          (originalTweet as unknown as { note_tweet?: { text: string } }).note_tweet?.text
          || originalTweet.text;
        retweet = {
          original_author_username: originalAuthor?.username || 'unknown',
          original_author_name: originalAuthor?.name || 'Unknown',
          original_text: originalText,
        };
      }
    }

    const entities = (t as unknown as { entities?: { urls?: { display_url: string; expanded_url: string; title?: string }[] } }).entities;
    const urls = (entities?.urls || [])
      .filter((u) => !u.expanded_url.includes('twitter.com') && !u.expanded_url.includes('x.com'))
      .map((u) => ({ display_url: u.display_url, expanded_url: u.expanded_url, title: u.title }));

    return {
      id: t.id,
      text: (t as unknown as { note_tweet?: { text: string } }).note_tweet?.text || t.text,
      created_at: t.created_at || '',
      author_id: t.author_id || userId,
      public_metrics: t.public_metrics || {
        retweet_count: 0,
        reply_count: 0,
        like_count: 0,
        quote_count: 0,
      },
      attachments: t.attachments as Tweet['attachments'],
      urls: urls.length > 0 ? urls : undefined,
      retweet,
    };
  });

  return {
    tweets,
    nextToken: response.data.meta?.next_token,
    resultCount: response.data.meta?.result_count || 0,
  };
}
