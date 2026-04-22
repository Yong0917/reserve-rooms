'use client';

import { HOURS, HOUR_START, HOUR_END, NOW_HOUR, formatH, roomBg, roomThumb } from '@/lib/data';
import type { PlateerData, Room, Booking } from '@/lib/types';

interface Filters {
  floor: string;
  minCap: number | null;
  feature: string | null;
}

interface TimelineViewProps {
  data: PlateerData;
  onCellClick: (ctx: { room: Room; hour: number }) => void;
  onBookingClick: (b: Booking) => void;
  onRoomClick: (r: Room) => void;
  filters: Filters;
  viewType: 'timeline' | 'grid';
}

export default function TimelineView({
  data, onCellClick, onBookingClick, onRoomClick, filters, viewType,
}: TimelineViewProps) {
  const { ROOMS, BOOKINGS } = data;
  const filtered = ROOMS.filter((r) => {
    if (filters.floor !== 'all' && r.floor !== filters.floor) return false;
    if (filters.minCap && r.capacity < filters.minCap) return false;
    if (filters.feature && !r.features.includes(filters.feature)) return false;
    return true;
  });

  const pct = (h: number) => ((h - HOUR_START) / (HOUR_END - HOUR_START)) * 100;

  if (viewType === 'grid') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {filtered.map((r) => {
          const bks = BOOKINGS.filter((b) => b.roomId === r.id);
          const isBusyNow = bks.some((b) => NOW_HOUR >= b.start && NOW_HOUR < b.end);
          return (
            <div
              key={r.id}
              onClick={() => onRoomClick(r)}
              className="card card-lift"
              style={{
                padding: 16,
                cursor: 'pointer',
              }}
            >
              <div style={{ height: 70, borderRadius: 10, background: roomThumb(r.color), marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 10,
                  background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.18))',
                  pointerEvents: 'none',
                }} />
              </div>
              <div className="flex justify-between items-center">
                <div style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</div>
                <span
                  className="flex items-center gap-1"
                  style={{
                    padding: '3px 10px', borderRadius: 999, fontSize: 11.5,
                    background: isBusyNow ? 'var(--coral-soft)' : 'var(--mint-soft)',
                    color: isBusyNow ? 'var(--coral-ink)' : 'var(--mint-ink)',
                    border: 'none', fontWeight: 500,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: isBusyNow ? 'var(--coral-ink)' : 'var(--mint-ink)' }} />
                  {isBusyNow ? '사용중' : '가능'}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4 }}>
                {r.floor} · 👥 {r.capacity} · {r.zone}
              </div>
              <div className="flex flex-wrap gap-1 mt-2.5">
                {r.features.slice(0, 3).map((f) => (
                  <span
                    key={f}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 10px', borderRadius: 999, fontSize: 10.5,
                      background: 'var(--surface-2)', border: 'none', color: 'var(--text-2)', fontWeight: 500,
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onCellClick({ room: r, hour: Math.ceil(NOW_HOUR) }); }}
                className="w-full flex justify-center items-center cursor-pointer"
                style={{
                  padding: '8px 14px', borderRadius: 10, border: 'none', marginTop: 12,
                  background: 'var(--accent-soft)', color: 'var(--accent-ink)', fontSize: 13, fontWeight: 500,
                }}
              >
                예약하기
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          position: 'sticky', top: 0, zIndex: 3,
        }}
      >
        <div
          style={{
            padding: '10px 16px', fontSize: 11, color: 'var(--text-3)', fontWeight: 600,
            letterSpacing: 1, textTransform: 'uppercase',
            borderRight: '1px solid var(--border)', background: 'var(--surface-2)',
          }}
        >
          회의실 · {filtered.length}
        </div>
        <div
          className="mono"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(11, 1fr)',
            fontSize: 11, color: 'var(--text-3)',
          }}
        >
          {HOURS.map((h) => (
            <div key={h} style={{ padding: '10px 8px', borderRight: '1px dashed var(--border)' }}>
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>
      </div>

      {/* Room rows */}
      <div style={{ position: 'relative' }}>
        {filtered.map((r) => {
          const bks = BOOKINGS.filter((b) => b.roomId === r.id);
          return (
            <div
              key={r.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '220px 1fr',
                borderBottom: '1px solid var(--border)',
                position: 'relative',
                minHeight: 64,
              }}
            >
              <div
                onClick={() => onRoomClick(r)}
                className="flex items-center gap-2.5 cursor-pointer"
                style={{
                  padding: '12px 16px',
                  borderRight: '1px solid var(--border)',
                  background: 'var(--surface)',
                }}
              >
                <div style={{ width: 10, height: 32, borderRadius: 3, background: roomBg(r.color), flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                  <div className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    <span>{r.floor}</span>
                    <span style={{ color: 'var(--text-4)' }}>·</span>
                    <span>👥 {r.capacity}</span>
                    <span style={{ color: 'var(--text-4)' }}>·</span>
                    <span>{r.zone}</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(11, 1fr)',
                  position: 'relative',
                }}
              >
                {HOURS.map((h, i) => (
                  <div
                    key={i}
                    onClick={() => onCellClick({ room: r, hour: h })}
                    style={{
                      borderRight: '1px dashed var(--border)',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'var(--accent-soft)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  />
                ))}

                {bks.map((b) => {
                  const left = ((b.start - HOUR_START) / (HOUR_END - HOUR_START)) * 100;
                  const width = ((b.end - b.start) / (HOUR_END - HOUR_START)) * 100;
                  return (
                    <div
                      key={b.id}
                      onClick={(e) => { e.stopPropagation(); onBookingClick(b); }}
                      className={`tl-block-tag-${b.tag}`}
                      style={{
                        position: 'absolute',
                        top: 6, bottom: 6,
                        left: `${left}%`, width: `${width}%`,
                        borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 500,
                        overflow: 'hidden', cursor: 'pointer',
                        border: '1px solid transparent',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center',
                        zIndex: 2,
                        transition: 'transform var(--duration-fast), box-shadow var(--duration-base)',
                        ...(b.mine ? { paddingLeft: 14 } : {}),
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scaleY(1.04)';
                        e.currentTarget.style.boxShadow = 'var(--shadow)';
                        e.currentTarget.style.zIndex = '10';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.zIndex = '2';
                      }}
                    >
                      {b.mine && (
                        <div style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0,
                          width: 3, background: 'var(--accent)', borderRadius: '3px 0 0 3px',
                        }} />
                      )}
                      <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</div>
                      <div style={{ fontSize: 10.5, opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {formatH(b.start)}–{formatH(b.end)} · {b.owner}
                      </div>
                    </div>
                  );
                })}

                {/* NOW indicator */}
                <div
                  style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: `${pct(NOW_HOUR)}%`,
                    width: 2, background: 'var(--accent)', zIndex: 5, pointerEvents: 'none',
                    boxShadow: '0 0 6px var(--accent), 0 0 12px rgba(139,125,216,0.3)',
                  }}
                >
                  {r.id === filtered[0]?.id && (
                    <div
                      className="mono"
                      style={{
                        position: 'absolute', top: -22, left: -20,
                        fontSize: 10, background: 'var(--accent)', color: 'white',
                        padding: '2px 6px', borderRadius: 4, fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      NOW 10:42
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', top: -4, left: -4,
                    width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)',
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
