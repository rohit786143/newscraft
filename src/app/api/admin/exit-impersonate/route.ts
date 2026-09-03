import { NextRequest, NextResponse } from 'next/server';
import { findUserById } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const backupCookie = req.cookies.get('presscraft_admin_backup')?.value;
    let adminSession: any = null;

    if (backupCookie) {
      try {
        adminSession = JSON.parse(Buffer.from(backupCookie, 'base64').toString('utf-8'));
      } catch {
        // Ignore parse error
      }
    }

    // Fallback: check original_admin_id from current session
    if (!adminSession) {
      const sessionCookie = req.cookies.get('presscraft_session')?.value;
      if (sessionCookie) {
        try {
          const current = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf-8'));
          if (current?.original_admin_id) {
            const adminUser = findUserById(current.original_admin_id);
            if (adminUser && adminUser.role === 'admin') {
              adminSession = {
                id: adminUser.id,
                name: adminUser.name,
                username: adminUser.username,
                email: adminUser.email,
                role: adminUser.role,
                newspaperName: adminUser.newspaperName,
                planType: adminUser.planType,
                startDate: adminUser.startDate,
                endDate: adminUser.endDate,
                status: adminUser.status
              };
            }
          }
        } catch {
          // Ignore
        }
      }
    }

    if (!adminSession) {
      // Default admin account fallback
      const defaultAdmin = findUserById('usr-admin');
      if (defaultAdmin) {
        adminSession = {
          id: defaultAdmin.id,
          name: defaultAdmin.name,
          username: defaultAdmin.username,
          email: defaultAdmin.email,
          role: defaultAdmin.role,
          newspaperName: defaultAdmin.newspaperName,
          planType: defaultAdmin.planType,
          startDate: defaultAdmin.startDate,
          endDate: defaultAdmin.endDate,
          status: defaultAdmin.status
        };
      }
    }

    if (!adminSession) {
      return NextResponse.json({ success: false, redirect: '/login' });
    }

    const restoredSessionPayload = Buffer.from(JSON.stringify(adminSession)).toString('base64');

    const res = NextResponse.json({
      success: true,
      message: 'एडमिन मोड में वापसी सफल!',
      redirect: '/admin'
    });

    // Restore admin session
    res.cookies.set('presscraft_session', restoredSessionPayload, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30
    });

    // Clear backup cookie
    res.cookies.set('presscraft_admin_backup', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0
    });

    return res;
  } catch (error: any) {
    console.error('Exit impersonation error:', error);
    return NextResponse.json(
      { error: 'एडमिन मोड में लौटने में त्रुटि: ' + error.message },
      { status: 500 }
    );
  }
}
