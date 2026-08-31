import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, saveUsers, calculateEndDate, User } from '@/lib/auth';

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

// GET all users
export async function GET(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: 'अनधिकृत पहुंच (Unauthorized Admin Only)' }, { status: 401 });
  }

  const users = getAllUsers();
  // Filter out passwords
  const sanitized = users.map(({ password, ...rest }) => rest);
  return NextResponse.json({ users: sanitized });
}

// POST create new user
export async function POST(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: 'अनधिकृत पहुंच (Unauthorized Admin Only)' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, username, email, password, newspaperName, planType, customEndDate, notes } = body;

    if (!name || !username || !password) {
      return NextResponse.json({ error: 'नाम, यूज़रनेम और पासवर्ड अनिवार्य हैं।' }, { status: 400 });
    }

    const users = getAllUsers();
    const existing = users.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase() ||
           (email && u.email.toLowerCase() === email.trim().toLowerCase())
    );

    if (existing) {
      return NextResponse.json({ error: 'यह यूज़रनेम या ईमेल पहले से मौजूद है।' }, { status: 400 });
    }

    const now = new Date();
    let endDate: Date;

    if (planType === 'custom' && customEndDate) {
      endDate = new Date(customEndDate);
    } else {
      endDate = calculateEndDate(now, planType || '1-month');
    }

    const newUser: User = {
      id: 'usr-' + Date.now(),
      name: name.trim(),
      username: username.trim(),
      email: (email || `${username.trim().toLowerCase()}@epaper.in`),
      password: password.trim(),
      role: 'user',
      newspaperName: newspaperName?.trim() || 'दैनिक समाचार',
      planType: planType || '1-month',
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      status: 'active',
      createdAt: now.toISOString(),
      notes: notes?.trim() || ''
    };

    users.push(newUser);
    saveUsers(users);

    const { password: _, ...safeUser } = newUser;
    return NextResponse.json({
      success: true,
      message: 'नया यूज़र सफलतापूर्वक जोड़ा गया!',
      user: safeUser
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'यूज़र जोड़ने में विफलता: ' + error.message }, { status: 500 });
  }
}
