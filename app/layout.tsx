import './globals.css';
import type { Metadata } from 'next';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: 'JobPulse | US & Worldwide Jobs', template: '%s | JobPulse' },
  description: site.description,
  applicationName: site.name,
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
        <header className="header">
          <a className="brand" href="/">JobPulse</a>
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
            <div className="footerLinks"><a href="/about">About</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/sitemap.xml">Sitemap</a></div>
          </div>
          <div className="copyright">© {new Date().getFullYear()} JobPulse</div>
        </footer>
      </body>
    </html>
  );
}
