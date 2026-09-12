import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import AdminJobsClient from './AdminJobsClient';
import DeleteInactiveButton from './DeleteInactiveButton';

export default async function AdminJobsPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');
  return <>
    <DeleteInactiveButton />
    <AdminJobsClient />
  </>;
}
