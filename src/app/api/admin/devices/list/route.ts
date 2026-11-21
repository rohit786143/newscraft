import { NextRequest, NextResponse } from 'next/server';
import { getUserDevices, getAllDevices, ensureTableExists } from '@/lib/db';

export const dynamic = 'force-dynamic';

function verifyAdminSession(req: NextRequest): boolean {
  const sessionCookie = req.cookies.get('presscraft_session')?.value;
  if (!sessionCookie) return false;
  try {
    const session = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf-8'));
    return session && session.role === 'admin';
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: 'अनधिकृत पहुंच (Unauthorized Admin Only)' }, { status: 401 });
  }

  try {
    await ensureTableExists();
    const userId = req.nextUrl.searchParams.get('userId');

    if (userId) {
      const devices = await getUserDevices(userId);
      return NextResponse.json({ success: true, devices });
    }

    const devices = await getAllDevices();
    return NextResponse.json({ success: true, devices });
  } catch (error: any) {
    console.warn('Error listing devices:', error.message);
    return NextResponse.json({ success: true, devices: [], fallback: true });
  }
}
