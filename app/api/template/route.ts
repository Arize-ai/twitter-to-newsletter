import { NextRequest, NextResponse } from 'next/server';
import { readTemplate, writeTemplate } from '@/lib/template';

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username');
    if (!username) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 });
    }
    const content = await readTemplate(username);
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Failed to read template:', error);
    return NextResponse.json({ error: 'Failed to read template' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, content } = body;

    if (typeof username !== 'string' || !username) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 });
    }

    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'content must be a string' }, { status: 400 });
    }

    await writeTemplate(username, content);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to save template:', error);
    return NextResponse.json({ error: 'Failed to save template' }, { status: 500 });
  }
}
