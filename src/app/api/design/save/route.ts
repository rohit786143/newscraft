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

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!designData) {
      return NextResponse.json(
        { success: false, error: 'Design payload cannot be empty' },
        { status: 400 }
      );
    }

    let parsedState = designData;
    if (typeof parsedState === 'string') {
      try {
        parsedState = JSON.parse(parsedState);
      } catch (e) {
        return NextResponse.json(
          { success: false, error: 'Invalid JSON format in designData' },
          { status: 400 }
        );
      }
    }

    if (!parsedState || typeof parsedState !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Design data must be a valid object' },
        { status: 400 }
      );
    }

    // Unpack stateData wrapper if present
    const state = parsedState.stateData || parsedState;

    if (!state || typeof state !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid state object in designData' },
        { status: 400 }
      );
    }

    const pages = state.pages;
    if (!Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Design must contain at least 1 page' },
        { status: 400 }
      );
    }

    // Count total articles / sections across all pages
    const totalArticles = pages.reduce(
      (acc: number, p: any) => acc + (Array.isArray(p?.sections) ? p.sections.length : 0),
      0
    );

    if (totalArticles === 0) {
      return NextResponse.json(
        { success: false, error: 'Design cannot be empty: must contain at least 1 article/news slot' },
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
      message: 'Design saved',
      pagesCount: pages.length,
      articlesCount: totalArticles
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
