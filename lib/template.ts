import { Redis } from '@upstash/redis';

const TEMPLATE_KEY = 'newsletter-template';

export const DEFAULT_TEMPLATE = `# Monthly Content Roundup

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

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function readTemplate(): Promise<string> {
  const redis = getRedis();
  if (!redis) return DEFAULT_TEMPLATE;

  const content = await redis.get<string>(TEMPLATE_KEY);
  return content ?? DEFAULT_TEMPLATE;
}

export async function writeTemplate(content: string): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error('KV_REST_API_URL and KV_REST_API_TOKEN must be set');

  await redis.set(TEMPLATE_KEY, content);
}
