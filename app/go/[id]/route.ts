import { getJobById, recordClick } from '@/lib/jobs';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJobById(id);

  if (!job) {
    return NextResponse.redirect(new URL('/jobs', request.url));
  }

  await recordClick(id, request.headers.get('referer'));
  return NextResponse.redirect(job.applyUrl, 302);
}
