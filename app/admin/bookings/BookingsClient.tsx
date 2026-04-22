'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BookingRow from '@/components/admin/BookingRow';
import Icon from '@/components/Icon';
import type { AdminBooking, AdminRoom } from '@/lib/types';

interface Filters {
  page: number;
  roomId: string;
  status: 'active' | 'cancelled' | 'all';
  from: string;
  to: string;
  search: string;
}

interface Props {
  initialItems: AdminBooking[];
  hasMore: boolean;
  rooms: AdminRoom[];
  initialFilters: Filters;
}

export default function BookingsClient({ initialItems, hasMore: initialHasMore, rooms, initialFilters }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [hasMore] = useState(initialHasMore);
  const [filters, setFilters] = useState(initialFilters);

  const applyFilters = (next: Partial<Filters>) => {
    const merged = { ...filters, ...next, page: 0 };
    setFilters(merged);
    const params = new URLSearchParams();
    if (merged.roomId) params.set('roomId', merged.roomId);
    if (merged.status !== 'all') params.set('status', merged.status);
    if (merged.from) params.set('from', merged.from);
    if (merged.to) params.set('to', merged.to);
    if (merged.search) params.set('search', merged.search);
    router.push(`/admin/bookings?${params.toString()}`);
  };

  const handleCancelled = (id: string) => {
    setItems((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled' as const } : b));
  };

  const inputStyle: React.CSSProperties = {
    padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text)', fontSize: 13, outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '14px 16px',
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
        }}
      >
        <select
          style={{ ...inputStyle, cursor: 'pointer' }}
          value={filters.roomId}
          onChange={(e) => applyFilters({ roomId: e.target.value })}
        >
          <option value="">전체 회의실</option>
          {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select
          style={{ ...inputStyle, cursor: 'pointer' }}
          value={filters.status}
          onChange={(e) => applyFilters({ status: e.target.value as Filters['status'] })}
        >
          <option value="all">전체 상태</option>
          <option value="active">활성</option>
          <option value="cancelled">취소됨</option>
        </select>
        <input type="date" style={inputStyle} value={filters.from} onChange={(e) => applyFilters({ from: e.target.value })} />
        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>~</span>
        <input type="date" style={inputStyle} value={filters.to} onChange={(e) => applyFilters({ to: e.target.value })} />
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-2)' }}>
            <Icon name="search" size={14} />
          </div>
          <input
            style={{ ...inputStyle, paddingLeft: 32, width: '100%', boxSizing: 'border-box' }}
            placeholder="제목 검색..."
            value={filters.search}
            onChange={(e) => applyFilters({ search: e.target.value })}
          />
        </div>
      </div>

      <div
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['날짜/시간', '회의실', '제목', '예약자', '참석인원', '상태', '액션'].map((h) => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <BookingRow key={b.id} booking={b} onCancelled={handleCancelled} />
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-2)', fontSize: 13 }}>
            조건에 맞는 예약이 없습니다.
          </div>
        )}
      </div>

      {(filters.page > 0 || hasMore) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          {filters.page > 0 && (
            <button
              onClick={() => applyFilters({ page: filters.page - 1 })}
              style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'var(--text)' }}
            >
              이전
            </button>
          )}
          {hasMore && (
            <button
              onClick={() => applyFilters({ page: filters.page + 1 })}
              style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'var(--text)' }}
            >
              다음
            </button>
          )}
        </div>
      )}
    </div>
  );
}
