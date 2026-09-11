import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JobPulse | Jobs in the US & Worldwide',
  description: 'Discover fresh jobs across the United States and worldwide, then apply on the original employer website.',
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
          </nav>
        </header>
        <main>{children}</main>
        <footer>© {new Date().getFullYear()} JobPulse · Find jobs globally and apply at the original source.</footer>
      </body>
    </html>
  );
}
