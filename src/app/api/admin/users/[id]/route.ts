import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, saveUsers, calculateEndDate } from '@/lib/auth';

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

// PUT update user (extend subscription, block/unblock, edit details)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: 'अनधिकृत पहुंच (Unauthorized Admin Only)' }, { status: 401 });
  }

  const { id } = params;
  try {
    const body = await req.json();
    const { action, name, newspaperName, password, planType, extendMonths, newEndDate, status, notes } = body;

    const users = getAllUsers();
    const index = users.findIndex(u => u.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'यूज़र नहीं मिला (User not found)' }, { status: 404 });
    }

    const user = users[index];

    // Handle Quick Action Presets
    if (action === 'block') {
      user.status = 'blocked';
    } else if (action === 'unblock') {
      user.status = 'active';
      // If expired, automatically extend by 1 month from today
      const now = new Date();
      if (new Date(user.endDate) <= now) {
        user.endDate = calculateEndDate(now, '1-month').toISOString();
      }
    } else if (action === 'extend') {
      const months = extendMonths || 1;
      const now = new Date();
      const currentEnd = new Date(user.endDate);
      // Extend from current end date if in future, else from today
      const baseDate = currentEnd > now ? currentEnd : now;
      user.endDate = calculateEndDate(baseDate, 'custom', months).toISOString();
      user.status = 'active';
    } else {
      // General Edit Details
      if (name) user.name = name.trim();
      if (newspaperName) user.newspaperName = newspaperName.trim();
      if (password) user.password = password.trim();
      if (notes !== undefined) user.notes = notes.trim();
      if (status) user.status = status;
      if (newEndDate) {
        user.endDate = new Date(newEndDate).toISOString();
        if (new Date(user.endDate) > new Date() && user.status !== 'blocked') {
          user.status = 'active';
        }
      }
      if (planType) user.planType = planType;
    }

    users[index] = user;
    saveUsers(users);

    const { password: _, ...safeUser } = user;
    return NextResponse.json({
      success: true,
      message: 'यूज़र डेटा सफलतापूर्वक अपडेट किया गया!',
      user: safeUser
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'अपडेट में विफलता: ' + error.message }, { status: 500 });
  }
}

// DELETE user
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: 'अनधिकृत पहुंच (Unauthorized Admin Only)' }, { status: 401 });
  }

  const { id } = params;
  const users = getAllUsers();
  const user = users.find(u => u.id === id);

  if (!user) {
    return NextResponse.json({ error: 'यूज़र नहीं मिला' }, { status: 404 });
  }

  if (user.role === 'admin') {
    return NextResponse.json({ error: 'सुपर एडमिन अकाउंट को डिलीट नहीं किया जा सकता।' }, { status: 400 });
  }

  const filtered = users.filter(u => u.id !== id);
  saveUsers(filtered);

  return NextResponse.json({ success: true, message: 'यूज़र सफलतापूर्वक हटा दिया गया।' });
}
