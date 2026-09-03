import { NextRequest, NextResponse } from 'next/server';
import pool, { ensureTableExists } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { userId, designData } = body;

    // Fallback: extract userId from authenticated session cookie if not passed directly
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

    if (!userId || !designData) {
      return NextResponse.json(
        { success: false, error: 'User ID and designData are required' },
        { status: 400 }
      );
    }

    await ensureTableExists();

    const serializedData = typeof designData === 'string' ? designData : JSON.stringify(designData);

    const query = `
      INSERT INTO user_designs (user_id, design_data)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        design_data = VALUES(design_data),
        updated_at = CURRENT_TIMESTAMP
    `;

    await pool.execute(query, [String(userId), serializedData]);

    return NextResponse.json({
      success: true,
      message: 'Design saved'
    });
  } catch (error: any) {
    console.error('Error saving design to MySQL:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to save design to database'
      },
      { status: 500 }
    );
  }
}
