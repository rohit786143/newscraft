import { NextRequest, NextResponse } from 'next/server';
import pool, { ensureTableExists } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let userId = req.nextUrl.searchParams.get('userId');

    // Fallback: extract userId from authenticated session cookie if not passed in query
    if (!userId) {
      const sessionCookie = req.cookies.get('presscraft_session')?.value;
      if (sessionCookie) {
        try {
          const sessionData = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf-8'));
          userId = sessionData?.id || sessionData?.username;
        } catch {
          // Ignore parse error
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required', designData: null },
        { status: 400 }
      );
    }

    await ensureTableExists();

    const [rows]: any = await pool.execute(
      'SELECT design_data, updated_at FROM user_designs WHERE user_id = ? LIMIT 1',
      [String(userId)]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ designData: null });
    }

    const rawData = rows[0].design_data;
    let parsedData = null;
    try {
      parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    } catch {
      parsedData = rawData;
    }

    return NextResponse.json({
      success: true,
      designData: parsedData,
      updatedAt: rows[0].updated_at
    });
  } catch (error: any) {
    console.error('Error loading design from MySQL:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to load design from database',
        designData: null
      },
      { status: 500 }
    );
  }
}
