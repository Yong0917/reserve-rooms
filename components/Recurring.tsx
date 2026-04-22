'use client';

import { useState } from 'react';
import Icon from './Icon';
import { roomThumb } from '@/lib/data';
import type { PlateerData, Room, RecurringBooking } from '@/lib/types';

interface RecurringProps {
  data: PlateerData;
  openNewBooking: (ctx?: { room?: Room; hour?: number }) => void;
  onEditRecurring: (r: RecurringBooking) => void;
  onDeleteRecurring: (id: string) => void;
}

const PAGE_SIZE = 20;

export default function Recurring({ data, openNewBooking, onEditRecurring, onDeleteRecurring }: RecurringProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(data.RECURRING.length / PAGE_SIZE));
  const pagedRecurring = data.RECURRING.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <div className="flex justify-between items-end gap-6 flex-wrap" style={{ marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>반복 예약</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-3)', fontSize: 13 }}>정기 회의를 자동으로 예약하세요</p>
        </div>
        <button
          onClick={() => openNewBooking()}
          className="flex items-center gap-1.5 cursor-pointer"
          style={{
            padding: '11px 20px', borderRadius: 10, border: 'none',
            background: 'var(--accent)', color: 'white', fontSize: 14, fontWeight: 500,
          }}
        >
          <Icon name="plus" size={14} /> 새 반복 예약
        </button>
      </div>

      {data.RECURRING.length > PAGE_SIZE && (
        <div className="flex items-center gap-2" style={{ marginBottom: 16, fontSize: 13 }}>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--surface)', color: page === 0 ? 'var(--text-4)' : 'var(--text)',
              cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: 12,
            }}
          >
            ← 이전
          </button>
          <span style={{ color: 'var(--text-3)' }}>{page + 1} / {totalPages}페이지</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages - 1}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--surface)', color: page >= totalPages - 1 ? 'var(--text-4)' : 'var(--text)',
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: 12,
            }}
          >
            다음 →
          </button>
        </div>
      )}

      <div style={{ maxWidth: 820 }}>
        {pagedRecurring.map((r) => {
          const room = data.ROOMS.find((x) => x.id === r.roomId)!;
          return (
            <div key={r.id} style={{ marginBottom: confirmId === r.id ? 0 : 10 }}>
              <div
                style={{
                  padding: '16px 20px',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 14,
                  borderBottomLeftRadius: confirmId === r.id ? 0 : 14,
                  borderBottomRightRadius: confirmId === r.id ? 0 : 14,
                  display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center',
                }}
              >
                <div className="flex gap-3.5 items-start">
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: roomThumb(room?.color ?? 'lavender'), flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{r.title}</div>
                    <div
                      className="mono"
                      style={{
                        display: 'inline-block', marginTop: 4, fontSize: 11,
                        background: 'var(--lavender-soft)', color: 'var(--lavender-ink)',
                        padding: '3px 8px', borderRadius: 6,
                      }}
                    >
                      {r.rrule}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4 }}>
                      📍 {room?.name} · {room?.floor} · {r.duration}분 · 다음 발생: <b>{r.nextDate}</b>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onEditRecurring(r)}
                    className="flex items-center gap-1.5 cursor-pointer"
                    style={{
                      padding: '5px 10px', borderRadius: 10, border: '1px solid var(--border)',
                      background: 'var(--surface)', color: 'var(--text)', fontSize: 12, fontWeight: 500,
                    }}
                  >
                    <Icon name="edit" size={12} /> 수정
                  </button>
                  <button
                    onClick={() => setConfirmId(confirmId === r.id ? null : r.id)}
                    className="flex items-center justify-center cursor-pointer"
                    style={{
                      padding: '5px 10px', borderRadius: 10, border: 'none',
                      background: 'transparent', color: 'var(--coral-ink, #dc2626)', fontSize: 12, fontWeight: 500,
                    }}
                  >
                    <Icon name="trash" size={12} />
                  </button>
                </div>
              </div>

              {/* 인라인 삭제 확인 */}
              {confirmId === r.id && (
                <div style={{
                  padding: '12px 20px', background: 'var(--surface)',
                  border: '1px solid var(--border)', borderTop: 'none',
                  borderRadius: '0 0 14px 14px', marginBottom: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>
                    <strong>{r.title}</strong> 반복 예약을 전체 삭제할까요?
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmId(null)}
                      style={{
                        padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)',
                        background: 'var(--surface)', color: 'var(--text)', fontSize: 12, cursor: 'pointer',
                      }}
                    >
                      취소
                    </button>
                    <button
                      onClick={() => { onDeleteRecurring(r.id); setConfirmId(null); }}
                      style={{
                        padding: '6px 12px', borderRadius: 8, border: 'none',
                        background: 'var(--danger)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      삭제 확인
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div style={{ padding: 20, borderRadius: 14, marginTop: 20, background: 'var(--accent-soft)', border: 'none' }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>💡 반복 예약 팁</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.7 }}>
            · 주간 스탠드업, 1on1, 스프린트 리뷰 같은 정기 회의에 적합합니다<br />
            · 공휴일은 자동으로 건너뜁니다<br />
            · 참석자 일정 충돌 시 알림을 받습니다
          </div>
        </div>
      </div>
    </div>
  );
}
