'use client';

import Icon from './Icon';
import TimelineView from './TimelineView';
import { isSameKSTDay, formatKSTDate } from '@/lib/supabase/queries';
import type { PlateerData, Room, Booking } from '@/lib/types';

interface Filters {
  floor: string;
  minCap: number | null;
  feature: string | null;
}

interface DashboardProps {
  data: PlateerData;
  onRoomSelect: (roomId: string) => void;
  onNavigateMy: () => void;
  onNavigateRecurring: () => void;
  openNewBooking: (ctx?: { room?: Room; hour?: number }) => void;
  openBookingDetail: (b: Booking) => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  viewType: 'timeline' | 'grid';
  setViewType: (v: 'timeline' | 'grid') => void;
  selectedDate: Date;
  onDateChange: (d: Date) => void;
}

export default function Dashboard({
  data, onRoomSelect, onNavigateMy, onNavigateRecurring,
  openNewBooking, openBookingDetail, filters, setFilters, viewType, setViewType,
  selectedDate, onDateChange,
}: DashboardProps) {
  const { ROOMS, BOOKINGS, ME, MY_UPCOMING, RECURRING } = data;

  const today = new Date();
  const isToday = isSameKSTDay(selectedDate, today);
  const nowHour = today.getUTCHours() + 9 + today.getUTCMinutes() / 60;

  const busyRoomIds = new Set(
    BOOKINGS.filter((b) => isToday && b.start <= nowHour && nowHour < b.end).map((b) => b.roomId),
  );
  const freeNow = ROOMS.length - busyRoomIds.size;

  const myBookingsCount = BOOKINGS.filter((b) => b.mine).length;

  const totalBooked = BOOKINGS.reduce((sum, b) => sum + (b.end - b.start), 0);
  const usagePct = ROOMS.length > 0 ? Math.min(100, Math.round((totalBooked / (ROOMS.length * 11)) * 100)) : 0;

  const nextRecurring = RECURRING.find((r) => r.nextDate);
  const nextRecurringLabel = nextRecurring?.nextDate
    ? nextRecurring.nextDate.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2.$3')
    : '';

  const nextMyBooking = MY_UPCOMING.find((m) => m.date === '오늘');

  const kpis = [
    {
      label: isToday ? '지금 이용 가능' : '회의실 총 수',
      valueColor: 'var(--mint-ink)',
      bgColor: 'var(--mint-soft)',
      borderColor: 'var(--mint)',
      value: <>{freeNow}<span style={{ fontSize: 16, color: 'var(--text-3)', fontWeight: 500 }}> / {ROOMS.length}</span></>,
      sub: '5F · 6F · 7F 전체',
    },
    {
      label: '이날 내 예약',
      valueColor: 'var(--accent-ink)',
      bgColor: 'var(--accent-soft)',
      borderColor: 'var(--accent-soft)',
      value: myBookingsCount,
      sub: nextMyBooking ? `다음: ${nextMyBooking.time.split('–')[0]} ${nextMyBooking.title}` : '예약 없음',
    },
    {
      label: '평균 사용률',
      valueColor: 'var(--peach-ink)',
      bgColor: 'var(--peach-soft)',
      borderColor: 'var(--peach)',
      value: <>{usagePct}<span style={{ fontSize: 16, color: 'var(--text-3)' }}>%</span></>,
      sub: `총 ${totalBooked.toFixed(1)}시간 예약`,
      showProgress: true,
      progressValue: usagePct,
    },
    {
      label: '반복 예약',
      valueColor: 'var(--rose-ink)',
      bgColor: 'var(--rose-soft)',
      borderColor: 'var(--rose)',
      value: RECURRING.length,
      sub: nextRecurringLabel ? `다음 발생: ${nextRecurringLabel}` : '반복 예약 없음',
    },
  ];

  function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex justify-between items-end gap-6 flex-wrap" style={{ marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
            {isToday ? '좋은 하루예요,' : '날짜 조회:'} {ME.name}님 {isToday ? '☀' : '📅'}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-3)', fontSize: 13 }}>
            {formatKSTDate(selectedDate)} · 회의실 현황을 확인하세요
          </p>
        </div>
        <button
          onClick={() => openNewBooking()}
          className="flex items-center gap-1.5 cursor-pointer btn-primary"
          style={{
            padding: '11px 20px', borderRadius: 10,
            fontSize: 14, fontWeight: 500,
          }}
        >
          <Icon name="plus" size={14} /> 새 예약
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {kpis.map((k) => (
          <div
            key={k.label}
            style={{
              padding: 16,
              background: `linear-gradient(135deg, ${k.bgColor} 0%, var(--surface) 100%)`,
              border: `1px solid ${k.borderColor}`,
              borderRadius: 14,
              transition: 'transform var(--duration-fast), box-shadow var(--duration-base)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="label-sm">{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, letterSpacing: '-0.5px', color: k.valueColor }}>{k.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{k.sub}</div>
            {'showProgress' in k && k.showProgress && (
              <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginTop: 10 }}>
                <div style={{
                  height: '100%', width: `${k.progressValue}%`,
                  background: 'var(--peach-ink)', borderRadius: 2,
                  transition: 'width 0.6s var(--ease-out)',
                }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dashboard layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <div>
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: 16 }}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDateChange(addDays(selectedDate, -1))}
                className="flex items-center justify-center cursor-pointer"
                style={{ padding: 8, width: 34, height: 34, borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--text-2)', transition: 'background var(--duration-base), color var(--duration-base)' }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)'; }}
              >
                <Icon name="chevronL" />
              </button>
              <div style={{ fontSize: 18, fontWeight: 600, margin: '0 6px', minWidth: 170 }}>
                {(() => {
                  const kst = new Date(selectedDate.getTime() + 9 * 60 * 60 * 1000);
                  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
                  return `${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일 ${weekdays[kst.getUTCDay()]}`;
                })()}
              </div>
              <button
                onClick={() => onDateChange(addDays(selectedDate, 1))}
                className="flex items-center justify-center cursor-pointer"
                style={{ padding: 8, width: 34, height: 34, borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--text-2)', transition: 'background var(--duration-base), color var(--duration-base)' }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)'; }}
              >
                <Icon name="chevronR" />
              </button>
              <button
                onClick={() => onDateChange(new Date())}
                disabled={isToday}
                style={{
                  padding: '5px 10px', borderRadius: 10, border: '1px solid var(--border)',
                  background: 'var(--surface)', color: isToday ? 'var(--text-3)' : 'var(--text)',
                  fontSize: 12, fontWeight: 500, cursor: isToday ? 'default' : 'pointer',
                  opacity: isToday ? 0.5 : 1,
                }}
              >
                오늘
              </button>
            </div>
            <div style={{ flex: 1 }} />
            <div
              style={{
                display: 'inline-flex', background: 'var(--surface-2)',
                borderRadius: 10, padding: 3, gap: 2,
              }}
            >
              {(['timeline', 'grid'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewType(v)}
                  style={{
                    border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12.5,
                    fontWeight: 500, cursor: 'pointer',
                    background: viewType === v ? 'var(--surface)' : 'transparent',
                    color: viewType === v ? 'var(--text)' : 'var(--text-2)',
                    boxShadow: viewType === v ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {v === 'timeline' ? '타임라인' : '그리드'}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1.5" style={{ marginBottom: 14 }}>
            {(['all', '5F', '6F', '7F'] as const).map((f) => (
              <span
                key={f}
                onClick={() => setFilters({ ...filters, floor: f })}
                className="cursor-pointer"
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '5px 12px', borderRadius: 999, fontSize: 12.5,
                  fontWeight: 500, cursor: 'pointer',
                  background: filters.floor === f ? 'var(--text)' : 'var(--surface)',
                  color: filters.floor === f ? 'var(--bg)' : 'var(--text-2)',
                  border: filters.floor === f ? '1px solid var(--text)' : '1px solid var(--border)',
                }}
              >
                {f === 'all' ? '전체 층' : f}
              </span>
            ))}
            <span style={{ width: 8 }} />
            {[2, 4, 8].map((c) => (
              <span
                key={c}
                onClick={() => setFilters({ ...filters, minCap: filters.minCap === c ? null : c })}
                className="cursor-pointer"
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '5px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 500,
                  background: filters.minCap === c ? 'var(--text)' : 'var(--surface)',
                  color: filters.minCap === c ? 'var(--bg)' : 'var(--text-2)',
                  border: filters.minCap === c ? '1px solid var(--text)' : '1px solid var(--border)',
                }}
              >
                👥 {c}+
              </span>
            ))}
            <span style={{ width: 8 }} />
            {['화이트보드', '모니터', '화상회의'].map((f) => (
              <span
                key={f}
                onClick={() => setFilters({ ...filters, feature: filters.feature === f ? null : f })}
                className="cursor-pointer"
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '5px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 500,
                  background: filters.feature === f ? 'var(--text)' : 'var(--surface)',
                  color: filters.feature === f ? 'var(--bg)' : 'var(--text-2)',
                  border: filters.feature === f ? '1px solid var(--text)' : '1px solid var(--border)',
                }}
              >
                {f}
              </span>
            ))}
          </div>

          <TimelineView
            data={data}
            onCellClick={openNewBooking}
            onBookingClick={openBookingDetail}
            onRoomClick={(r) => onRoomSelect(r.id)}
            filters={filters}
            viewType={viewType}
          />
        </div>

        {/* Right rail */}
        <div>
          {/* Today's bookings */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-sm)', padding: 18 }}>
            <div className="flex justify-between items-center" style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
              오늘 내 예약
              <span
                onClick={onNavigateMy}
                style={{ fontSize: 11, color: 'var(--accent-ink)', cursor: 'pointer', fontWeight: 500 }}
              >
                전체 보기 →
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {MY_UPCOMING.filter((m) => m.date === '오늘').map((m) => (
                <div
                  key={m.id}
                  className="flex gap-2.5 items-start cursor-pointer"
                  style={{ padding: 8, borderRadius: 8 }}
                  onClick={() => {
                    const b = BOOKINGS.find((x) => x.id === m.id);
                    if (b) openBookingDetail(b);
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div
                    className="mono text-center"
                    style={{
                      fontSize: 10, color: 'var(--text-2)',
                      background: 'var(--surface-2)', borderRadius: 6,
                      padding: '4px 6px', minWidth: 56, lineHeight: 1.3, flexShrink: 0,
                    }}
                  >
                    {m.time.split('–')[0]}<br />
                    <span style={{ opacity: 0.6 }}>–{m.time.split('–')[1]}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{m.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.room} · {m.floor} · 👥 {m.attendees}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recurring */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-sm)', padding: 18, marginTop: 16 }}>
            <div className="flex justify-between items-center" style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
              반복 예약
              <span
                onClick={onNavigateRecurring}
                style={{ fontSize: 11, color: 'var(--accent-ink)', cursor: 'pointer', fontWeight: 500 }}
              >
                관리 →
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {RECURRING.map((r) => {
                const room = ROOMS.find((x) => x.id === r.roomId);
                return (
                  <div key={r.id} className="flex gap-2.5 items-start" style={{ padding: 8, borderRadius: 8 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, background: 'var(--lavender-soft)',
                      color: 'var(--lavender-ink)', display: 'grid', placeItems: 'center', flexShrink: 0,
                    }}>
                      <Icon name="repeat" size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.title}</div>
                      <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{r.rrule} · {room?.name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly summary */}
          <div style={{
            padding: 18, borderRadius: 14, marginTop: 16,
            background: 'linear-gradient(135deg, var(--peach-soft) 0%, var(--rose-soft) 50%, var(--lavender-soft) 100%)',
            border: '1px solid var(--rose-soft)',
          }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>🎯 이번 주 요약</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
              총 <b>12회</b> 회의 · <b>8.5시간</b><br />
              가장 많이 쓴 방: <b>라벤더</b> (4회)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
