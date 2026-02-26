// Load env vars from .env.local before any SDK imports
import "dotenv/config";

import { createClient } from "@arizeai/phoenix-client";
import { createOrGetDataset } from "@arizeai/phoenix-client/datasets";
import {
  runExperiment,
  asExperimentEvaluator,
} from "@arizeai/phoenix-client/experiments";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { resolve } from "path";
import { composeNewsletter } from "@/lib/newsletter";
import { Tweet } from "@/types";

const anthropicClient = new Anthropic();

// --- Load real @arizeai tweets from fixtures ---
// To refresh: npx tsx evals/fetch-tweets.ts

const ALL_TWEETS: Tweet[] = JSON.parse(
  readFileSync(resolve(__dirname, "fixtures", "arizeai-tweets.json"), "utf-8")
);

// Split into 5 batches of 20 tweets each
const TWEETS_BATCH_1 = ALL_TWEETS.slice(0, 20);
const TWEETS_BATCH_2 = ALL_TWEETS.slice(20, 40);
const TWEETS_BATCH_3 = ALL_TWEETS.slice(40, 60);
const TWEETS_BATCH_4 = ALL_TWEETS.slice(60, 80);
const TWEETS_BATCH_5 = ALL_TWEETS.slice(80, 100);

const TEST_USERNAME = "arizeai";

// --- Helper: extract all URLs from markdown ---

function extractUrlsFromMarkdown(markdown: string): string[] {
  const urlRegex = /https?:\/\/[^\s\)>\]"'`]+/g;
  const matches = markdown.match(urlRegex) || [];
  return [...new Set(matches)];
}

// --- Helper: build expected URLs from input ---

function getExpectedUrls(
  tweets: Tweet[],
  username: string
): { permalinks: string[]; thirdPartyUrls: string[] } {
  const permalinks = tweets.map(
    (t) => `https://x.com/${username}/status/${t.id}`
  );
  const thirdPartyUrls = tweets.flatMap((t) =>
    (t.urls || []).map((u) => u.expanded_url)
  );
  return { permalinks, thirdPartyUrls };
}

// --- Evaluators ---

const linkCompleteness = asExperimentEvaluator({
  name: "link_completeness",
  kind: "CODE",
  evaluate: async ({ input, output }) => {
    const markdown = String(output);
    const tweets = input.tweets as Tweet[];
    const username = input.username as string;
    const { permalinks, thirdPartyUrls } = getExpectedUrls(tweets, username);
    const allExpected = [...permalinks, ...thirdPartyUrls];

    const missing = allExpected.filter((url) => !markdown.includes(url));

    if (missing.length === 0) {
      return { score: 1.0, label: "pass" };
    }
    return {
      score: 0.0,
      label: "fail",
      explanation: `Missing links: ${missing.join(", ")}`,
    };
  },
});

const noHallucinatedLinks = asExperimentEvaluator({
  name: "no_hallucinated_links",
  kind: "CODE",
  evaluate: async ({ input, output }) => {
    const markdown = String(output);
    const tweets = input.tweets as Tweet[];
    const username = input.username as string;
    const { permalinks, thirdPartyUrls } = getExpectedUrls(tweets, username);

    // Allowlist: tweet permalinks, third-party URLs, and the user's profile
    const allowlist = [
      ...permalinks,
      ...thirdPartyUrls,
      `https://x.com/${username}`,
    ];

    const outputUrls = extractUrlsFromMarkdown(markdown);
    const hallucinated = outputUrls.filter(
      (url) => !allowlist.some((allowed) => url.startsWith(allowed))
    );

    if (hallucinated.length === 0) {
      return { score: 1.0, label: "pass" };
    }
    return {
      score: 0.0,
      label: "fail",
      explanation: `Hallucinated links: ${hallucinated.join(", ")}`,
    };
  },
});

const structureAdherence = asExperimentEvaluator({
  name: "structure_adherence",
  kind: "CODE",
  evaluate: async ({ output }) => {
    const markdown = String(output);
    const checks = [
      { name: "top-level heading", pass: /^# .+/m.test(markdown) },
      {
        name: "Useful Links & Updates section",
        pass: /## Useful Links & Updates/i.test(markdown),
      },
      {
        name: "Upcoming Events section",
        pass: /## Upcoming Events/i.test(markdown),
      },
      { name: "horizontal rule dividers", pass: /^---$/m.test(markdown) },
    ];

    const failures = checks.filter((c) => !c.pass);
    if (failures.length === 0) {
      return { score: 1.0, label: "pass" };
    }
    return {
      score: 0.0,
      label: "fail",
      explanation: `Missing: ${failures.map((f) => f.name).join(", ")}`,
    };
  },
});

const faithfulnessAndQuality = asExperimentEvaluator({
  name: "faithfulness_and_quality",
  kind: "LLM",
  evaluate: async ({ input, output }) => {
    const markdown = String(output);
    const tweets = input.tweets as Tweet[];

    const username = input.username as string;
    const tweetSummary = tweets
      .map((t, i) => {
        const text = t.retweet
          ? `[RT @${t.retweet.original_author_username}] ${t.retweet.original_text}`
          : t.text;
        const permalink = `https://x.com/${username}/status/${t.id}`;
        const urls = (t.urls || [])
          .map((u) => `  - ${u.title ? u.title + ": " : ""}${u.expanded_url}`)
          .join("\n");
        const date = new Date(t.created_at).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        const m = t.public_metrics;
        let entry = `Tweet ${i + 1}: ${text}`;
        entry += `\n  Date: ${date}`;
        entry += `\n  Engagement: ${m.like_count} likes, ${m.retweet_count} retweets, ${m.reply_count} replies`;
        entry += `\n  Permalink: ${permalink}`;
        if (urls) entry += `\n  Links:\n${urls}`;
        return entry;
      })
      .join("\n\n");

    const response = await anthropicClient.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Evaluate the following newsletter against the source tweets.

The newsletter was generated from these tweets by @${username}. The source data includes the full tweet text, dates, engagement metrics, permalink URLs (https://x.com/${username}/status/...), and any third-party links mentioned in the tweets. All of this metadata is legitimate source material that the newsletter may reference.

<source_tweets>
${tweetSummary}
</source_tweets>

<newsletter>
${markdown}
</newsletter>

CRITERIA:
"pass" = ALL of the following are true:
  1. Every factual claim in the newsletter is supported by the source tweets (no hallucinated facts, names, numbers, or events beyond what the tweets state or clearly imply)
  2. URLs in the newsletter come from the source data (tweet permalinks or third-party links from the tweets)
  3. The newsletter synthesizes tweets into coherent narratives (not just listing them as blockquotes)
  4. The writing is engaging and well-structured

"fail" = ANY of the following:
  1. The newsletter fabricates specific facts, statistics, or events not present in or clearly implied by the source tweets
  2. The newsletter invents URLs not present in the source data
  3. The newsletter is just a list of tweet blockquotes without synthesis
  4. The writing is disjointed or poor quality

NOTE: The newsletter is expected to use the author's username (@${username}), tweet permalink URLs, third-party URLs from tweets, and dates from the tweet metadata. These are NOT hallucinations. Minor stylistic flourishes (e.g., "the response was great") that don't introduce false facts are acceptable.

<thinking>
Analyze each criterion carefully before deciding.
</thinking>

Answer ONLY with "pass" or "fail", followed by a one-sentence explanation:`,
        },
      ],
    });

    const responseText =
      response.content.find((b) => b.type === "text")?.text ?? "";
    // The LLM may reason before giving its verdict. Look for the last
    // occurrence of "pass" or "fail" as a standalone word.
    const verdictMatch = responseText.match(/\b(pass|fail)\b/gi);
    const finalVerdict = verdictMatch
      ? verdictMatch[verdictMatch.length - 1].toLowerCase()
      : "fail";
    const label = finalVerdict === "pass" ? "pass" : "fail";

    return {
      score: label === "pass" ? 1.0 : 0.0,
      label,
      explanation: responseText,
    };
  },
});

// --- Main ---

async function main() {
  const client = createClient();

  // Static dataset name — created once and reused across runs
  const datasetName = "ds-newsletter-arizeai-100";
  // Each experiment gets a unique timestamp
  const experimentName = `exp-newsletter-arizeai-${Date.now()}`;

  const { datasetId } = await createOrGetDataset({
    client,
    name: datasetName,
    description: "Real @arizeai tweets for newsletter generation evaluation",
    examples: [
      {
        input: { tweets: TWEETS_BATCH_1, username: TEST_USERNAME },
        metadata: { category: "batch_1" },
      },
      {
        input: { tweets: TWEETS_BATCH_2, username: TEST_USERNAME },
        metadata: { category: "batch_2" },
      },
      {
        input: { tweets: TWEETS_BATCH_3, username: TEST_USERNAME },
        metadata: { category: "batch_3" },
      },
      {
        input: { tweets: TWEETS_BATCH_4, username: TEST_USERNAME },
        metadata: { category: "batch_4" },
      },
      {
        input: { tweets: TWEETS_BATCH_5, username: TEST_USERNAME },
        metadata: { category: "batch_5" },
      },
    ],
  });

  console.log(`Dataset: ${datasetName} (${datasetId})`);

  // Run experiment
  const task = async (example: { input: Record<string, unknown> }) => {
    const tweets = example.input.tweets as Tweet[];
    const username = example.input.username as string;
    return await composeNewsletter(tweets, username);
  };

  const experiment = await runExperiment({
    client,
    experimentName,
    dataset: { datasetId },
    task,
    evaluators: [
      linkCompleteness,
      noHallucinatedLinks,
      structureAdherence,
      faithfulnessAndQuality,
    ],
  });

  // Print detailed evaluation results
  for (const evalRun of experiment.evaluationRuns ?? []) {
    const r = evalRun.result as { score?: number; label?: string; explanation?: string } | undefined;
    console.log(`\n[EVAL] ${evalRun.name} (run ${evalRun.experimentRunId}) | score: ${r?.score} | label: ${r?.label}`);
    if (r?.explanation) {
      console.log(`  explanation: ${r.explanation}`);
    }
  }
  console.log("\nExperiment complete.");
  console.log(`[PHOENIX_EXPERIMENT: ${experimentName} on ${datasetName}]`);
}

main().catch(console.error);
