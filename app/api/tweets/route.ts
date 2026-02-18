import { NextRequest, NextResponse } from 'next/server';
import { getSession, isAuthenticated } from '@/lib/session';
import { fetchUserTweets } from '@/lib/twitter';

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!isAuthenticated(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const maxResults = parseInt(searchParams.get('max_results') || '100', 10);

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'start_date and end_date are required' },
      { status: 400 }
    );
  }

  try {
    const result = await fetchUserTweets(
      session.accessToken!,
      session.userId!,
      startDate,
      endDate,
      maxResults,
    );

    return NextResponse.json({
      tweets: result.tweets,
      meta: {
        next_token: result.nextToken,
        result_count: result.resultCount,
      },
    });
  } catch (error: unknown) {
    console.error('Tweet fetch error:', error);

    if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code === 429) {
      return NextResponse.json(
        { error: 'Rate limited. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch tweets' },
      { status: 500 }
    );
  }
}
