import { NextRequest, NextResponse } from 'next/server';
import { getSession, isAuthenticated } from '@/lib/session';
import { composeNewsletter } from '@/lib/newsletter';

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!isAuthenticated(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tweets } = body;

    if (!tweets || !Array.isArray(tweets) || tweets.length === 0) {
      return NextResponse.json(
        { error: 'tweets[] is required' },
        { status: 400 }
      );
    }

    const markdown = await composeNewsletter(tweets, session.username || 'user');
    return NextResponse.json({ markdown });
  } catch (error) {
    console.error('Compose error:', error);
    return NextResponse.json(
      { error: 'Failed to compose newsletter' },
      { status: 500 }
    );
  }
}
