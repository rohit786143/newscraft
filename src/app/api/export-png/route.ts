import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(req: NextRequest) {
  try {
    const { html, css, width = 1122.5, height = 1587.4 } = await req.json();

    if (!html) {
      return NextResponse.json({ error: 'Missing HTML content' }, { status: 400 });
    }

    const fullHTML = `
      <!DOCTYPE html>
      <html lang="hi">
      <head>
        <meta charset="UTF-8">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Inter:wght@300;400;500;600;700;800&family=Martel:wght@400;600;700;800;900&family=Noto+Serif+Devanagari:wght@400;500;600;700;800;900&family=Rozha+One&family=Tiro+Devanagari+Hindi:ital@0;1&family=Yatra+One&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 0;
            background: #fcfbfa;
            width: ${Math.round(width)}px;
            height: ${Math.round(height)}px;
            overflow: hidden;
          }
          ${css || ''}
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=max',
        '--enable-font-antialiasing'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: Math.round(width),
      height: Math.round(height),
      deviceScaleFactor: 2 // 2x Ultra crisp print quality
    });

    await page.setContent(fullHTML, {
      waitUntil: ['load', 'networkidle0' as any]
    });

    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    });

    const screenshotBuffer = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: Math.round(width),
        height: Math.round(height)
      }
    });

    await browser.close();

    return new NextResponse(screenshotBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="PressCraft-Newspaper.png"'
      }
    });
  } catch (err: any) {
    console.error('Server-side export error:', err);
    return NextResponse.json({ error: err.message || 'Export failed' }, { status: 500 });
  }
}
