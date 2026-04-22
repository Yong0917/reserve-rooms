import { createClient } from '@/lib/supabase/server';
import { fetchAllUsersAdmin } from '@/lib/supabase/queries';
import UsersClient from './UsersClient';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const users = await fetchAllUsersAdmin(supabase);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>사용자 관리</h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)' }}>총 {users.length}명</p>
      </div>
      <div
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, overflow: 'hidden',
        }}
      >
        <UsersClient initialUsers={users} currentUserId={user?.id ?? ''} />
      </div>
    </div>
  );
}
