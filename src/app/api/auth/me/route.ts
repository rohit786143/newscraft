import { NextRequest, NextResponse } from 'next/server';
import { findUserById } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('presscraft_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const sessionData = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf-8'));
    if (!sessionData || !sessionData.id) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = findUserById(sessionData.id);
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Dynamic expiry & block check
    const now = new Date();
    const expiryDate = new Date(user.endDate);

    if (user.role !== 'admin') {
      if (user.status === 'blocked') {
        return NextResponse.json(
          {
            authenticated: false,
            error: 'आपका खाता एडमिन द्वारा ब्लॉक कर दिया गया है।',
            code: 'BLOCKED'
          },
          { status: 403 }
        );
      }

      if (expiryDate < now) {
        return NextResponse.json(
          {
            authenticated: false,
            error: 'आपकी सदस्यता समाप्त हो चुकी है।',
            code: 'EXPIRED',
            endDate: user.endDate
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: {
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
      }
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
