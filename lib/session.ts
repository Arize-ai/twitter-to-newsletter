import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData } from '@/types';

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'twitter-newsletter-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24, // 24 hours
  },
};

export async function getSession() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  return session;
}

export function isAuthenticated(session: SessionData): boolean {
  return !!session.accessToken && !!session.userId;
}
