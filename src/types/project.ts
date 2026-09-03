/**
 * PressCraft E-Newspaper Editor - Project & State Types
 */

export interface OverlayWidgetConfig {
  id: string;
  name: string;
  visible: boolean;
  xPercent: number; // 0% to 100%
  yPercent: number; // 0% to 100%
  fontSize: number; // in pt/px
  fontColor: string;
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | '600' | '800';
  isItalic: boolean;
  content?: string;
}

export interface HeaderOverlayState {
  bannerImage: string | null;
  bannerHeight: number;
  isEditMode: boolean;
  widgets: {
    date: OverlayWidgetConfig;
    weather: OverlayWidgetConfig;
    metadata: OverlayWidgetConfig;
    [key: string]: OverlayWidgetConfig;
  };
}

export interface NewsSection {
  id: string;
  type: 'standard' | 'lead' | 'anchor' | 'ad' | 'custom';
  layout: 'top-img' | 'left-img' | 'right-img' | 'no-img' | 'hero-split' | 'full-ad' | string;
  bodyCols?: number;
  tag?: string;
  tagBgColor?: string;
  tagTextColor?: string;
  tagFont?: string;
  tagFontSize?: string;
  tagBold?: boolean;
  topLine?: string;
  topLineFont?: string;
  topLineSize?: string;
  topLineColor?: string;
  topLineBold?: boolean;
  topLineItalic?: boolean;
  topLineAlign?: 'left' | 'center' | 'right';
  location?: string;
  title: string;
  titleFont?: string;
  fontSize?: string;
  titleColor?: string;
  titleAlign?: 'left' | 'center' | 'right' | 'justify';
  subtitle?: string;
  subtitleFont?: string;
  subtitleSize?: string;
  subtitleColor?: string;
  subtitleAlign?: 'left' | 'center' | 'right';
  image?: string; // base64 or URL
  caption?: string;
  captionFont?: string;
  captionSize?: string;
  captionColor?: string;
  captionAlign?: 'left' | 'center' | 'right';
  content?: string;
  bodyFont?: string;
  bodySize?: string;
  bodyColor?: string;
  bodyAlign?: 'left' | 'center' | 'right' | 'justify';
  dropCap?: boolean;
  colSpan: number; // 1 to 12
  imageHeight?: number;
  imageFit?: 'cover' | 'contain' | 'fill';
  showSizeBadge?: boolean;
  showAdTag?: boolean;
  adTagText?: string;
  borderStyle?: string;
  bgColor?: string;
  clearRow?: boolean;
  // Card Border & Frame Customization
  showCardBorder?: boolean;
  cardBorderStyle?: 'solid' | 'double' | 'dashed' | 'dotted' | 'newspaper-vintage' | 'thick-bottom' | string;
  cardBorderColor?: string;
  cardBorderWidth?: number;
  cardBorderRadius?: number;
  cardPadding?: number;
  // Text-Wrap and Cutout Parameters
  cutoutWrap?: boolean;
  cutoutFloat?: 'left' | 'right';
  cutoutMargin?: number;
  cutoutWidth?: number;
  cutoutOffsetX?: number;
  cutoutOffsetY?: number;
}

export interface PageItem {
  id: string;
  name: string;
  category?: string;
  mastheadType?: 'full' | 'compact' | 'custom' | 'none';
  innerHeaderStyle?: string;
  customHeaderImage?: string | null;
  customHeaderHeight?: number;
  sections: NewsSection[];
}

export interface PaperMeta {
  pageSize: '11x17' | '11x14' | '14x22' | string;
  title: string;
  titleFont?: string;
  titleSize?: string;
  titleColor?: string;
  titleAlign?: 'left' | 'center' | 'right';
  titleBold?: boolean;
  titleItalic?: boolean;
  titleUnderline?: boolean;
  website?: string;
  tagline?: string;
  taglineFont?: string;
  taglineSize?: string;
  taglineColor?: string;
  taglineItalic?: boolean;
  taglineAlign?: 'left' | 'center' | 'right';
  edition?: string;
  date?: string;
  vol?: string;
  regNo?: string;
  price?: string;
  showWeather?: boolean;
  weatherShimla?: string;
  weatherDharamshala?: string;
  weatherMandi?: string;
  weatherAstro?: string;
  rightAdTitle?: string;
  rightAdText?: string;
  rightAdTag?: string;
  showAds?: boolean;
  subHeaderStyle?: string;
  customSubHeaderHeight?: number;
  defaultHeadlineFont?: string;
  defaultBodyFont?: string;
  customHeaderOverlay?: HeaderOverlayState;
  [key: string]: any;
}

export interface EditorState {
  activePageIndex: number;
  paperMeta: PaperMeta;
  pages: PageItem[];
  customHeaderState?: HeaderOverlayState;
  version?: string;
}

export interface SavedProject {
  id: string;
  name: string;
  thumbnail: string; // Base64 data URL preview of page 1
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
  pageSize: string; // '11x17', '11x14', '14x22'
  pageCount: number;
  sectionCount: number;
  stateData: EditorState;
}
