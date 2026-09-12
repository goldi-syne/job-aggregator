import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Contact', description: 'Contact JobPulse about job listings, corrections and portal feedback.' };

export default function ContactPage(){
  const email=process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return <section className="wrap contentPage">
    <span className="eyebrow">CONTACT JOBPULSE</span>
    <h1>Contact us</h1>
    <p>Use this page for listing corrections, expired jobs, employer requests, copyright concerns, or general feedback about JobPulse.</p>
    <h2>Listing corrections or removal</h2>
    <p>If a job is no longer available or contains incorrect information, include the JobPulse job URL and the employer or official source URL so it can be reviewed quickly.</p>
    <h2>Employers and job sources</h2>
    <p>JobPulse is a job discovery portal. Applications are sent to the original employer or ATS source. We do not charge candidates to apply.</p>
    <h2>Contact</h2>
    {email ? <p><a className="buttonSecondary" href={`mailto:${email}`}>{email}</a></p> : <p>Contact details are being prepared for the soft launch.</p>}
  </section>;
}
