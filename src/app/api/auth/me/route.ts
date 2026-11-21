import { NextRequest, NextResponse } from 'next/server';
import { findUserById } from '@/lib/auth';
import { isDeviceRegistered, ensureTableExists } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

    const isImpersonating = Boolean(sessionData.is_impersonating);

    // Dynamic expiry, block & device registration check (bypassed if admin or admin impersonation)
    const now = new Date();
    const expiryDate = new Date(user.endDate);

    if (user.role !== 'admin' && !isImpersonating) {
      if (user.status === 'blocked') {
        const res = NextResponse.json(
          {
            authenticated: false,
            error: 'आपका खाता एडमिन द्वारा ब्लॉक कर दिया गया है।',
            code: 'BLOCKED'
          },
          { status: 403 }
        );
        res.cookies.delete('presscraft_session');
        return res;
      }

      if (expiryDate < now) {
        const res = NextResponse.json(
          {
            authenticated: false,
            error: 'आपकी सदस्यता समाप्त हो चुकी है।',
            code: 'EXPIRED',
            endDate: user.endDate
          },
          { status: 403 }
        );
        res.cookies.delete('presscraft_session');
        return res;
      }

      // Enforce live device registration check on every session verification
      const queryDeviceId = req.nextUrl.searchParams.get('deviceId') || '';
      const checkDeviceId = String(queryDeviceId || sessionData.device_id || '').trim().toUpperCase();

      await ensureTableExists();
      const registered = checkDeviceId ? await isDeviceRegistered(user.id, checkDeviceId) : false;

      if (!registered) {
        const res = NextResponse.json(
          {
            authenticated: false,
            error: 'DEVICE_NOT_REGISTERED',
            code: 'DEVICE_NOT_REGISTERED',
            deviceId: checkDeviceId,
            message: 'यह डिवाइस आपके सब्सक्रिप्शन में एक्टिवेट नहीं है। कृपया एडमिन से डिवाइस रजिस्टर करवाएं।'
          },
          { status: 403 }
        );
        res.cookies.delete('presscraft_session');
        return res;
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
        status: user.status,
        is_impersonating: isImpersonating,
        original_admin_id: sessionData.original_admin_id,
        original_admin_name: sessionData.original_admin_name
      }
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
