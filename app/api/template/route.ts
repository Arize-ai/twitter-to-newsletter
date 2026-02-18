import { NextRequest, NextResponse } from 'next/server';
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

export async function GET() {
  try {
    const content = await readTemplate();
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Failed to read template:', error);
    return NextResponse.json({ error: 'Failed to read template' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content } = body;

    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'content must be a string' }, { status: 400 });
    }

    await fs.writeFile(TEMPLATE_PATH, content, 'utf-8');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to save template:', error);
    return NextResponse.json({ error: 'Failed to save template' }, { status: 500 });
  }
}
