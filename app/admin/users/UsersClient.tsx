'use client';

import { useState } from 'react';
import UserRow from '@/components/admin/UserRow';
import type { AdminUser } from '@/lib/types';

interface Props {
  initialUsers: AdminUser[];
  currentUserId: string;
}

export default function UsersClient({ initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState(initialUsers);

  const handleRoleChanged = (id: string, role: AdminUser['role']) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
  };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          {['이름', '팀', '데스크', '역할', '변경'].map((h) => (
            <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <UserRow key={u.id} user={u} currentUserId={currentUserId} onRoleChanged={handleRoleChanged} />
        ))}
      </tbody>
      {users.length === 0 && (
        <tfoot>
          <tr>
            <td colSpan={5} style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-2)', fontSize: 13 }}>
              사용자가 없습니다.
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}
