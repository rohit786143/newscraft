import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true, message: 'सफलतापूर्वक लॉगआउट किया गया।' });
  res.cookies.set('presscraft_session', '', {
    path: '/',
    maxAge: 0
  });
  return res;
}
