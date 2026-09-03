import { NextRequest, NextResponse } from 'next/server';
import { findUserByCredentials } from '@/lib/auth';
import { isDeviceRegistered, ensureTableExists } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { usernameOrEmail, username, password, deviceId } = body;
    const loginUser = usernameOrEmail || username;

    if (!loginUser || !password) {
      return NextResponse.json(
        { error: 'Username/Email और Password आवश्यक हैं।' },
        { status: 400 }
      );
    }

    const user = findUserByCredentials(loginUser);

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'अमान्य क्रेडेंशियल्स (Invalid Username or Password)!' },
        { status: 401 }
      );
    }

    // Check if user is expired or blocked
    const now = new Date();
    const expiryDate = new Date(user.endDate);

    if (user.role !== 'admin') {
      if (user.status === 'blocked') {
        return NextResponse.json(
          {
            error: 'आपका खाता एडमिन द्वारा ब्लॉक (Suspended) कर दिया गया है। कृपया एडमिन से संपर्क करें।',
            code: 'BLOCKED'
          },
          { status: 403 }
        );
      }

      if (expiryDate < now) {
        return NextResponse.json(
          {
            error: `आपकी सदस्यता अवधि (${expiryDate.toLocaleDateString('hi-IN')}) समाप्त हो चुकी है। कृपया एडमिन से संपर्क करके अपनी सदस्यता रीन्यू करवाएं।`,
            code: 'EXPIRED',
            endDate: user.endDate
          },
          { status: 403 }
        );
      }

      // Check device binding for client user
      const cleanDeviceId = String(deviceId || '').trim().toUpperCase();
      if (!cleanDeviceId) {
        return NextResponse.json(
          {
            error: 'DEVICE_NOT_REGISTERED',
            deviceId: '',
            message: 'डिवाइस पहचान (Device ID) प्राप्त नहीं हुई। कृपया ब्राउज़र रीफ्रेश करें।'
          },
          { status: 403 }
        );
      }

      await ensureTableExists();
      const isRegistered = await isDeviceRegistered(user.id, cleanDeviceId);

      if (!isRegistered) {
        return NextResponse.json(
          {
            error: 'DEVICE_NOT_REGISTERED',
            deviceId: cleanDeviceId,
            message: 'यह डिवाइस आपके सब्सक्रिप्शन में एक्टिवेट नहीं है।'
          },
          { status: 403 }
        );
      }
    }

    // Set auth cookie
    const safeUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      newspaperName: user.newspaperName,
      planType: user.planType,
      startDate: user.startDate,
      endDate: user.endDate,
      status: user.status
    };

    const sessionPayload = Buffer.from(JSON.stringify(safeUser)).toString('base64');

    const res = NextResponse.json({
      success: true,
      message: 'लॉगिन सफल रहा!',
      user: safeUser
    });

    res.cookies.set('presscraft_session', sessionPayload, {
      httpOnly: false, // Accessible to client for instant UI state
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return res;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'लॉगिन में त्रुटि हुई: ' + error.message },
      { status: 500 }
    );
  }
}
