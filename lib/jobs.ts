export type Job = {
  id: string; slug: string; title: string; company: string; location: string;
  experience: string; jobType: string; skills: string[]; summary: string;
  applyUrl: string; source: string; postedAt: string; remote?: boolean;
};

export const jobs: Job[] = [
  { id:'1', slug:'soc-analyst-pune-demo', title:'SOC Analyst', company:'Demo Technology', location:'Pune, Maharashtra', experience:'0–2 years', jobType:'Full time', skills:['SIEM','Microsoft Sentinel','EDR'], summary:'Monitor security alerts, investigate incidents and support SOC operations. This sample listing demonstrates the job-page format.', applyUrl:'https://example.com', source:'Employer career page', postedAt:'2026-09-11' },
  { id:'2', slug:'cloud-support-bengaluru-demo', title:'Cloud Support Engineer', company:'Demo Cloud', location:'Bengaluru, Karnataka', experience:'0–2 years', jobType:'Full time', skills:['AWS','Linux','Networking'], summary:'Support cloud infrastructure and troubleshoot customer environments. Sample data only.', applyUrl:'https://example.com', source:'Employer career page', postedAt:'2026-09-11' },
  { id:'3', slug:'security-engineer-remote-demo', title:'Junior Security Engineer', company:'Demo Security', location:'Remote, India', experience:'Fresher', jobType:'Full time', skills:['Security','Networking','Python'], summary:'Assist with security monitoring, vulnerability management and automation. Sample data only.', applyUrl:'https://example.com', source:'Employer career page', postedAt:'2026-09-11', remote:true }
];

export function getJob(slug: string) { return jobs.find(j => j.slug === slug); }
