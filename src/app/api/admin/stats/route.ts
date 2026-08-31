import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get('presscraft_session')?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const session = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf-8'));
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = getAllUsers().filter(u => u.role !== 'admin');
    const now = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active' && new Date(u.endDate) > now).length;
    const expiredUsers = users.filter(u => u.status === 'expired' || (u.status !== 'blocked' && new Date(u.endDate) <= now)).length;
    const blockedUsers = users.filter(u => u.status === 'blocked').length;
    const expiringSoon = users.filter(u => u.status === 'active' && new Date(u.endDate) > now && new Date(u.endDate) <= threeDaysLater).length;

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        expiredUsers,
        blockedUsers,
        expiringSoon
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
