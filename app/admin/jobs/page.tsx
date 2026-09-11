import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import AdminJobsClient from './AdminJobsClient';

export default async function AdminJobsPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');
  return <AdminJobsClient />;
}
