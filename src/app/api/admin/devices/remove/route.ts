import { NextRequest, NextResponse } from 'next/server';
import { removeUserDevice, removeUserDeviceById, ensureTableExists } from '@/lib/db';

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
  return handleRemove(req);
}

export async function DELETE(req: NextRequest) {
  return handleRemove(req);
}

async function handleRemove(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: 'अनधिकृत पहुंच (Unauthorized Admin Only)' }, { status: 401 });
  }

  try {
    await ensureTableExists();
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body might be empty in DELETE requests with query params
    }

    const id = body.id || req.nextUrl.searchParams.get('id');
    const userId = body.userId || req.nextUrl.searchParams.get('userId');
    const deviceId = body.deviceId || req.nextUrl.searchParams.get('deviceId');

    let removed = false;
    if (id) {
      removed = await removeUserDeviceById(Number(id), userId ? String(userId) : undefined);
    } else if (userId && deviceId) {
      removed = await removeUserDevice(String(userId), String(deviceId));
    } else {
      return NextResponse.json(
        { error: 'Device ID / Record ID and User ID are required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'डिवाइस का एक्सेस सफलतापूर्वक निरस्त (Revoked) कर दिया गया!'
    });
  } catch (error: any) {
    console.error('Error removing device:', error);
    return NextResponse.json(
      { error: 'डिवाइस हटाने में त्रुटि: ' + error.message },
      { status: 500 }
    );
  }
}
