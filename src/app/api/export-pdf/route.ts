import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(req: NextRequest) {
  try {
    const { pages = [], css = '' } = await req.json();

    if (!pages || pages.length === 0) {
      return NextResponse.json({ error: 'Missing pages content' }, { status: 400 });
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
          @page {
            size: 297mm 420mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: #fcfbfa;
          }
          .pdf-page-break {
            page-break-after: always;
            break-after: page;
            width: 297mm;
            height: 420mm;
            overflow: hidden;
          }
          ${css || ''}
        </style>
      </head>
      <body>
        ${pages.map((pHTML: string) => `<div class="pdf-page-break">${pHTML}</div>`).join('')}
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
    await page.setContent(fullHTML, {
      waitUntil: ['load', 'networkidle0' as any]
    });

    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    });

    const pdfBuffer = await page.pdf({
      width: '297mm',
      height: '420mm',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });

    await browser.close();

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="PressCraft-Newspaper.pdf"'
      }
    });
  } catch (err: any) {
    console.error('Server-side PDF export error:', err);
    return NextResponse.json({ error: err.message || 'PDF Export failed' }, { status: 500 });
  }
}
