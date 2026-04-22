'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';

interface Props { roomId: string; roomName: string }

export default function RoomDeleteButton({ roomId, roomName }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      await fetch(`/api/admin/rooms/${roomId}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={handleDelete} disabled={loading}
          style={{ ...btn, background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
        >
          {loading ? '...' : `"${roomName}" 비활성화`}
        </button>
        <button onClick={() => setConfirming(false)} style={{ ...btn, border: '1px solid var(--border)', color: 'var(--text-2)' }}>
          취소
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{ ...btn, border: '1px solid var(--border)', color: 'var(--text-2)' }}
    >
      <Icon name="trash" size={12} /> 비활성화
    </button>
  );
}

const btn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '5px 10px', borderRadius: 7, fontSize: 12,
  background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap',
};
