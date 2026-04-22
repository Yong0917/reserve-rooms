'use client';

import { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import { formatH } from '@/lib/data';
import { createClient } from '@/lib/supabase/client';
import type { PlateerData, Room, Booking, BookingTag } from '@/lib/types';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function dateToInputValue(d: Date): string {
  const kst = new Date(d.getTime() + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

interface BookingModalProps {
  data: PlateerData;
  initial: { room?: Room; hour?: number };
  selectedDate: Date;
  mode?: 'create' | 'edit';
  editTarget?: Booking;
  onClose: () => void;
  onCreate: (booking: { title: string; roomId: string; date: string; start: number; end: number; attendees: string[]; rrule: string; tag: BookingTag }) => void;
  onUpdate?: (booking: { title: string; roomId: string; date: string; start: number; end: number; attendees: string[]; tag: BookingTag }) => void;
}

const RRULE_OPTIONS = [
  ['none', '반복 안 함'],
  ['daily', '매일'],
  ['weekly', '매주'],
  ['biweekly', '격주'],
  ['monthly', '매월'],
] as const;

const TAG_OPTIONS: [BookingTag, string][] = [
  ['team', '팀 회의'],
  ['design', '디자인'],
  ['company', '전사'],
  ['external', '외부'],
  ['1on1', '1on1'],
  ['exec', '임원'],
  ['product', '제품'],
];

export default function BookingModal({
  data, initial, selectedDate, mode = 'create', editTarget, onClose, onCreate, onUpdate,
}: BookingModalProps) {
  const { ROOMS, ME } = data;
  const supabase = createClient();

  const initDate = editTarget?.startAt
    ? dateToInputValue(new Date(editTarget.startAt))
    : dateToInputValue(selectedDate);

  const initRoomId = editTarget?.roomId ?? initial?.room?.id ?? (ROOMS[0]?.id ?? '');
  const initStart = editTarget?.start ?? initial?.hour ?? 11;
  const initDuration = editTarget
    ? Math.round((editTarget.end - editTarget.start) * 60)
    : 60;
  const initAttendees = editTarget?.attendees?.length
    ? editTarget.attendees.map((name, i) => ({ name, me: i === 0 && name === ME.name }))
    : [{ name: ME.name, me: true }];

  const [title, setTitle] = useState(editTarget?.title ?? '');
  const [roomId, setRoomId] = useState(initRoomId);
  const [date, setDate] = useState(initDate);
  const [startH, setStartH] = useState(initStart);
  const [endH, setEndH] = useState<number>(initStart + initDuration / 60);
  const [selectionStep, setSelectionStep] = useState<'start' | 'end'>('start');
  const [rrule, setRrule] = useState('none');
  const [attendees, setAttendees] = useState(initAttendees);
  const [attInput, setAttInput] = useState('');
  const [attSuggestions, setAttSuggestions] = useState<{ id: string; name: string; team: string }[]>([]);
  const [busySlots, setBusySlots] = useState<Set<number>>(new Set());
  const [tag, setTag] = useState<BookingTag>(editTarget?.tag ?? 'team');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const room = ROOMS.find((r) => r.id === roomId) ?? ROOMS[0];

  const slots: number[] = [];
  for (let h = 8; h < 20; h += 0.5) slots.push(h);

  // 선택된 회의실 + 날짜의 실제 예약 슬롯 조회
  useEffect(() => {
    if (!date || !roomId) return;
    const [y, m, d] = date.split('-').map(Number);
    const kstMs = Date.UTC(y, m - 1, d, 0, 0, 0);
    const dayStartUTC = new Date(kstMs - KST_OFFSET_MS).toISOString();
    const dayEndUTC = new Date(kstMs - KST_OFFSET_MS + 24 * 60 * 60 * 1000).toISOString();

    supabase
      .from('bookings')
      .select('start_at, end_at, id')
      .eq('room_id', roomId)
      .eq('status', 'active')
      .gte('start_at', dayStartUTC)
      .lt('start_at', dayEndUTC)
      .then(({ data: rows }) => {
        const busy = new Set<number>();
        (rows ?? []).forEach((b: { start_at: string; end_at: string; id: string }) => {
          if (mode === 'edit' && editTarget && b.id === editTarget.id) return;
          const s = (new Date(b.start_at).getTime() + KST_OFFSET_MS) / 3600000 % 24;
          const e = (new Date(b.end_at).getTime() + KST_OFFSET_MS) / 3600000 % 24;
          for (let h = Math.round(s * 2) / 2; h < e; h += 0.5) busy.add(h);
        });
        setBusySlots(busy);
      });
  }, [roomId, date]); // eslint-disable-line react-hooks/exhaustive-deps

  // 참석자 자동완성
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!attInput.trim()) { setAttSuggestions([]); return; }
      const { data: users } = await supabase
        .from('users')
        .select('id, name, team')
        .ilike('name', `%${attInput.trim()}%`)
        .limit(6);
      const existing = new Set(attendees.map((a) => a.name));
      setAttSuggestions(
        ((users ?? []) as { id: string; name: string; team: string }[])
          .filter((u) => !existing.has(u.name))
      );
    }, 300);
  }, [attInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const addAtt = (name?: string) => {
    const n = name ?? attInput.trim();
    if (n) {
      setAttendees([...attendees, { name: n, me: false }]);
      setAttInput('');
      setAttSuggestions([]);
    }
  };

  const submit = async () => {
    if (endH <= startH) {
      setError('종료 시간을 선택해주세요');
      return;
    }
    // 클라이언트 중복 검증
    const conflict = data.BOOKINGS.find((b) => {
      if (b.roomId !== roomId) return false;
      if (mode === 'edit' && editTarget && b.id === editTarget.id) return false;
      return b.start < endH && b.end > startH;
    });
    if (conflict) {
      setError(`${formatH(conflict.start)}–${formatH(conflict.end)} 시간대에 이미 예약이 있습니다`);
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      title: title || '새 회의',
      roomId,
      date,
      start: startH,
      end: endH,
      attendees: attendees.map((a) => a.name),
    };

    if (mode === 'edit' && editTarget && onUpdate) {
      onUpdate({ ...payload, tag });
    } else {
      onCreate({ ...payload, rrule, tag });
    }
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
          width: 720,
          maxWidth: 'calc(100vw - 40px)',
          maxHeight: 'calc(100vh - 40px)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Head */}
        <div
          className="flex justify-between items-start"
          style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              {mode === 'edit' ? '예약 수정' : '새 예약'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-3)' }}>
              {room?.floor} · {room?.name} · 👥 최대 {room?.capacity}명
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ padding: 8, width: 34, height: 34, border: 'none', background: 'transparent', color: 'var(--text-2)', borderRadius: 10, cursor: 'pointer' }}
          >
            <Icon name="x" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
          {error && (
            <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--coral-soft, #fde8e8)', color: 'var(--coral-ink, #8a2020)', borderRadius: 10, fontSize: 12.5 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
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
              placeholder="예: 디자인 스프린트 리뷰"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex gap-2.5" style={{ marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                회의실
              </label>
              <select
                className="w-full"
                style={{
                  padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10,
                  background: 'var(--surface)', fontSize: 13.5, color: 'var(--text)', fontFamily: 'inherit',
                }}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              >
                {ROOMS.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} · {r.floor} · 👥{r.capacity}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                날짜
              </label>
              <input
                type="date"
                className="w-full"
                style={{
                  padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10,
                  background: 'var(--surface)', fontSize: 13.5, color: 'var(--text)', fontFamily: 'inherit',
                }}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
                {selectionStep === 'end'
                  ? `종료 시간 선택 · ${formatH(startH)} 시작`
                  : endH > startH
                    ? `시간 · ${formatH(startH)} – ${formatH(endH)}`
                    : '시작 시간 선택'}
              </label>
              {endH > startH && selectionStep === 'start' && (() => {
                const mins = Math.round((endH - startH) * 60);
                const h = Math.floor(mins / 60);
                const m = mins % 60;
                const label = h > 0 && m > 0 ? `${h}시간 ${m}분` : h > 0 ? `${h}시간` : `${m}분`;
                return <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>;
              })()}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
              {slots.map((h) => {
                const isBusy = busySlots.has(h);
                const isOn = h === startH || (h === endH && endH > startH);
                const isRange = h > startH && h < endH;
                return (
                  <div
                    key={h}
                    onClick={() => {
                      if (isBusy) return;
                      if (selectionStep === 'end' && h > startH) {
                        setEndH(h);
                        setSelectionStep('start');
                      } else {
                        setStartH(h);
                        setEndH(h);
                        setSelectionStep('end');
                      }
                    }}
                    className="mono text-center cursor-pointer"
                    style={{
                      padding: '6px 4px', borderRadius: 8, fontSize: 11,
                      border: '1px solid var(--border)',
                      background: isBusy
                        ? 'repeating-linear-gradient(45deg, var(--surface-2), var(--surface-2) 3px, var(--border) 3px, var(--border) 6px)'
                        : isOn ? 'var(--accent)' : isRange ? 'var(--accent-soft)' : 'var(--surface)',
                      color: isBusy ? 'var(--text-4)' : isOn ? 'white' : isRange ? 'var(--accent-ink)' : 'var(--text)',
                      textDecoration: isBusy ? 'line-through' : 'none',
                      cursor: isBusy ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {formatH(h)}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
              태그
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {TAG_OPTIONS.map(([val, label]) => (
                <div
                  key={val}
                  onClick={() => setTag(val)}
                  style={{
                    padding: '5px 11px', borderRadius: 999, fontSize: 12, cursor: 'pointer', fontWeight: 500,
                    border: tag === val ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: tag === val ? 'var(--accent-soft)' : 'transparent',
                    color: tag === val ? 'var(--accent-ink)' : 'var(--text-2)',
                    transition: 'all var(--duration-fast)',
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {mode === 'create' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                반복
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {RRULE_OPTIONS.map(([val, label]) => (
                  <div
                    key={val}
                    onClick={() => setRrule(val)}
                    className="flex items-center gap-2 cursor-pointer"
                    style={{
                      padding: '10px 12px', border: rrule === val ? '1px solid var(--accent)' : '1px solid var(--border)',
                      borderRadius: 10, fontSize: 12.5,
                      background: rrule === val ? 'var(--accent-soft)' : 'transparent',
                      color: rrule === val ? 'var(--accent-ink)' : 'var(--text)',
                      fontWeight: rrule === val ? 500 : 400,
                    }}
                  >
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%', flexShrink: 0, position: 'relative',
                      border: rrule === val ? '1.5px solid var(--accent)' : '1.5px solid var(--border-strong)',
                    }}>
                      {rrule === val && (
                        <div style={{ position: 'absolute', inset: 2.5, borderRadius: '50%', background: 'var(--accent)' }} />
                      )}
                    </div>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
              참석자 · {attendees.length}명
            </label>
            <div className="flex flex-wrap gap-1.5" style={{ marginBottom: 8 }}>
              {attendees.map((a, i) => {
                const chipColors = ['mint', 'peach', 'sky', 'rose', 'butter', 'lavender'];
                const c = a.me ? 'accent' : chipColors[a.name.charCodeAt(0) % chipColors.length];
                return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5"
                  style={{
                    padding: '4px 8px 4px 4px',
                    background: `var(--${c}-soft)`,
                    color: `var(--${c}-ink)`,
                    borderRadius: 999, fontSize: 12, fontWeight: 500,
                  }}
                >
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: `var(--${c})`, color: 'white', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700 }}>
                    {a.name[0]}
                  </span>
                  {a.name}{a.me && ' (나)'}
                  {!a.me && (
                    <span
                      onClick={() => setAttendees(attendees.filter((_, j) => j !== i))}
                      style={{ cursor: 'pointer', opacity: 0.6 }}
                    >
                      ✕
                    </span>
                  )}
                </span>
                );
              })}
            </div>
            <div style={{ position: 'relative' }}>
              <div className="flex gap-1.5">
                <input
                  className="flex-1"
                  style={{
                    padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10,
                    background: 'var(--surface)', fontSize: 13.5, color: 'var(--text)', fontFamily: 'inherit',
                  }}
                  placeholder="이름으로 검색..."
                  value={attInput}
                  onChange={(e) => setAttInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAtt(); } }}
                />
                <button
                  onClick={() => addAtt()}
                  style={{
                    padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)',
                    background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  추가
                </button>
              </div>
              {attSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 60,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, boxShadow: 'var(--shadow)', zIndex: 10, marginTop: 4,
                }}>
                  {attSuggestions.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => addAtt(u.name)}
                      style={{
                        padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                        borderBottom: '1px solid var(--border)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ fontWeight: 500 }}>{u.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{u.team}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex justify-between items-center"
          style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', background: 'linear-gradient(to top, var(--surface-2), var(--surface))' }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            💡 <b>{room?.name}</b>에서 <b>{formatH(startH)}–{formatH(endH)}</b> 예약
            {mode === 'create' && rrule !== 'none' && ' · 반복'}
          </div>
          <div className="flex gap-2">
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
              disabled={submitting}
              style={{
                padding: '8px 14px', borderRadius: 10, border: 'none',
                background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 500,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {mode === 'edit' ? '수정하기' : '예약하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
