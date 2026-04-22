'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import type { AdminUser } from '@/lib/types';

interface UserRowProps {
  user: AdminUser;
  currentUserId: string;
  onRoleChanged: (id: string, role: AdminUser['role']) => void;
}

export default function UserRow({ user, currentUserId, onRoleChanged }: UserRowProps) {
  const [loading, setLoading] = useState(false);
  const isSelf = user.id === currentUserId;

  const handleToggleRole = async () => {
    const newRole = user.role === 'admin' ? 'employee' : 'admin';
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) onRoleChanged(user.id, newRole);
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr>
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'var(--accent-soft)', color: 'var(--accent)',
              display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700,
            }}
          >
            {user.name[0]}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{user.name}</div>
            {isSelf && <div style={{ fontSize: 11, color: 'var(--accent)' }}>본인</div>}
          </div>
        </div>
      </td>
      <td style={tdStyle}>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{user.team || '—'}</span>
      </td>
      <td style={tdStyle}>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{user.desk || '—'}</span>
      </td>
      <td style={tdStyle}>
        <span
          style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
            background: user.role === 'admin' ? 'var(--accent-soft)' : '#f1f5f9',
            color: user.role === 'admin' ? 'var(--accent)' : 'var(--text-2)',
          }}
        >
          {user.role === 'admin' ? '관리자' : '직원'}
        </span>
      </td>
      <td style={tdStyle}>
        <button
          onClick={handleToggleRole}
          disabled={loading || isSelf}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '5px 12px', borderRadius: 7, fontSize: 12, cursor: isSelf ? 'not-allowed' : 'pointer',
            border: '1px solid var(--border)', background: 'transparent',
            color: isSelf ? 'var(--text-3, var(--text-2))' : 'var(--text-2)',
            opacity: isSelf ? 0.4 : 1,
          }}
        >
          <Icon name="shield" size={12} />
          {loading ? '변경 중...' : user.role === 'admin' ? '직원으로 변경' : '관리자로 변경'}
        </button>
      </td>
    </tr>
  );
}

const tdStyle: React.CSSProperties = {
  padding: '10px 14px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle',
};
