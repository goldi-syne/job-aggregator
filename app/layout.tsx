import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';
import { site } from '@/lib/site';

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const gaId = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: 'JobPulse | US & Worldwide Jobs', template: '%s | JobPulse' },
  description: site.description,
  applicationName: site.name,
  icons: { icon: '/favicon.svg' },
  verification: googleVerification ? { google: googleVerification } : undefined,
  openGraph: {
    type: 'website',
    siteName: site.name,
    title: 'JobPulse | US & Worldwide Jobs',
    description: site.description,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JobPulse | US & Worldwide Jobs',
    description: site.description,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {gaId && <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}</Script>
        </>}
        <header className="header">
          <a className="brand" href="/"><span className="brandMark">JP</span>JobPulse</a>
          <nav>
            <a href="/jobs?country=US">US Jobs</a>
            <a href="/jobs">Worldwide</a>
            <a href="/jobs?remote=true">Remote</a>
            <a href="/about">About</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer>
          <div className="footerInner">
            <div><strong>JobPulse</strong><p>Find jobs globally and apply at the original source.</p></div>
            <div className="footerLinks"><a href="/about">About</a><a href="/contact">Contact</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/sitemap.xml">Sitemap</a></div>
          </div>
          <div className="copyright">© {new Date().getFullYear()} JobPulse · JobPulse is a job discovery portal, not a recruitment agency.</div>
        </footer>
      </body>
    </html>
  );
}
