'use client';

import { useState } from 'react';
import Icon from './Icon';
import type { RecurringBooking, PlateerData } from '@/lib/types';

interface RecurringEditModalProps {
  recurring: RecurringBooking;
  data: PlateerData;
  onClose: () => void;
  onSave: (id: string, data: { title: string }) => Promise<void>;
}

export default function RecurringEditModal({ recurring, data, onClose, onSave }: RecurringEditModalProps) {
  const [title, setTitle] = useState(recurring.title);
  const [saving, setSaving] = useState(false);

  const room = data.ROOMS.find((r) => r.id === recurring.roomId);

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave(recurring.id, { title: title.trim() });
    setSaving(false);
  };

  return (
    <div
      className="animate-fadeIn"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(30, 25, 20, 0.3)',
        backdropFilter: 'blur(4px)',
        display: 'grid', placeItems: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        className="animate-scaleIn"
        style={{
          background: 'var(--surface)',
          borderRadius: 20,
          boxShadow: 'var(--shadow-lg)',
          width: 460,
          maxWidth: 'calc(100vw - 40px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex justify-between items-start"
          style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>반복 예약 수정</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-3)' }}>
              {room?.name} · {recurring.rrule} · {recurring.duration}분
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ padding: 8, width: 34, height: 34, border: 'none', background: 'transparent', color: 'var(--text-2)', borderRadius: 10, cursor: 'pointer' }}
          >
            <Icon name="x" />
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
            회의 제목
          </label>
          <input
            className="w-full"
            style={{
              padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10,
              background: 'var(--surface)', fontSize: 13.5, color: 'var(--text)',
              fontFamily: 'inherit',
            }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            autoFocus
          />
          <p style={{ margin: '8px 0 0', fontSize: 11.5, color: 'var(--text-3)' }}>
            현재 및 미래 예약의 제목이 모두 변경됩니다.
          </p>
        </div>

        <div
          className="flex justify-end gap-2"
          style={{ padding: '14px 24px', borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={saving || !title.trim()}
            style={{
              padding: '8px 14px', borderRadius: 10, border: 'none',
              background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving || !title.trim() ? 0.7 : 1,
            }}
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
