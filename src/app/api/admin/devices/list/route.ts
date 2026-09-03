import { NextRequest, NextResponse } from 'next/server';
import { getUserDevices, ensureTableExists } from '@/lib/db';
import pool from '@/lib/db';

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

    // Return all devices flat list
    const [rows]: any = await pool.execute(
      'SELECT id, user_id, device_id, device_name, created_at FROM user_devices ORDER BY created_at DESC'
    );
    return NextResponse.json({ success: true, devices: rows || [] });
  } catch (error: any) {
    console.error('Error fetching devices list:', error);
    return NextResponse.json({ error: 'Failed to fetch devices: ' + error.message }, { status: 500 });
  }
}
