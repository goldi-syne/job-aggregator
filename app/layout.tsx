import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JobPulse India | Latest Jobs',
  description: 'Discover fresh jobs across India and apply on the original employer website.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <a className="brand" href="/">JobPulse India</a>
          <nav><a href="/jobs">Latest Jobs</a><a href="/jobs?experience=fresher">Freshers</a><a href="/jobs?remote=true">Remote</a></nav>
        </header>
        <main>{children}</main>
        <footer>© {new Date().getFullYear()} JobPulse India · We link candidates to original application sources.</footer>
      </body>
    </html>
  );
}
