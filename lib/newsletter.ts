import Anthropic from '@anthropic-ai/sdk';
import { Tweet } from '@/types';
import { readTemplate } from '@/lib/template';

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

  // Replace t.co shortened URLs in tweet text with their expanded versions
  // so the LLM never sees (or copies) raw t.co links.
  let text: string;
  if (tweet.retweet) {
    text = `[Retweet of @${tweet.retweet.original_author_username}] ${tweet.retweet.original_text}`;
  } else {
    text = tweet.text;
  }
  if (tweet.urls) {
    for (const u of tweet.urls) {
      // Twitter includes both display_url and a t.co URL in the text;
      // match any https://t.co/... token and replace with the expanded URL.
      text = text.replace(/https?:\/\/t\.co\/\S+/i, u.expanded_url);
    }
  }
  // Remove any remaining t.co URLs (e.g. self-referential twitter links
  // that were filtered out of tweet.urls during fetch).
  text = text.replace(/https?:\/\/t\.co\/\S+/gi, '').trim();

  let result = text;

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

  const rawTemplate = await readTemplate(username);
  const template = rawTemplate.replaceAll('{username}', username);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
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
- When referencing a tweet inline, link to it with its exact Tweet URL (e.g. [source](https://x.com/${username}/status/...)). Copy the URL exactly from the "Tweet URL:" field — do not modify, truncate, or retype the tweet ID digits.
- You may skip tweets that are irrelevant or don't make any sense, but every tweet you DO use must have its permalink linked inline.
- Include ALL third-party links from the "Links in tweet:" sections: use them inline where relevant AND collect them in the "Useful Links & Updates" section. Copy these URLs exactly as provided.
- If tweets mention events, include them in the "Upcoming Events" section. If none, don't render an events section
- IMPORTANT: Stay faithful to what the tweets actually say. Do not invent facts, statistics, specific details, or claims that are not present in the source tweets. You may paraphrase and add light connective language, but do not fabricate specifics.
- NEVER invent or add URLs that are not explicitly provided in the tweet data above. Only use Tweet URLs and "Links in tweet:" URLs. Do not add links to products, websites, or resources unless they appear in the source data.
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
