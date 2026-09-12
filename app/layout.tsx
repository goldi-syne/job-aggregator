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
          <a className="brand" href="/" aria-label="JobPulse home"><span className="brandMark">JP</span><span>JobPulse</span></a>
          <nav aria-label="Primary navigation">
            <a href="/jobs?country=US">US Jobs</a>
            <a href="/jobs">Worldwide</a>
            <a href="/jobs?remote=true">Remote</a>
            <a href="/about">About</a>
          </nav>
          <a className="headerCta" href="/jobs">Browse jobs</a>
        </header>
        <main>{children}</main>
        <footer>
          <div className="footerInner">
            <div className="footerBrand"><a className="brand" href="/"><span className="brandMark">JP</span><span>JobPulse</span></a><p>Discover jobs globally and apply on the original employer or ATS website.</p><small>JobPulse never charges candidates to browse or apply.</small></div>
            <div className="footerLinks"><a href="/jobs">Jobs</a><a href="/about">About</a><a href="/contact">Contact</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/sitemap.xml">Sitemap</a></div>
          </div>
          <div className="copyright">© {new Date().getFullYear()} JobPulse · Job discovery portal, not a recruitment agency.</div>
        </footer>
      </body>
    </html>
  );
}
