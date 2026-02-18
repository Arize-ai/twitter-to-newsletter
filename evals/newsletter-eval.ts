// Load env vars from .env.local before any SDK imports
import "dotenv/config";

import { createClient } from "@arizeai/phoenix-client";
import { createOrGetDataset } from "@arizeai/phoenix-client/datasets";
import {
  runExperiment,
  asExperimentEvaluator,
} from "@arizeai/phoenix-client/experiments";
import Anthropic from "@anthropic-ai/sdk";
import { composeNewsletter } from "@/lib/newsletter";
import { Tweet } from "@/types";

const anthropicClient = new Anthropic();

// --- Test fixtures ---

const TECH_TWEETS: Tweet[] = [
  {
    id: "1001",
    text: "Just published a deep dive on vector databases and why they matter for AI applications. Check it out!",
    created_at: "2025-01-15T10:00:00Z",
    author_id: "techwriter",
    public_metrics: {
      like_count: 142,
      retweet_count: 38,
      reply_count: 12,
      quote_count: 5,
    },
    urls: [
      {
        display_url: "blog.example.com/vector-db",
        expanded_url: "https://blog.example.com/vector-databases-deep-dive",
        title: "Vector Databases: A Deep Dive",
      },
    ],
  },
  {
    id: "1002",
    text: "Hot take: most teams don't need a microservices architecture. A well-structured monolith will serve you better until you hit real scale problems.",
    created_at: "2025-01-18T14:30:00Z",
    author_id: "techwriter",
    public_metrics: {
      like_count: 523,
      retweet_count: 89,
      reply_count: 67,
      quote_count: 15,
    },
  },
  {
    id: "1003",
    text: "Released v2.0 of our open-source observability toolkit. Major improvements to trace visualization and a new plugin system.",
    created_at: "2025-01-22T09:00:00Z",
    author_id: "techwriter",
    public_metrics: {
      like_count: 201,
      retweet_count: 55,
      reply_count: 23,
      quote_count: 8,
    },
    urls: [
      {
        display_url: "github.com/example/obs-toolkit",
        expanded_url:
          "https://github.com/example/observability-toolkit/releases/tag/v2.0",
        title: "Observability Toolkit v2.0",
      },
    ],
  },
];

const EVENT_TWEETS: Tweet[] = [
  {
    id: "2001",
    text: "Excited to announce I'll be speaking at DevConf 2025 in March! My talk: 'Building Reliable AI Pipelines'. Hope to see you there.",
    created_at: "2025-01-10T11:00:00Z",
    author_id: "techwriter",
    public_metrics: {
      like_count: 89,
      retweet_count: 22,
      reply_count: 15,
      quote_count: 3,
    },
    urls: [
      {
        display_url: "devconf2025.com/schedule",
        expanded_url: "https://devconf2025.com/schedule/ai-pipelines",
        title: "DevConf 2025 Schedule",
      },
    ],
  },
  {
    id: "2002",
    text: "Great turnout at last night's local Python meetup! We discussed async patterns and had a live coding session. Slides are up.",
    created_at: "2025-01-20T08:00:00Z",
    author_id: "techwriter",
    public_metrics: {
      like_count: 45,
      retweet_count: 10,
      reply_count: 8,
      quote_count: 1,
    },
    urls: [
      {
        display_url: "slides.example.com/async",
        expanded_url: "https://slides.example.com/python-async-patterns",
        title: "Python Async Patterns Slides",
      },
    ],
  },
  {
    id: "2003",
    text: "Save the date: our team is hosting a free workshop on LLM evaluation best practices on Feb 15th. Registration link below.",
    created_at: "2025-01-25T16:00:00Z",
    author_id: "techwriter",
    public_metrics: {
      like_count: 156,
      retweet_count: 42,
      reply_count: 19,
      quote_count: 7,
    },
    urls: [
      {
        display_url: "events.example.com/llm-eval",
        expanded_url: "https://events.example.com/llm-eval-workshop",
        title: "LLM Evaluation Workshop",
      },
    ],
  },
];

const MIXED_TWEETS: Tweet[] = [
  {
    id: "3001",
    text: "Spent the weekend refactoring our data pipeline. Went from 45 min processing time to under 3 min. Sometimes the boring work pays off the most.",
    created_at: "2025-01-12T09:00:00Z",
    author_id: "techwriter",
    public_metrics: {
      like_count: 312,
      retweet_count: 48,
      reply_count: 35,
      quote_count: 10,
    },
  },
  {
    id: "3002",
    text: "RT @ai_researcher: Our new paper on constitutional AI training shows 40% improvement in safety benchmarks while maintaining capability. Preprint available.",
    created_at: "2025-01-16T13:00:00Z",
    author_id: "techwriter",
    public_metrics: {
      like_count: 28,
      retweet_count: 15,
      reply_count: 2,
      quote_count: 0,
    },
    retweet: {
      original_author_username: "ai_researcher",
      original_author_name: "AI Researcher",
      original_text:
        "Our new paper on constitutional AI training shows 40% improvement in safety benchmarks while maintaining capability. Preprint available.",
    },
    urls: [
      {
        display_url: "arxiv.org/abs/2501.12345",
        expanded_url: "https://arxiv.org/abs/2501.12345",
        title: "Constitutional AI Training Improvements",
      },
    ],
  },
  {
    id: "3003",
    text: "Tip: if you're using TypeScript, enable strict mode from day one. The type errors you catch early are worth the initial friction.",
    created_at: "2025-01-21T15:30:00Z",
    author_id: "techwriter",
    public_metrics: {
      like_count: 198,
      retweet_count: 41,
      reply_count: 27,
      quote_count: 6,
    },
  },
  {
    id: "3004",
    text: "RT @devtools_weekly: The 2025 State of Developer Tools survey is live! Help us understand how the ecosystem is evolving.",
    created_at: "2025-01-28T10:00:00Z",
    author_id: "techwriter",
    public_metrics: {
      like_count: 12,
      retweet_count: 8,
      reply_count: 1,
      quote_count: 0,
    },
    retweet: {
      original_author_username: "devtools_weekly",
      original_author_name: "DevTools Weekly",
      original_text:
        "The 2025 State of Developer Tools survey is live! Help us understand how the ecosystem is evolving.",
    },
    urls: [
      {
        display_url: "survey.devtools.com/2025",
        expanded_url: "https://survey.devtools.com/2025",
        title: "2025 State of Developer Tools Survey",
      },
    ],
  },
];

const TEST_USERNAME = "techwriter";

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
  const datasetName = "ds-newsletter-eval";
  // Each experiment gets a unique timestamp
  const experimentName = `exp-newsletter-eval-${Date.now()}`;

  const { datasetId } = await createOrGetDataset({
    client,
    name: datasetName,
    description: "Test tweet sets for newsletter generation evaluation",
    examples: [
      {
        input: { tweets: TECH_TWEETS, username: TEST_USERNAME },
        metadata: { category: "tech" },
      },
      {
        input: { tweets: EVENT_TWEETS, username: TEST_USERNAME },
        metadata: { category: "events" },
      },
      {
        input: { tweets: MIXED_TWEETS, username: TEST_USERNAME },
        metadata: { category: "mixed" },
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
  for (const evalRun of experiment.evaluationRuns) {
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
