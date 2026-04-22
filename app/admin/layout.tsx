import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminNav from '@/components/admin/AdminNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role, name')
    .eq('id', user.id)
    .single();

  if (!profile || (profile as { role: string }).role !== 'admin') redirect('/');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <AdminNav adminName={(profile as { name: string }).name} />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 40px' }}>
        {children}
      </main>
    </div>
  );
}
