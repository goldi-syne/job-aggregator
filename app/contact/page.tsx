import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Contact', description: 'Contact JobPulse about job listings, corrections and portal feedback.' };

export default function ContactPage(){
  return <section className="wrap contentPage">
    <span className="eyebrow">CONTACT JOBPULSE</span>
    <h1>Contact us</h1>
    <p>Use this page for listing corrections, expired jobs, employer requests, copyright concerns, or general feedback about JobPulse.</p>
    <h2>Listing corrections or removal</h2>
    <p>If a job is no longer available or contains incorrect information, send the JobPulse job URL and the employer or official source URL so we can review it quickly.</p>
    <h2>Employers and job sources</h2>
    <p>JobPulse is a job discovery portal. Applications are sent to the original employer or ATS source. We do not charge candidates to apply.</p>
    <h2>Email</h2>
    <p><a className="buttonSecondary" href="mailto:contact@jobpulse.example">contact@jobpulse.example</a></p>
    <p className="muted">Before public launch, replace this placeholder email with your real support email using the site code or your custom domain mailbox.</p>
  </section>;
}
