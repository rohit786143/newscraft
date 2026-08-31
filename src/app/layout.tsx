import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PressCraft — Multi-Page Broadsheet Newspaper & e-Paper Publishing Studio',
  description:
    'Print-ready multi-column broadsheet newspaper and e-paper design studio with authentic Hindi & English publication presets.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi" style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700;800&family=Martel:wght@300;400;700;900&family=Noto+Serif+Devanagari:wght@400;600;700;800&family=Playfair+Display:ital,wght@0,600;0,800;1,600&family=Rozha+One&family=Tiro+Devanagari+Hindi:ital@0;1&family=Yatra+One&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', backgroundColor: '#020617' }}>
        {children}
      </body>
    </html>
  );
}


