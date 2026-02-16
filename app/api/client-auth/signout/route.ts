import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set('client_id', '', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0,
  });

  return response;
}

