import Anthropic from '@anthropic-ai/sdk';
import { Tweet } from '@/types';
import fs from 'fs/promises';
import path from 'path';

const TEMPLATE_PATH = path.join(process.cwd(), 'template.md');

const DEFAULT_TEMPLATE = `# Monthly Content Roundup

Hi there,

It's your friendly monthly content roundup from @{username}. Check out the highlights from [month]!

---

[Synthesized content from tweets, grouped by theme]

---

## Useful Links & Updates

*Relevant links mentioned in or related to the tweets above.*

## Upcoming Events

*Any events mentioned in the tweets, or a placeholder if none.*

---

*Thanks for reading! See you next month.*`;

async function readTemplate(): Promise<string> {
  try {
    return await fs.readFile(TEMPLATE_PATH, 'utf-8');
  } catch {
    await fs.writeFile(TEMPLATE_PATH, DEFAULT_TEMPLATE, 'utf-8');
    return DEFAULT_TEMPLATE;
  }
}

const anthropic = new Anthropic();

function formatTweetForPrompt(tweet: Tweet, username: string): string {
  const date = new Date(tweet.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const m = tweet.public_metrics;
  const metrics = `${m.like_count} likes, ${m.retweet_count} retweets, ${m.reply_count} replies`;
  const permalink = `https://x.com/${username}/status/${tweet.id}`;

  let result: string;
  if (tweet.retweet) {
    result = `[Retweet of @${tweet.retweet.original_author_username}] ${tweet.retweet.original_text}`;
  } else {
    result = tweet.text;
  }

  result += `\nDate: ${date} | Engagement: ${metrics}`;
  result += `\nTweet URL: ${permalink}`;

  if (tweet.urls && tweet.urls.length > 0) {
    const linkList = tweet.urls.map((u) => `  - ${u.title ? u.title + ': ' : ''}${u.expanded_url}`).join('\n');
    result += `\nLinks in tweet:\n${linkList}`;
  }

  return result;
}

export async function composeNewsletter(tweets: Tweet[], username: string): Promise<string> {
  const tweetBlock = tweets.map((t, i) => `Tweet ${i + 1}:\n${formatTweetForPrompt(t, username)}`).join('\n\n');

  const rawTemplate = await readTemplate();
  const template = rawTemplate.replaceAll('{username}', username);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: `You are a skilled newsletter writer. The user will provide a set of tweets from their Twitter account (@${username}). Your job is to compose an engaging, well-written monthly newsletter in Markdown format based on those tweets.

Follow this template structure as a guide:

\`\`\`markdown
${template}
\`\`\`

Guidelines:
- Use the template above as a one-off example for style and formatting, don't repeat the same content
- Group related tweets by theme when possible.
- Highlight the most engaging content (high likes/retweets).
- Keep the tone conversational and authentic to the original tweets.
- Use proper Markdown formatting: headings, bold, italics, links, etc.
- Tweets must be referenced with a link back to their Tweet URL (e.g. [source](https://x.com/...)).
- You can skip tweets that are irrelevant or don't make any sense
- Include any third-party links from the tweets inline where relevant, and also collect them in the "Useful Links & Updates" section.
- If tweets mention events, include them in the "Upcoming Events" section. If none, don't render an events section
- IMPORTANT: Stay faithful to what the tweets actually say. Do not invent facts, statistics, specific details, or claims that are not present in the source tweets. You may paraphrase and add light connective language, but do not fabricate specifics.
- Output ONLY the Markdown content, no preamble or explanation.`,
    messages: [
      {
        role: 'user',
        content: `Here are my recent tweets. Please compose them into a newsletter.\n\n${tweetBlock}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  return textBlock?.text ?? '';
}
