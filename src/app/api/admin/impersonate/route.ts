import { NextRequest, NextResponse } from 'next/server';
import { findUserById } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function getAdminSession(req: NextRequest): any | null {
  const sessionCookie = req.cookies.get('presscraft_session')?.value;
  if (!sessionCookie) return null;
  try {
    const session = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf-8'));
    if (session && session.role === 'admin') {
      return session;
    }
  } catch {
    // Ignore parse error
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const adminSession = getAdminSession(req);
    if (!adminSession) {
      return NextResponse.json(
        { error: 'अनधिकृत पहुंच (Unauthorized: Admin session required)' },
        { status: 401 }
      );
    }

    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target User ID is required' },
        { status: 400 }
      );
    }

    const targetUser = findUserById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'उपयोगकर्ता नहीं मिला (Target user not found)' },
        { status: 404 }
      );
    }

    // Build impersonated session payload
    const impersonatedUser = {
      id: targetUser.id,
      name: targetUser.name,
      username: targetUser.username,
      email: targetUser.email,
      role: targetUser.role,
      newspaperName: targetUser.newspaperName,
      planType: targetUser.planType,
      startDate: targetUser.startDate,
      endDate: targetUser.endDate,
      status: targetUser.status,
      is_impersonating: true,
      original_admin_id: adminSession.id,
      original_admin_name: adminSession.name || 'Super Admin'
    };

    const sessionPayload = Buffer.from(JSON.stringify(impersonatedUser)).toString('base64');
    const adminBackupPayload = Buffer.from(JSON.stringify(adminSession)).toString('base64');

    const res = NextResponse.json({
      success: true,
      message: `इंपर्सनेशन मोड सक्रिय: अब आप ${targetUser.name} के रूप में देख रहे हैं।`,
      redirect: '/',
      user: impersonatedUser
    });

    // Set impersonated session
    res.cookies.set('presscraft_session', sessionPayload, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    // Store backup of original admin session
    res.cookies.set('presscraft_admin_backup', adminBackupPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return res;
  } catch (error: any) {
    console.error('Impersonation error:', error);
    return NextResponse.json(
      { error: 'इंपर्सनेशन शुरू करने में त्रुटि: ' + error.message },
      { status: 500 }
    );
  }
}
