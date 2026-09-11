import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'About JobPulse' };

export default function AboutPage() {
  return <section className="wrap contentPage">
    <span className="eyebrow">ABOUT JOBPULSE</span>
    <h1>One place to discover jobs. One click to apply at the source.</h1>
    <p>JobPulse indexes publicly available job opportunities from employer career sites and supported applicant-tracking systems. We focus on the United States while supporting worldwide roles.</p>
    <h2>How it works</h2>
    <p>We normalize job titles, locations, work modes, skills and other useful details so candidates can search quickly. When you choose to apply, JobPulse redirects you to the original employer or authorized application source.</p>
    <h2>What JobPulse is not</h2>
    <p>JobPulse is not the employer and does not make hiring decisions. Job details can change after we index them, so candidates should always verify the final requirements, salary, location and application terms on the original source.</p>
  </section>;
}
