import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { exchangeCodeForToken } from '@/lib/twitter';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(new URL('/?error=missing_params', request.url));
  }

  const session = await getSession();

  if (state !== session.state) {
    return NextResponse.redirect(new URL('/?error=state_mismatch', request.url));
  }

  if (!session.codeVerifier) {
    return NextResponse.redirect(new URL('/?error=missing_verifier', request.url));
  }

  try {
    const { accessToken, loggedClient } = await exchangeCodeForToken(
      code,
      session.codeVerifier
    );

    const me = await loggedClient.v2.me();

    session.accessToken = accessToken;
    session.userId = me.data.id;
    session.username = me.data.username;
    session.codeVerifier = undefined;
    session.state = undefined;
    await session.save();

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}
