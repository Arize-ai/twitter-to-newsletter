import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { generateAuthLink } from '@/lib/twitter';

export async function GET() {
  const session = await getSession();
  const { url, codeVerifier, state } = generateAuthLink();

  session.codeVerifier = codeVerifier;
  session.state = state;
  await session.save();

  return NextResponse.redirect(url);
}
