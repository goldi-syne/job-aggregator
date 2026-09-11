import { jobs } from '@/lib/jobs';
import { NextResponse } from 'next/server';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){ const {id}=await params; const job=jobs.find(j=>j.id===id); if(!job) return NextResponse.redirect(new URL('/jobs',_.url)); return NextResponse.redirect(job.applyUrl,302); }
