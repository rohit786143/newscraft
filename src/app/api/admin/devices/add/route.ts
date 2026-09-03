import { NextRequest, NextResponse } from 'next/server';
import { addUserDevice, ensureTableExists } from '@/lib/db';

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

export async function POST(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: 'अनधिकृत पहुंच (Unauthorized Admin Only)' }, { status: 401 });
  }

  try {
    await ensureTableExists();
    const body = await req.json();
    const { userId, deviceId, deviceName } = body;

    if (!userId || !deviceId) {
      return NextResponse.json(
        { error: 'User ID and Device ID are required' },
        { status: 400 }
      );
    }

    const cleanDeviceId = String(deviceId).trim().toUpperCase();
    const cleanDeviceName = String(deviceName || 'Workstation').trim();

    const device = await addUserDevice(String(userId).trim(), cleanDeviceId, cleanDeviceName);

    return NextResponse.json({
      success: true,
      message: 'डिवाइस सफलतापूर्वक एक्टिवेट व लिंक कर दी गई!',
      device
    });
  } catch (error: any) {
    console.error('Error adding device:', error);
    return NextResponse.json(
      { error: 'डिवाइस जोड़ने में त्रुटि: ' + error.message },
      { status: 500 }
    );
  }
}
