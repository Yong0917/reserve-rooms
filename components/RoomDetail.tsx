'use client';

import { useState, useEffect } from 'react';
import Icon from './Icon';
import { formatH, roomThumb, featIcon } from '@/lib/data';
import { createClient } from '@/lib/supabase/client';
import { fetchRoomAvailability, type DayAvailability } from '@/lib/supabase/queries';
import type { PlateerData, Room, Booking } from '@/lib/types';

interface RoomDetailProps {
  room: Room;
  data: PlateerData;
  onBack: () => void;
  openNewBooking: (ctx?: { room?: Room; hour?: number; durationMinutes?: number }) => void;
  openBookingDetail: (b: Booking) => void;
  isFavorite: boolean;
  onToggleFavorite: (roomId: string) => void;
}

export default function RoomDetail({ room, data, onBack, openNewBooking, openBookingDetail, isFavorite, onToggleFavorite }: RoomDetailProps) {
  const bks = data.BOOKINGS.filter((b) => b.roomId === room.id);
  const HOUR_S = 9;
  const HOUR_E = 19;

  const now = new Date();
  const nowHour = now.getUTCHours() + 9 + now.getUTCMinutes() / 60;
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const todayLabel = `${kstNow.getUTCMonth() + 1}월 ${kstNow.getUTCDate()}일`;
  const nowTimeLabel = `${String(kstNow.getUTCHours()).padStart(2, '0')}:${String(kstNow.getUTCMinutes()).padStart(2, '0')}`;

  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  useEffect(() => {
    const client = createClient();
    fetchRoomAvailability(client, room.id).then(setAvailability);
  }, [room.id]);

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1 cursor-pointer"
          style={{
            padding: '5px 10px', borderRadius: 10, border: 'none',
            background: 'transparent', color: 'var(--text-2)', fontSize: 12, fontWeight: 500,
          }}
        >
          <Icon name="chevronL" size={12} /> 타임라인으로
        </button>
      </div>

      {/* Hero */}
      <div
        style={{
          height: 180, borderRadius: 20,
          background: roomThumb(room.color),
          marginBottom: 20, padding: 24,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          color: 'white', position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', right: -40, top: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
        }} />
        <button
          onClick={() => onToggleFavorite(room.id)}
          style={{
            position: 'absolute', top: 16, right: 16, zIndex: 3,
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: 'rgba(255,255,255,0.2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isFavorite ? '#ff4d6d' : 'white',
            backdropFilter: 'blur(4px)',
            transition: 'background 0.15s, color 0.15s',
          }}
          title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          <Icon name={isFavorite ? 'heartFilled' : 'heart'} size={18} />
        </button>
        <div className="flex gap-2" style={{ marginBottom: 6, zIndex: 2 }}>
          {[room.floor, room.zone, `👥 ${room.capacity}`].map((tag) => (
            <span
              key={tag}
              style={{
                padding: '3px 10px', borderRadius: 999, fontSize: 11.5,
                background: 'rgba(255,255,255,0.25)', color: 'white', border: 'none', fontWeight: 500,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: '-1px', zIndex: 2, position: 'relative' }}>
          {room.name}
        </h2>
        <div style={{ marginTop: 6, fontSize: 13, opacity: 0.9, zIndex: 2, position: 'relative' }}>
          Plateer 본사 · {room.floor} · 내 자리에서 1분 거리
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <div>
          {/* Today timeline */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>오늘 · {todayLabel}</div>
              <button
                onClick={() => openNewBooking({ room, hour: Math.ceil(nowHour) })}
                className="flex items-center gap-1.5 cursor-pointer"
                style={{
                  padding: '5px 10px', borderRadius: 10, border: 'none',
                  background: 'var(--accent)', color: 'white', fontSize: 12, fontWeight: 500,
                }}
              >
                <Icon name="plus" size={12} /> 이 방 예약
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr', background: 'var(--surface-2)', borderRadius: 14, padding: 12, position: 'relative', minHeight: 400 }}>
              <div className="flex flex-col mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>
                {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((h) => (
                  <div key={h} style={{ height: 40, paddingRight: 8, textAlign: 'right' }}>
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>
              <div style={{ position: 'relative' }}>
                {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((h) => (
                  <div key={h} style={{ position: 'absolute', left: 0, right: 0, top: (h - 9) * 40, height: 1, background: 'var(--border)' }} />
                ))}
                {bks.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => openBookingDetail(b)}
                    style={{
                      position: 'absolute',
                      left: 4, right: 4,
                      top: (b.start - HOUR_S) * 40,
                      height: (b.end - b.start) * 40 - 2,
                      borderRadius: 6, padding: '4px 8px', fontSize: 11,
                      background: 'var(--accent-soft)', color: 'var(--accent-ink)',
                      borderLeft: '3px solid var(--accent)',
                      overflow: 'hidden', cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{b.title}</div>
                    <div className="mono" style={{ fontSize: 10, opacity: 0.8 }}>
                      {formatH(b.start)}–{formatH(b.end)}
                    </div>
                  </div>
                ))}
                {/* NOW line */}
                {nowHour >= HOUR_S && nowHour <= HOUR_E && (
                  <div style={{ position: 'absolute', left: 0, right: 0, top: (nowHour - HOUR_S) * 40, height: 2, background: 'var(--accent)' }}>
                    <div className="mono" style={{
                      position: 'absolute', left: -44, top: -8, fontSize: 9,
                      background: 'var(--accent)', color: 'white', padding: '1px 4px', borderRadius: 3,
                    }}>
                      {nowTimeLabel}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 7-day availability */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>다음 7일 가용성</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
              {availability.length > 0
                ? availability.map((day, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{day.dayName}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>{day.dateLabel}</div>
                    <div style={{ height: 60, background: 'var(--surface-2)', borderRadius: 6, marginTop: 4, position: 'relative', overflow: 'hidden' }}>
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: `${day.pct}%`,
                        background: day.level === 'high' ? 'var(--mint)' : day.level === 'mid' ? 'var(--butter)' : 'var(--coral)',
                        borderRadius: 6,
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 4 }}>{day.pct}% 여유</div>
                  </div>
                ))
                : Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ height: 88, background: 'var(--surface-2)', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        <div>
          {/* Features */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>장비 & 환경</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {room.features.map((f) => (
                <div key={f} className="flex items-center gap-2.5" style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10, fontSize: 13 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--surface)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name={featIcon(f)} size={16} />
                  </div>
                  <div>{f}</div>
                </div>
              ))}
              <div className="flex items-center gap-2.5" style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10, fontSize: 13 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--surface)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name="users" size={16} />
                </div>
                <div>최대 {room.capacity}명</div>
              </div>
            </div>
          </div>

          {/* Quick book */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>빠른 예약</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[30, 60, 90].map((mins) => (
                <button
                  key={mins}
                  onClick={() => openNewBooking({ room, hour: Math.ceil(nowHour), durationMinutes: mins })}
                  style={{
                    padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)',
                    background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  지금 · {mins}분
                </button>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div style={{ padding: 18, borderRadius: 14, background: 'var(--butter-soft)', border: 'none' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>⭐ 이 방 추천 이유</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
              내가 지난달 <b>4번</b> 사용 · 내 자리에서 가장 가까움 · {room.zone}팀 선호
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
