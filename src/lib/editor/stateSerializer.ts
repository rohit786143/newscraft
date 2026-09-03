/**
 * PressCraft State Serializer and Hydration Engine
 * Safely captures full canvas configurations:
 * - Selected page size
 * - Header setup (custom images and dynamic overlay positions/widgets)
 * - All news slots & advertisements
 * - Headlines, text blocks, body styling
 * - Uploaded image base64/blob URLs
 * - Text-wrap parameters (cutoutWrap, float, margin, width, offset)
 */

import { EditorState, SavedProject, HeaderOverlayState, PaperMeta, PageItem } from '@/types/project';

/**
 * Default fallback template state
 */
export const DEFAULT_STUDIO_STATE: EditorState = {
  activePageIndex: 0,
  version: '3.0.0',
  paperMeta: {
    pageSize: '11x17',
    title: 'हिमाचल न्यूज़',
    titleFont: "'Rozha One', serif",
    titleSize: '56px',
    titleColor: '#dc2626',
    titleAlign: 'center',
    titleBold: true,
    titleItalic: false,
    titleUnderline: false,
    website: 'himachalnews.co',
    tagline: 'हिमाचल प्रदेश का नंबर 1 दैनिक समाचार पत्र',
    taglineFont: "'Martel', serif",
    taglineSize: '12px',
    taglineColor: '#334155',
    taglineItalic: true,
    taglineAlign: 'center',
    edition: 'शिमला - धर्मशाला - मंडी संस्करण',
    date: '',
    vol: 'वर्ष 24 | अंक 182',
    regNo: 'HP/SML/04/2024-26',
    price: '₹ 5.00',
    showWeather: true,
    weatherShimla: '21°/16° 🌧️',
    weatherDharamshala: '28°/18° ⛅',
    weatherMandi: '30°/20° ☀️',
    weatherAstro: 'सूर्योदय: 05:58 • सूर्यास्त: 06:45 • AQI: 42',
    rightAdTitle: 'सोलन सेविंग्स बैंक',
    rightAdText: 'एफडी पर 8.5% विशेष ब्याज दर।',
    rightAdTag: 'विज्ञापन',
    showAds: true,
    subHeaderStyle: 'broadsheet-classic',
    customSubHeaderHeight: 32,
    defaultHeadlineFont: "'Rozha One', serif",
    defaultBodyFont: "'Martel', serif"
  },
  pages: [
    {
      id: 'page-1',
      name: 'मुख्य पृष्ठ (Front Page)',
      category: 'Front Page',
      mastheadType: 'full',
      sections: [
        {
          id: 'sec-lead',
          type: 'lead',
          layout: 'hero-split',
          bodyCols: 2,
          tag: 'सुपर लीड ब्रेकिंग न्यूज़',
          tagBgColor: '#0369a1',
          tagTextColor: '#ffffff',
          tagFont: "'Mukta', sans-serif",
          tagFontSize: '10px',
          tagBold: true,
          topLine: 'इस मॉनसून सीजन में बारिश, भूस्खलन और हादसों के कारण मरने वालों का आंकड़ा 250 पार',
          topLineFont: "'Mukta', sans-serif",
          topLineSize: '13px',
          topLineColor: '#dc2626',
          topLineBold: true,
          topLineItalic: false,
          topLineAlign: 'left',
          location: 'शिमला',
          title: 'शिमला-मनाली फोरलेन प्रोजेक्ट पर केंद्र का बड़ा फैसला: ₹4,500 करोड़ की नई राहत राशि मंजूर',
          titleFont: "'Rozha One', serif",
          fontSize: '26px',
          titleColor: '#111111',
          titleAlign: 'left',
          subtitle: 'केंद्रीय भू-भूतल परिवहन मंत्रालय ने जारी की अधिसूचना; अगले महीने से सभी टनल पर कार्य शुरू होगा।',
          subtitleFont: "'Martel', serif",
          subtitleSize: '13px',
          subtitleColor: '#334155',
          subtitleAlign: 'left',
          image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
          caption: 'फोटो: कुल्लू घाटी के समीप निर्माणाधीन फोरलेन हाईवे तथा नए बायपास टनल का दृश्य। (प्रेस क्राफ्ट फोटो)',
          content: 'हिमाचल प्रदेश के बुनियादी ढांचे और पर्यटन उद्योग के लिए आज का दिन ऐतिहासिक साबित हुआ। केंद्र सरकार ने लंबे समय से लंबित शिमला-मनाली राष्ट्रीय राजमार्ग चौड़ीकरण परियोजना के लिए अतिरिक्त 4,500 करोड़ रुपये के विशेष पैकेज को अंतिम स्वीकृति प्रदान कर दी है।\n\nनई दिल्ली में आयोजित उच्चस्तरीय बैठक के बाद केंद्रीय मंत्री ने कहा कि पहाड़ी राज्यों में ऑल-वेदर कनेक्टिविटी हमारी सर्वोच्च प्राथमिकता है। इस परियोजना के पूर्ण होने से चंडीगढ़ से मनाली का सफर मात्र 5 घंटे में पूरा हो सकेगा।',
          bodyFont: "'Martel', serif",
          bodySize: '11px',
          bodyColor: '#111111',
          bodyAlign: 'justify',
          dropCap: false,
          colSpan: 8,
          imageHeight: 180,
          imageFit: 'cover',
          cutoutWrap: false,
          cutoutFloat: 'left',
          cutoutMargin: 2,
          cutoutWidth: 200,
          cutoutOffsetX: 0,
          cutoutOffsetY: 0
        }
      ]
    }
  ]
};

/**
 * Deep clones and serializes the current editor state
 */
export function serializeEditorState(
  state: EditorState,
  customHeaderState?: HeaderOverlayState
): EditorState {
  const cloned: EditorState = JSON.parse(JSON.stringify(state));

  // Merge custom header state into serialized payload if provided
  if (customHeaderState) {
    cloned.customHeaderState = JSON.parse(JSON.stringify(customHeaderState));
    if (!cloned.paperMeta) {
      cloned.paperMeta = { ...DEFAULT_STUDIO_STATE.paperMeta };
    }
    cloned.paperMeta.customHeaderOverlay = JSON.parse(JSON.stringify(customHeaderState));
  }

  // Ensure default version
  cloned.version = cloned.version || '3.0.0';

  return cloned;
}

/**
 * Hydrates and validates a project's state data into the active editor
 */
export function loadEditorState(projectData: SavedProject | EditorState): EditorState {
  // Extract raw stateData if given a SavedProject container
  const rawState: EditorState = 'stateData' in projectData ? projectData.stateData : projectData;

  if (!rawState || !Array.isArray(rawState.pages) || rawState.pages.length === 0) {
    console.warn('Invalid editor state provided for hydration. Falling back to default.');
    return JSON.parse(JSON.stringify(DEFAULT_STUDIO_STATE));
  }

  const hydratedState: EditorState = JSON.parse(JSON.stringify(rawState));

  // 1. Sanitize paperMeta
  hydratedState.paperMeta = Object.assign({}, DEFAULT_STUDIO_STATE.paperMeta, hydratedState.paperMeta || {});
  if (!hydratedState.paperMeta.pageSize) hydratedState.paperMeta.pageSize = '11x17';
  if (!hydratedState.paperMeta.subHeaderStyle) hydratedState.paperMeta.subHeaderStyle = 'broadsheet-classic';
  if (hydratedState.paperMeta.customSubHeaderHeight === undefined) hydratedState.paperMeta.customSubHeaderHeight = 32;

  // 2. Sanitize and validate every page and slot
  hydratedState.pages.forEach((page: PageItem, pIdx: number) => {
    if (!page.id) page.id = `page-${pIdx + 1}`;
    if (!page.name) page.name = `पृष्ठ ${pIdx + 1}`;
    if (!page.mastheadType) page.mastheadType = pIdx === 0 ? 'full' : 'compact';
    if (!Array.isArray(page.sections)) page.sections = [];

    page.sections.forEach((sec) => {
      // Default styles and text-wrap fields
      if (sec.dropCap === undefined) sec.dropCap = false;
      if (sec.tagBgColor === undefined) sec.tagBgColor = '#0284c7';
      if (sec.tagTextColor === undefined) sec.tagTextColor = '#ffffff';
      if (sec.tagFont === undefined) sec.tagFont = "'Mukta', sans-serif";
      if (sec.tagFontSize === undefined) sec.tagFontSize = '10px';
      if (sec.tagBold === undefined) sec.tagBold = true;
      if (sec.topLineColor === undefined) sec.topLineColor = '#dc2626';
      if (sec.topLineFont === undefined) sec.topLineFont = "'Mukta', sans-serif";
      if (sec.topLineSize === undefined) sec.topLineSize = '12.5px';
      if (sec.topLineBold === undefined) sec.topLineBold = true;
      if (sec.topLineAlign === undefined) sec.topLineAlign = 'left';
      if (sec.imageHeight === undefined) sec.imageHeight = sec.layout === 'full-ad' ? 220 : 180;
      if (sec.imageFit === undefined) sec.imageFit = 'cover';
      if (sec.showSizeBadge === undefined) sec.showSizeBadge = true;
      if (sec.showAdTag === undefined) sec.showAdTag = true;
      if (sec.adTagText === undefined) sec.adTagText = 'विज्ञापन';
      if (sec.cutoutWrap === undefined) sec.cutoutWrap = false;
      if (sec.cutoutFloat === undefined) sec.cutoutFloat = 'left';
      if (sec.cutoutMargin === undefined || sec.cutoutMargin > 4) sec.cutoutMargin = 2;
      if (sec.cutoutWidth === undefined) sec.cutoutWidth = 200;
      if (sec.cutoutOffsetX === undefined) sec.cutoutOffsetX = 0;
      if (sec.cutoutOffsetY === undefined) sec.cutoutOffsetY = 0;
    });
  });

  // 3. Ensure valid activePageIndex
  if (
    typeof hydratedState.activePageIndex !== 'number' ||
    hydratedState.activePageIndex < 0 ||
    hydratedState.activePageIndex >= hydratedState.pages.length
  ) {
    hydratedState.activePageIndex = 0;
  }

  return hydratedState;
}

/**
 * Capture a scaled, crisp thumbnail base64 image from the newspaper DOM element
 */
export async function generateProjectThumbnail(targetElementId: string = 'newspaperCanvas'): Promise<string> {
  if (typeof window === 'undefined') return '';

  const target = document.getElementById(targetElementId) || document.getElementById('newspaperWrapper');
  if (!target) {
    return generateFallbackThumbnail();
  }

  try {
    const htmlToImageLib = (window as any).htmlToImage;
    if (htmlToImageLib && typeof htmlToImageLib.toJpeg === 'function') {
      const dataUrl = await htmlToImageLib.toJpeg(target, {
        quality: 0.85,
        pixelRatio: 0.35, // Lightweight preview thumbnail (~300px wide)
        backgroundColor: '#fcfbfa'
      });
      return dataUrl;
    }

    const html2canvasLib = (window as any).html2canvas;
    if (html2canvasLib) {
      const canvas = await html2canvasLib(target, {
        scale: 0.35,
        backgroundColor: '#fcfbfa',
        logging: false,
        useCORS: true
      });
      return canvas.toDataURL('image/jpeg', 0.82);
    }
  } catch (err) {
    console.warn('Error creating DOM snapshot thumbnail:', err);
  }

  return generateFallbackThumbnail();
}

/**
 * Realistic Newspaper First-Page Preview SVG representation
 */
export function generateFallbackThumbnail(project?: Partial<SavedProject>): string {
  const meta = project?.stateData?.paperMeta || DEFAULT_STUDIO_STATE.paperMeta;
  const title = meta.title || project?.name || 'दिव्य हिमाचल';
  const pages = project?.stateData?.pages || DEFAULT_STUDIO_STATE.pages;
  const page1 = pages[0] || null;
  const leadSec = page1?.sections?.[0] || null;

  const rawHeadline = leadSec?.title || 'शिमला-मनाली फोरलेन प्रोजेक्ट पर बड़ा फैसला';
  const headline = rawHeadline.length > 40 ? rawHeadline.slice(0, 40) + '...' : rawHeadline;
  const rawSub = leadSec?.subtitle || 'बुनियादी ढांचे और पर्यटन को मिलेगा नया बढ़ावा';
  const subline = rawSub.length > 52 ? rawSub.slice(0, 52) + '...' : rawSub;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420" fill="#fcfbfa">
    <rect width="300" height="420" fill="#fcfbfa" stroke="#cbd5e1" stroke-width="2"/>
    <rect x="10" y="8" width="280" height="13" fill="#0f172a" rx="1"/>
    <text x="16" y="17.5" fill="#f8fafc" font-size="7.5" font-family="sans-serif" font-weight="bold">${meta.edition || 'शिमला संस्करण'}</text>
    <text x="150" y="17.5" fill="#94a3b8" font-size="7" font-family="sans-serif" text-anchor="middle">${meta.date || 'दैनिक संस्करण'}</text>
    <text x="284" y="17.5" fill="#fbbf24" font-size="7.5" font-family="sans-serif" font-weight="bold" text-anchor="end">${meta.price || '₹ 5.00'}</text>
    
    <text x="150" y="47" fill="#dc2626" font-size="22" font-family="serif" font-weight="900" text-anchor="middle">${title}</text>
    <line x1="10" y1="55" x2="290" y2="55" stroke="#111111" stroke-width="2"/>
    <line x1="10" y1="58" x2="290" y2="58" stroke="#111111" stroke-width="0.8"/>
    
    <rect x="10" y="65" width="75" height="12" fill="#0284c7" rx="1.5"/>
    <text x="14" y="73.5" fill="#ffffff" font-size="7" font-family="sans-serif" font-weight="bold">सुपर ब्रेकिंग न्यूज़</text>
    <text x="10" y="90" fill="#0f172a" font-size="11.5" font-family="serif" font-weight="bold">${headline}</text>
    <text x="10" y="103" fill="#475569" font-size="8" font-family="serif">${subline}</text>
    
    <rect x="10" y="112" width="165" height="98" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1" rx="2"/>
    <text x="92" y="165" fill="#64748b" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">मुख्य फोटो</text>
    
    <rect x="183" y="112" width="107" height="6" fill="#cbd5e1" rx="1"/>
    <rect x="183" y="122" width="107" height="6" fill="#e2e8f0" rx="1"/>
    <rect x="183" y="132" width="107" height="6" fill="#cbd5e1" rx="1"/>
    <rect x="183" y="142" width="107" height="6" fill="#e2e8f0" rx="1"/>
    <rect x="183" y="152" width="107" height="6" fill="#cbd5e1" rx="1"/>
    <rect x="183" y="162" width="107" height="6" fill="#e2e8f0" rx="1"/>
    
    <line x1="10" y1="216" x2="290" y2="216" stroke="#94a3b8" stroke-width="1"/>
    
    <rect x="10" y="224" width="88" height="182" fill="#ffffff" stroke="#e2e8f0" rx="2"/>
    <rect x="16" y="230" width="76" height="52" fill="#e2e8f0" rx="1"/>
    <rect x="16" y="288" width="76" height="7" fill="#0f172a" rx="1"/>
    
    <rect x="104" y="224" width="88" height="182" fill="#ffffff" stroke="#e2e8f0" rx="2"/>
    <rect x="110" y="230" width="76" height="52" fill="#e2e8f0" rx="1"/>
    <rect x="110" y="288" width="76" height="7" fill="#0f172a" rx="1"/>
    
    <rect x="198" y="224" width="92" height="182" fill="#fffbeb" stroke="#fde68a" stroke-width="1" rx="2"/>
    <text x="244" y="272" fill="#b45309" font-size="8.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">📢 विशेष विज्ञापन</text>
  </svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
