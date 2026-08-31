import { NextRequest, NextResponse } from 'next/server';
import { findUserByCredentials, getAllUsers } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { usernameOrEmail, password } = await req.json();

    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { error: 'Username/Email और Password आवश्यक हैं।' },
        { status: 400 }
      );
    }

    const user = findUserByCredentials(usernameOrEmail);

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
            error: `आपकी 1 महीने / निर्धारित सदस्यता अवधि (${expiryDate.toLocaleDateString('hi-IN')}) को समाप्त हो चुकी है। कृपया एडमिन से संपर्क करके अपनी सदस्यता रीन्यू (Unblock) करवाएं।`,
            code: 'EXPIRED',
            endDate: user.endDate
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
