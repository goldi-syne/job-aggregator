import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy | JobPulse' };

export default function PrivacyPage() {
  return <section className="wrap contentPage">
    <h1>Privacy Policy</h1>
    <p>JobPulse is designed to work without requiring candidates to create an account. We may collect standard technical information such as page views, device/browser information, referral source and outbound apply clicks for analytics, security and service improvement.</p>
    <h2>Third-party services</h2>
    <p>We may use hosting, analytics and advertising providers. Those providers may process information according to their own privacy policies. When you click an application link, you leave JobPulse and the destination employer or application provider controls the information you submit there.</p>
    <h2>Cookies and advertising</h2>
    <p>Advertising or analytics providers may use cookies or similar technologies where permitted. We will update this page when specific advertising and analytics providers are activated.</p>
    <h2>Contact</h2>
    <p>For privacy questions, use the contact information published on this site.</p>
  </section>;
}
