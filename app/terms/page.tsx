import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Use | JobPulse' };

export default function TermsPage() {
  return <section className="wrap contentPage">
    <h1>Terms of Use</h1>
    <p>JobPulse provides job-discovery information and links to original application sources. We do not guarantee that a listing remains open, that all details are complete, or that an employer will respond to an application.</p>
    <h2>Applications</h2>
    <p>Applications are completed on third-party employer or applicant-tracking-system websites. Their terms and privacy policies apply after you leave JobPulse.</p>
    <h2>Content</h2>
    <p>JobPulse may normalize or summarize factual job information for discovery. Employers or source owners can request corrections or removal of inaccurate listings.</p>
    <h2>Acceptable use</h2>
    <p>Do not misuse the site, interfere with its operation, attempt unauthorized access, or use automated activity that harms the service.</p>
  </section>;
}
