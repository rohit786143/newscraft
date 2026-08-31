import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let browser = null;
  try {
    const { html, styles = '', links = [], format = 'png', pages = [] } = await req.json();

    if (!html && (!pages || pages.length === 0)) {
      return NextResponse.json({ error: 'No HTML content provided' }, { status: 400 });
    }

    browser = await puppeteer.launch({
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

    // 1. PDF MULTI-PAGE OR SINGLE PAGE EXPORT
    if (format === 'pdf') {
      const pageList = pages.length > 0 ? pages : [html];
      const fullPDFPayload = `
        <!DOCTYPE html>
        <html lang="hi">
        <head>
          <meta charset="UTF-8">
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Inter:wght@300;400;500;600;700;800&family=Martel:wght@400;600;700;800;900&family=Noto+Serif+Devanagari:wght@400;500;600;700;800;900&family=Rozha+One&family=Tiro+Devanagari+Hindi:ital@0;1&family=Yatra+One&display=swap" rel="stylesheet">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
          ${links.map((l: string) => `<link rel="stylesheet" href="${l}">`).join('\n')}
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
            .pdf-sheet {
              page-break-after: always;
              break-after: page;
              width: 297mm;
              height: 420mm;
              overflow: hidden;
              position: relative;
            }
            ${styles}
          </style>
        </head>
        <body>
          ${pageList.map((pHtml: string) => `<div class="pdf-sheet">${pHtml}</div>`).join('\n')}
        </body>
        </html>
      `;

      await page.setViewport({ width: 1200, height: 1700, deviceScaleFactor: 2 });
      await page.setContent(fullPDFPayload, { waitUntil: 'networkidle0' });
      await page.evaluateHandle('document.fonts.ready');

      const pdfBuffer = await page.pdf({
        width: '297mm',
        height: '420mm',
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
      });

      await browser.close();

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="PressCraft-Newspaper.pdf"'
        }
      });
    }

    // 2. PNG HIGH-RES 100% WYSIWYG SCREENSHOT EXPORT
    const fullHTMLPayload = `
      <!DOCTYPE html>
      <html lang="hi">
      <head>
        <meta charset="UTF-8">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Inter:wght@300;400;500;600;700;800&family=Martel:wght@400;600;700;800;900&family=Noto+Serif+Devanagari:wght@400;500;600;700;800;900&family=Rozha+One&family=Tiro+Devanagari+Hindi:ital@0;1&family=Yatra+One&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        ${links.map((l: string) => `<link rel="stylesheet" href="${l}">`).join('\n')}
        <style>
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            background: #fcfbfa;
            width: 1122.5px;
            height: 1587.4px;
            overflow: hidden;
          }
          #newspaperCanvas, .newspaper-page {
            margin: 0 !important;
            box-shadow: none !important;
            transform: none !important;
            width: 1122.5px !important;
            height: 1587.4px !important;
            min-height: 1587.4px !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
          }
          ${styles}
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;

    await page.setViewport({
      width: 1123,
      height: 1588,
      deviceScaleFactor: 2 // 2x Crisp Print Quality (300 DPI)
    });

    await page.setContent(fullHTMLPayload, { waitUntil: 'networkidle0' });
    await page.evaluateHandle('document.fonts.ready');

    const imageBuffer = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: 1123,
        height: 1588
      }
    });

    await browser.close();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="PressCraft-Newspaper.png"'
      }
    });
  } catch (err: any) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    console.error('Server-side export error:', err);
    return NextResponse.json({ error: err.message || 'Export failed' }, { status: 500 });
  }
}
