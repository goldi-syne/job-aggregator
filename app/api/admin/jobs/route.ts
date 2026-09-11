import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getSupabaseAdminClient } from '@/lib/supabase';

function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100); }
function text(v: unknown) { return typeof v === 'string' ? v.trim() : ''; }
function bool(v: unknown) { return v === true || String(v).toLowerCase() === 'true' || String(v).toLowerCase() === 'yes'; }
function countryCode(country: string) { const x=country.toLowerCase(); if(x.includes('united states')||x==='usa'||x==='us') return 'US'; if(x==='india') return 'IN'; if(x==='canada') return 'CA'; if(x.includes('united kingdom')||x==='uk') return 'GB'; if(x==='australia') return 'AU'; return ''; }

function normalize(raw: Record<string, unknown>) {
  const title=text(raw.title), company=text(raw.company), applyUrl=text(raw.apply_url || raw.applyUrl);
  if (!title || !company || !applyUrl) throw new Error('title, company and apply_url are required');
  const country=text(raw.country), city=text(raw.city), state=text(raw.state), location=text(raw.location) || [city,state,country].filter(Boolean).join(', ') || 'Location not specified';
  const source=text(raw.source) || 'Manual';
  const uid=crypto.randomUUID();
  return {
    source_job_id:`manual-${uid}`,
    slug:`${slugify(title)}-${slugify(company)}-${uid.slice(0,8)}`,
    title, company, location,
    experience:text(raw.experience),
    job_type:text(raw.job_type || raw.jobType) || 'Full time',
    skills:Array.isArray(raw.skills) ? raw.skills.map(String).map(s=>s.trim()).filter(Boolean) : text(raw.skills).split(',').map(s=>s.trim()).filter(Boolean),
    summary:text(raw.summary) || `${company} is hiring for ${title}. Review the original posting for complete responsibilities, qualifications and application details.`,
    apply_url:applyUrl,
    source,
    source_url:text(raw.source_url || raw.sourceUrl) || null,
    posted_at:text(raw.posted_at || raw.postedAt) || new Date().toISOString(),
    expires_at:text(raw.expires_at || raw.expiresAt) || null,
    remote:bool(raw.remote),
    country_code:text(raw.country_code || raw.countryCode) || countryCode(country),
    country, state, city,
    work_mode:text(raw.work_mode || raw.workMode) || (bool(raw.remote) ? 'Remote' : 'On-site'),
    category:text(raw.category),
    salary_min:text(raw.salary_min || raw.salaryMin) || null,
    salary_max:text(raw.salary_max || raw.salaryMax) || null,
    salary_currency:text(raw.salary_currency || raw.salaryCurrency) || 'USD',
    status:text(raw.status) || 'active',
    updated_at:new Date().toISOString(),
  };
}

type NormalizedJob = ReturnType<typeof normalize>;
type ExistingJob = { apply_url: string };

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({error:'Unauthorized'},{status:401});
  const {data,error}=await getSupabaseAdminClient().from('jobs').select('id,title,company,location,source,status,posted_at,apply_url').order('created_at',{ascending:false}).limit(100);
  return error ? NextResponse.json({error:error.message},{status:500}) : NextResponse.json({jobs:data||[]});
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({error:'Unauthorized'},{status:401});
  const body: Record<string, unknown> = await request.json().catch(()=>({}));
  const jobsValue = body.jobs;
  const rawJobs: Record<string, unknown>[] = Array.isArray(jobsValue)
    ? jobsValue.filter((job): job is Record<string, unknown> => Boolean(job) && typeof job === 'object' && !Array.isArray(job))
    : [((body.job && typeof body.job === 'object' && !Array.isArray(body.job)) ? body.job : body) as Record<string, unknown>];
  if (!rawJobs.length || rawJobs.length>500) return NextResponse.json({error:'Upload 1 to 500 jobs at a time'},{status:400});
  try {
    const rows: NormalizedJob[] = rawJobs.map(normalize);
    const urls = rows.map((row: NormalizedJob) => row.apply_url);
    const {data:existing}=await getSupabaseAdminClient().from('jobs').select('apply_url').in('apply_url',urls);
    const existingSet = new Set(((existing || []) as ExistingJob[]).map((row: ExistingJob) => row.apply_url));
    const unique = rows.filter((row: NormalizedJob) => !existingSet.has(row.apply_url));
    if (!unique.length) return NextResponse.json({inserted:0,skipped:rows.length});
    const {error}=await getSupabaseAdminClient().from('jobs').insert(unique);
    if(error) throw new Error(error.message);
    return NextResponse.json({inserted:unique.length,skipped:rows.length-unique.length});
  } catch(error) {
    return NextResponse.json({error:error instanceof Error?error.message:'Import failed'},{status:400});
  }
}
