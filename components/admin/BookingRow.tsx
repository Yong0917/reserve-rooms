'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import type { AdminBooking } from '@/lib/types';

interface BookingRowProps {
  booking: AdminBooking;
  onCancelled: (id: string) => void;
}

function fmtDateTime(iso: string): string {
  const kst = new Date(new Date(iso).getTime() + 9 * 3600000);
  const mm = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kst.getUTCDate()).padStart(2, '0');
  const hh = String(kst.getUTCHours()).padStart(2, '0');
  const min = String(kst.getUTCMinutes()).padStart(2, '0');
  return `${mm}.${dd} ${hh}:${min}`;
}

function fmtEndTime(iso: string): string {
  const kst = new Date(new Date(iso).getTime() + 9 * 3600000);
  return `${String(kst.getUTCHours()).padStart(2, '0')}:${String(kst.getUTCMinutes()).padStart(2, '0')}`;
}

export default function BookingRow({ booking, onCancelled }: BookingRowProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, { method: 'DELETE' });
      if (res.ok) onCancelled(booking.id);
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  const cancelled = booking.status === 'cancelled';

  return (
    <tr style={{ opacity: cancelled ? 0.45 : 1 }}>
      <td style={tdStyle}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{fmtDateTime(booking.startAt)}</span>
        <span style={{ color: 'var(--text-2)', fontSize: 12 }}>–{fmtEndTime(booking.endAt)}</span>
      </td>
      <td style={tdStyle}>
        <span style={{ fontSize: 13 }}>{booking.roomName}</span>
      </td>
      <td style={tdStyle}>
        <span style={{ fontSize: 13 }}>{booking.title}</span>
        {booking.recurringId && (
          <span style={{ fontSize: 11, color: 'var(--accent)', marginLeft: 6 }}>반복</span>
        )}
      </td>
      <td style={tdStyle}>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{booking.ownerName}</span>
      </td>
      <td style={{ ...tdStyle, textAlign: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{booking.attendeesCount}명</span>
      </td>
      <td style={tdStyle}>
        <span
          style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
            background: cancelled ? '#f1f5f9' : 'var(--accent-soft)',
            color: cancelled ? 'var(--text-2)' : 'var(--accent)',
          }}
        >
          {cancelled ? '취소됨' : '활성'}
        </span>
      </td>
      <td style={tdStyle}>
        {!cancelled && (
          confirming ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleCancel} disabled={loading}
                style={{ ...smallBtn, background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
              >
                {loading ? '...' : '확인'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                style={{ ...smallBtn, border: '1px solid var(--border)', color: 'var(--text-2)' }}
              >
                취소
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              style={{ ...smallBtn, border: '1px solid var(--border)', color: 'var(--text-2)' }}
            >
              <Icon name="x" size={12} /> 강제취소
            </button>
          )
        )}
      </td>
    </tr>
  );
}

const tdStyle: React.CSSProperties = {
  padding: '10px 14px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle',
  display: 'table-cell',
};

const smallBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '4px 10px', borderRadius: 6, fontSize: 12,
  background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap',
};
