'use client';

import { useState } from 'react';
import Icon from './Icon';
import { formatH, roomThumb } from '@/lib/data';
import type { Booking, PlateerData } from '@/lib/types';

type CancelScope = 'this' | 'future' | 'all';

interface BookingDetailModalProps {
  booking: Booking;
  data: PlateerData;
  onClose: () => void;
  onEdit: (booking: Booking) => void;
  onCancel: (bookingId: string, recurringId?: string, scope?: CancelScope) => void;
}

export default function BookingDetailModal({ booking, data, onClose, onEdit, onCancel }: BookingDetailModalProps) {
  const room = data.ROOMS.find((r) => r.id === booking.roomId)!;
  const [showCancelOptions, setShowCancelOptions] = useState(false);
  const [cancelScope, setCancelScope] = useState<CancelScope>('this');
  const [confirming, setConfirming] = useState(false);

  const handleCancelClick = () => {
    if (booking.recurringId) {
      setShowCancelOptions(true);
    } else {
      setConfirming(true);
    }
  };

  const handleConfirmCancel = () => {
    onCancel(booking.id, booking.recurringId, cancelScope);
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
        className="animate-scaleIn flex flex-col"
        style={{
          background: 'var(--surface)',
          borderRadius: 20,
          boxShadow: 'var(--shadow-lg)',
          width: 560,
          maxWidth: 'calc(100vw - 40px)',
          maxHeight: 'calc(100vh - 40px)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Head with gradient */}
        <div
          className="flex justify-between items-start"
          style={{
            padding: '20px 24px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            background: roomThumb(room.color),
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
            background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.18))',
            pointerEvents: 'none',
          }} />
          <div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              {formatH(booking.start)} – {formatH(booking.end)} · 오늘
            </div>
            <h2 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: 'white' }}>{booking.title}</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'white', opacity: 0.9 }}>
              {room.name} · {room.floor} · 👥 최대 {room.capacity}명
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: 8, width: 34, height: 34, border: 'none', background: 'transparent',
              color: 'white', borderRadius: 10, cursor: 'pointer',
            }}
          >
            <Icon name="x" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { icon: 'user', label: '주최자', value: booking.owner },
              { icon: 'users', label: '참석자', value: `${(booking.attendees ?? []).length}명` },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2.5"
                style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10 }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name={item.icon} size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.label}</div>
                  <div style={{ fontWeight: 600 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          {booking.attendees && booking.attendees.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                참석자
              </label>
              <div className="flex flex-wrap gap-1.5">
                {booking.attendees.map((a, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5"
                    style={{
                      padding: '4px 8px 4px 4px', background: 'var(--accent-soft)',
                      color: 'var(--accent-ink)', borderRadius: 999, fontSize: 12, fontWeight: 500,
                    }}
                  >
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', color: 'var(--accent-ink)', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700 }}>
                      {a[0]}
                    </span>
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
              장비
            </label>
            <div className="flex flex-wrap gap-1.5">
              {room.features.map((f) => (
                <span
                  key={f}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', borderRadius: 999, fontSize: 11.5,
                    background: 'var(--surface-2)', border: 'none', color: 'var(--text-2)', fontWeight: 500,
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* 반복 예약 취소 범위 선택 */}
          {showCancelOptions && (
            <div style={{
              padding: '16px', background: 'var(--surface-2)', borderRadius: 12,
              border: '1px solid var(--border)', marginTop: 4,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>취소 범위를 선택하세요</div>
              {(['this', 'future', 'all'] as CancelScope[]).map((scope) => {
                const labels: Record<CancelScope, string> = {
                  this: '이 건만',
                  future: '이후 모든 예약',
                  all: '전체 시리즈',
                };
                return (
                  <label
                    key={scope}
                    className="flex items-center gap-2"
                    style={{ marginBottom: 8, cursor: 'pointer', fontSize: 13 }}
                  >
                    <input
                      type="radio"
                      name="cancelScope"
                      value={scope}
                      checked={cancelScope === scope}
                      onChange={() => setCancelScope(scope)}
                    />
                    {labels[scope]}
                  </label>
                );
              })}
              <div className="flex gap-2" style={{ marginTop: 12 }}>
                <button
                  onClick={() => setShowCancelOptions(false)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--border)',
                    background: 'var(--surface)', color: 'var(--text)', fontSize: 12.5, cursor: 'pointer',
                  }}
                >
                  돌아가기
                </button>
                <button
                  onClick={handleConfirmCancel}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 8, border: 'none',
                    background: 'var(--danger)', color: 'white', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  취소하기
                </button>
              </div>
            </div>
          )}

          {/* 단건 취소 확인 */}
          {confirming && !showCancelOptions && (
            <div style={{
              padding: '16px', background: 'var(--surface-2)', borderRadius: 12,
              border: '1px solid var(--border)', marginTop: 4,
            }}>
              <div style={{ fontSize: 13, marginBottom: 12 }}>
                <strong>{booking.title}</strong> 예약을 취소할까요?
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--border)',
                    background: 'var(--surface)', color: 'var(--text)', fontSize: 12.5, cursor: 'pointer',
                  }}
                >
                  돌아가기
                </button>
                <button
                  onClick={() => onCancel(booking.id)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 8, border: 'none',
                    background: 'var(--danger)', color: 'white', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  취소 확인
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!showCancelOptions && !confirming && (
          <div
            className="flex justify-between items-center"
            style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}
          >
            {booking.mine ? (
              <>
                <button
                  onClick={handleCancelClick}
                  className="flex items-center gap-1.5 cursor-pointer"
                  style={{
                    padding: '8px 14px', borderRadius: 10, border: 'none',
                    background: 'transparent', color: 'var(--coral-ink)', fontSize: 13, fontWeight: 500,
                  }}
                >
                  <Icon name="trash" size={14} /> 취소하기
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                  >
                    닫기
                  </button>
                  <button
                    onClick={() => onEdit(booking)}
                    className="flex items-center gap-1.5 cursor-pointer"
                    style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 500 }}
                  >
                    <Icon name="edit" size={14} /> 수정
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>내가 만든 예약이 아닙니다</div>
                <button
                  onClick={onClose}
                  style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                >
                  닫기
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
