'use client';

import { useState } from 'react';
import Icon from './Icon';
import type { PlateerData, Booking, Room, UpcomingBooking } from '@/lib/types';

interface MyBookingsProps {
  data: PlateerData;
  pastBookings: UpcomingBooking[];
  cancelledBookings: UpcomingBooking[];
  pastHasMore: boolean;
  cancelledHasMore: boolean;
  pastPage: number;
  cancelledPage: number;
  onPastPageChange: (page: number) => void;
  onCancelledPageChange: (page: number) => void;
  openBookingDetail: (b: Booking) => void;
  openNewBooking: (ctx?: { room?: Room; hour?: number }) => void;
  onEditBooking: (b: Booking) => void;
  onCancelBooking: (id: string) => void;
}

const TABS = ['다가오는 예약', '지난 예약', '취소된 예약'] as const;

export default function MyBookings({
  data, pastBookings, cancelledBookings,
  pastHasMore, cancelledHasMore, pastPage, cancelledPage,
  onPastPageChange, onCancelledPageChange,
  openBookingDetail, openNewBooking, onEditBooking, onCancelBooking,
}: MyBookingsProps) {
  const [tab, setTab] = useState(0);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const currentPage = tab === 1 ? pastPage : tab === 2 ? cancelledPage : 0;
  const hasMore = tab === 1 ? pastHasMore : tab === 2 ? cancelledHasMore : false;
  const onPageChange = tab === 1 ? onPastPageChange : onCancelledPageChange;

  const activeList = tab === 0 ? data.MY_UPCOMING : tab === 1 ? pastBookings : cancelledBookings;

  const grouped: Record<string, UpcomingBooking[]> = {};
  activeList.forEach((m) => {
    if (!grouped[m.date]) grouped[m.date] = [];
    grouped[m.date].push(m);
  });

  return (
    <div>
      <div className="flex justify-between items-end gap-6 flex-wrap" style={{ marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>내 예약</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-3)', fontSize: 13 }}>
            다가오는 예약 {data.MY_UPCOMING.length}개 · 반복 예약 {data.RECURRING.length}개
          </p>
        </div>
        <button
          onClick={() => openNewBooking()}
          className="flex items-center gap-1.5 cursor-pointer"
          style={{
            padding: '11px 20px', borderRadius: 10, border: 'none',
            background: 'var(--accent)', color: 'white', fontSize: 14, fontWeight: 500,
          }}
        >
          <Icon name="plus" size={14} /> 새 예약
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'inline-flex', background: 'var(--surface-2)',
          borderRadius: 10, padding: 3, gap: 2, marginBottom: 20,
        }}
      >
        {TABS.map((label, i) => (
          <button
            key={label}
            onClick={() => {
              setTab(i);
              setConfirmId(null);
              if (i === 1) onPastPageChange(0);
              if (i === 2) onCancelledPageChange(0);
            }}
            className="flex items-center gap-1"
            style={{
              border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12.5,
              fontWeight: 500, cursor: 'pointer',
              background: tab === i ? 'var(--surface)' : 'transparent',
              color: tab === i ? 'var(--text)' : 'var(--text-2)',
              boxShadow: tab === i ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'background var(--duration-base), color var(--duration-base)',
            }}
          >
            {label}
            {i === 0 && data.MY_UPCOMING.length > 0 && (
              <span style={{
                fontSize: 10, background: 'var(--accent)', color: 'white',
                padding: '1px 5px', borderRadius: 999, fontWeight: 600,
              }}>
                {data.MY_UPCOMING.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {Object.keys(grouped).length === 0 && (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
          예약이 없습니다
        </div>
      )}

      {tab > 0 && (currentPage > 0 || hasMore) && (
        <div className="flex items-center gap-2" style={{ marginBottom: 16, fontSize: 13 }}>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--surface)', color: currentPage === 0 ? 'var(--text-4)' : 'var(--text)',
              cursor: currentPage === 0 ? 'not-allowed' : 'pointer', fontSize: 12,
            }}
          >
            ← 이전
          </button>
          <span style={{ color: 'var(--text-3)' }}>{currentPage + 1}페이지</span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasMore}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--surface)', color: !hasMore ? 'var(--text-4)' : 'var(--text)',
              cursor: !hasMore ? 'not-allowed' : 'pointer', fontSize: 12,
            }}
          >
            다음 →
          </button>
        </div>
      )}

      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} style={{ marginBottom: 24 }}>
          <div className="flex justify-between items-baseline" style={{ marginBottom: 10 }}>
            <div className="flex items-center gap-2" style={{ fontSize: 16, fontWeight: 600, color: date === '오늘' ? 'var(--accent-ink)' : 'var(--text)' }}>
              {date === '오늘' && (
                <span style={{
                  fontSize: 9, background: 'var(--accent)', color: 'white',
                  padding: '2px 6px', borderRadius: 4, fontWeight: 700, letterSpacing: 0.5,
                }}>TODAY</span>
              )}
              {date}
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{items[0].dateLabel}</div>
          </div>
          {items.map((m) => {
            const b = data.BOOKINGS.find((x) => x.id === m.id);
            return (
              <div key={m.id}>
                <div
                  onClick={() => b && openBookingDetail(b)}
                  style={{
                    display: 'grid', gridTemplateColumns: '90px 1fr auto',
                    gap: 16, alignItems: 'center',
                    padding: '14px 18px',
                    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
                    marginBottom: confirmId === m.id ? 0 : 8,
                    cursor: 'pointer',
                    transition: 'border-color 0.1s, box-shadow 0.1s',
                    borderBottomLeftRadius: confirmId === m.id ? 0 : 14,
                    borderBottomRightRadius: confirmId === m.id ? 0 : 14,
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.boxShadow = 'var(--shadow)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="mono" style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.35 }}>
                    {m.time}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{m.title}</div>
                    <div className="flex gap-2 items-center flex-wrap" style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      <span>📍 {m.room} · {m.floor}</span>
                      <span>·</span>
                      <span>👥 {m.attendees}명</span>
                      {m.recurring && (
                        <span
                          className="inline-flex items-center gap-1"
                          style={{
                            fontSize: 10.5, background: 'var(--lavender-soft)', color: 'var(--lavender-ink)',
                            padding: '2px 7px', borderRadius: 999, fontWeight: 500,
                          }}
                        >
                          <Icon name="repeat" size={10} /> 반복
                        </span>
                      )}
                    </div>
                  </div>
                  {tab === 0 && b && (
                    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onEditBooking(b)}
                        className="flex items-center justify-center cursor-pointer"
                        style={{
                          padding: '5px 10px', borderRadius: 10, border: '1px solid var(--border)',
                          background: 'var(--surface)', color: 'var(--text-2)', fontSize: 12, fontWeight: 500,
                        }}
                        title="수정"
                      >
                        <Icon name="edit" size={12} />
                      </button>
                      <button
                        onClick={() => setConfirmId(confirmId === m.id ? null : m.id)}
                        className="flex items-center justify-center cursor-pointer"
                        style={{
                          padding: '5px 10px', borderRadius: 10, border: 'none',
                          background: 'transparent', color: 'var(--coral-ink, #dc2626)', fontSize: 12, fontWeight: 500,
                        }}
                        title="취소"
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* 인라인 취소 확인 */}
                {confirmId === m.id && (
                  <div style={{
                    padding: '10px 18px', background: 'var(--danger-soft)',
                    border: '1px solid var(--danger)', borderTop: 'none',
                    borderRadius: '0 0 14px 14px', marginBottom: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>이 예약을 취소할까요?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmId(null)}
                        style={{
                          padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)',
                          background: 'var(--surface)', color: 'var(--text)', fontSize: 12, cursor: 'pointer',
                        }}
                      >
                        돌아가기
                      </button>
                      <button
                        onClick={() => { onCancelBooking(m.id); setConfirmId(null); }}
                        style={{
                          padding: '6px 12px', borderRadius: 8, border: 'none',
                          background: 'var(--danger)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        취소 확인
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
