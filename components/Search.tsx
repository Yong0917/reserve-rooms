'use client';

import { useState, useMemo } from 'react';
import Icon from './Icon';
import { roomThumb, NOW_HOUR } from '@/lib/data';
import { createClient } from '@/lib/supabase/client';
import { fetchAvailableRooms } from '@/lib/supabase/queries';
import type { PlateerData, Room } from '@/lib/types';

interface SearchProps {
  data: PlateerData;
  openNewBooking: (ctx?: { room?: Room; hour?: number }) => void;
  onRoomSelect: (roomId: string) => void;
  favorites: string[];
}

const SIZE_TO_CAPACITY: Record<string, number> = {
  '1-2': 1, '3-4': 3, '5-8': 5, '9+': 9,
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function calcTimeRange(when: string, duration: number, pickDate: string): { startAt: string; endAt: string; label: string } {
  const now = new Date();
  let startMs: number;
  let label: string;

  if (when === '1h') {
    startMs = now.getTime() + 60 * 60 * 1000;
    label = '1시간 후';
  } else if (when === 'tomo') {
    const kstTomorrow = new Date(now.getTime() + KST_OFFSET_MS + 24 * 60 * 60 * 1000);
    const dateStr = kstTomorrow.toISOString().split('T')[0];
    startMs = new Date(`${dateStr}T09:00:00.000Z`).getTime() - KST_OFFSET_MS;
    label = '내일 오전 9시';
  } else if (when === 'pick' && pickDate) {
    startMs = new Date(`${pickDate}T09:00:00.000Z`).getTime() - KST_OFFSET_MS;
    label = pickDate;
  } else {
    startMs = now.getTime();
    label = '지금';
  }

  const kst = new Date(startMs + KST_OFFSET_MS);
  const h = String(kst.getUTCHours()).padStart(2, '0');
  const m = String(kst.getUTCMinutes()).padStart(2, '0');
  const timeLabel = `${h}:${m}`;

  return {
    startAt: new Date(startMs).toISOString(),
    endAt: new Date(startMs + duration * 60 * 1000).toISOString(),
    label: `${label} ${timeLabel}`,
  };
}

function fmtHourFromISO(isoStr: string): string {
  const d = new Date(isoStr);
  const kst = new Date(d.getTime() + KST_OFFSET_MS);
  return `${String(kst.getUTCHours()).padStart(2, '0')}:${String(kst.getUTCMinutes()).padStart(2, '0')}`;
}

const SORT_TABS = ['추천순', '가까운순', '큰 순'] as const;
type SortTab = typeof SORT_TABS[number];

export default function Search({ data, openNewBooking, onRoomSelect, favorites }: SearchProps) {
  const supabase = useMemo(() => createClient(), []);

  const [when, setWhen] = useState('now');
  const [duration, setDuration] = useState(60);
  const [size, setSize] = useState('3-4');
  const [floors, setFloors] = useState(['5F', '6F']);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [pickDate, setPickDate] = useState('');
  const [sortTab, setSortTab] = useState<SortTab>('추천순');
  const [results, setResults] = useState<Room[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [timeInfo, setTimeInfo] = useState<{ label: string; endLabel: string } | null>(null);

  const toggleFloor = (f: string) =>
    setFloors(floors.includes(f) ? floors.filter((x) => x !== f) : [...floors, f]);
  const toggleEquip = (f: string) =>
    setEquipment(equipment.includes(f) ? equipment.filter((x) => x !== f) : [...equipment, f]);

  const handleSearch = async () => {
    if (when === 'pick' && !pickDate) return;
    setSearching(true);
    const { startAt, endAt, label } = calcTimeRange(when, duration, pickDate);
    const endTimeLabel = fmtHourFromISO(endAt);
    setTimeInfo({ label, endLabel: endTimeLabel });

    const found = await fetchAvailableRooms(supabase, {
      startAt,
      endAt,
      minCapacity: SIZE_TO_CAPACITY[size] ?? 1,
      floors,
      equipment,
      favoritesOnly,
      favorites,
    });
    setResults(found);
    setSearching(false);
  };

  const sortedResults = useMemo(() => {
    if (!results) return [];
    const list = [...results];
    if (sortTab === '가까운순') {
      return list.sort((a, b) => a.floor.localeCompare(b.floor));
    }
    if (sortTab === '큰 순') {
      return list.sort((a, b) => b.capacity - a.capacity);
    }
    // 추천순: favorites first, then by capacity fit (minimize waste), then floor
    const minCap = SIZE_TO_CAPACITY[size] ?? 1;
    return list.sort((a, b) => {
      const aFav = favorites.includes(a.id) ? 0 : 1;
      const bFav = favorites.includes(b.id) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;
      const aWaste = a.capacity - minCap;
      const bWaste = b.capacity - minCap;
      if (aWaste !== bWaste) return aWaste - bWaste;
      return a.floor.localeCompare(b.floor);
    });
  }, [results, sortTab, favorites, size]);

  const displayResults = results !== null ? sortedResults : data.ROOMS.filter((r) => floors.includes(r.floor)).slice(0, 8);

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>빠른 예약</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-3)', fontSize: 13 }}>
          조건을 선택하면 매칭되는 회의실을 바로 보여드려요
        </p>
      </div>

      {/* Search card */}
      <div
        style={{
          padding: 24, borderRadius: 14, marginBottom: 20,
          background: 'linear-gradient(135deg, var(--accent-soft) 0%, var(--sky-soft) 50%, var(--rose-soft) 100%)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 140px', gap: 16, alignItems: 'stretch' }}>
          {/* When */}
          <div className="flex flex-col" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>언제</label>
            <div style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', fontSize: 13.5, fontWeight: 500, color: 'var(--text)' }}>
              {when === 'now' ? '📅 오늘 · 지금' : when === '1h' ? '1시간 후' : when === 'tomo' ? '내일 오전' : pickDate || '날짜 선택'}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1.5" style={{ flex: 1, alignContent: 'flex-start' }}>
              {[['now', '지금'], ['1h', '1시간 후'], ['tomo', '내일 오전'], ['pick', '날짜 선택']].map(([v, l]) => (
                <span
                  key={v}
                  onClick={() => setWhen(v)}
                  className="cursor-pointer"
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 500,
                    background: when === v ? 'var(--text)' : 'var(--surface)',
                    color: when === v ? 'var(--bg)' : 'var(--text-2)',
                    border: when === v ? '1px solid var(--text)' : '1px solid var(--border)',
                  }}
                >
                  {l}
                </span>
              ))}
              {when === 'pick' && (
                <input
                  type="date"
                  value={pickDate}
                  onChange={(e) => setPickDate(e.target.value)}
                  style={{
                    marginTop: 4, padding: '3px 8px', borderRadius: 8,
                    border: '1px solid var(--border)', background: 'var(--surface)',
                    fontSize: 12, color: 'var(--text)', width: '100%',
                  }}
                />
              )}
            </div>
          </div>

          {/* Duration */}
          <div className="flex flex-col" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>얼마나</label>
            <div style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', fontSize: 13.5, fontWeight: 500, color: 'var(--text)' }}>
              ⏱ {duration}분
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1.5" style={{ flex: 1, alignContent: 'flex-start' }}>
              {[15, 30, 60, 90].map((d) => (
                <span
                  key={d}
                  onClick={() => setDuration(d)}
                  className="cursor-pointer"
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 500,
                    background: duration === d ? 'var(--text)' : 'var(--surface)',
                    color: duration === d ? 'var(--bg)' : 'var(--text-2)',
                    border: duration === d ? '1px solid var(--text)' : '1px solid var(--border)',
                  }}
                >
                  {d}분
                </span>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="flex flex-col" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>몇 명</label>
            <div style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', fontSize: 13.5, fontWeight: 500, color: 'var(--text)' }}>
              👥 {size}명
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1.5" style={{ flex: 1, alignContent: 'flex-start' }}>
              {['1-2', '3-4', '5-8', '9+'].map((s) => (
                <span
                  key={s}
                  onClick={() => setSize(s)}
                  className="cursor-pointer"
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 500,
                    background: size === s ? 'var(--text)' : 'var(--surface)',
                    color: size === s ? 'var(--bg)' : 'var(--text-2)',
                    border: size === s ? '1px solid var(--text)' : '1px solid var(--border)',
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            disabled={searching || (when === 'pick' && !pickDate)}
            className="flex items-center justify-center gap-1.5 cursor-pointer"
            style={{
              padding: '11px 20px', borderRadius: 10, border: 'none',
              background: searching ? 'var(--text-4)' : 'var(--accent)',
              color: 'white', fontSize: 14, fontWeight: 500,
              alignSelf: 'center', height: 46, width: '100%',
              cursor: searching ? 'not-allowed' : 'pointer',
            }}
          >
            {searching ? '검색 중...' : <>찾기 <Icon name="arrow" size={14} /></>}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20 }}>
        {/* Filter sidebar */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, alignSelf: 'flex-start' }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            필터
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>층</div>
            {['5F', '6F', '7F'].map((f) => (
              <label key={f} className="flex items-center gap-2 cursor-pointer" style={{ padding: '4px 0', fontSize: 13 }}>
                <input type="checkbox" checked={floors.includes(f)} onChange={() => toggleFloor(f)} />
                {f}
              </label>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>장비</div>
            {['모니터', 'TV', '화이트보드', '화상회의', '프로젝터', '조용함'].map((f) => (
              <label key={f} className="flex items-center gap-2 cursor-pointer" style={{ padding: '4px 0', fontSize: 13 }}>
                <input type="checkbox" checked={equipment.includes(f)} onChange={() => toggleEquip(f)} />
                {f}
              </label>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>기타</div>
            <label className="flex items-center gap-2 cursor-pointer" style={{ padding: '4px 0', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={favoritesOnly}
                onChange={(e) => setFavoritesOnly(e.target.checked)}
              />
              즐겨찾기만
            </label>
            <label className="flex items-center gap-2 cursor-pointer" style={{ padding: '4px 0', fontSize: 13 }}>
              <input type="checkbox" /> 창문 있음
            </label>
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="flex justify-between items-baseline" style={{ marginBottom: 12 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{displayResults.length}개 {results !== null ? '매칭' : '(검색 전 미리보기)'}</span>
              {timeInfo && (
                <span style={{ color: 'var(--text-3)', fontSize: 12, marginLeft: 8 }}>
                  {timeInfo.label} ~ {timeInfo.endLabel} · 👥 {size} · {floors.join(' · ')}
                </span>
              )}
            </div>
            <div style={{ display: 'inline-flex', background: 'var(--surface-2)', borderRadius: 10, padding: 3, gap: 2 }}>
              {SORT_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSortTab(tab)}
                  style={{
                    border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12.5,
                    fontWeight: 500, cursor: 'pointer',
                    background: sortTab === tab ? 'var(--surface)' : 'transparent',
                    color: sortTab === tab ? 'var(--text)' : 'var(--text-2)',
                    boxShadow: sortTab === tab ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {results !== null && results.length === 0 && (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              조건에 맞는 사용 가능한 회의실이 없습니다
            </div>
          )}

          {displayResults.map((r, idx) => {
            const isBest = results !== null && idx === 0;
            const isFav = favorites.includes(r.id);
            return (
              <div
                key={r.id}
                onClick={() => onRoomSelect(r.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '72px minmax(0, 1fr) 160px 110px 100px',
                  gap: 16, alignItems: 'center',
                  padding: '16px 20px',
                  background: 'var(--surface)',
                  border: isBest ? '1px solid var(--accent)' : '1px solid var(--border)',
                  borderTop: isBest ? '2px solid var(--accent)' : '1px solid var(--border)',
                  boxShadow: isBest ? '0 0 0 3px var(--accent-soft)' : 'none',
                  borderRadius: 14, marginBottom: 8,
                  cursor: 'pointer',
                  transition: 'border-color var(--duration-base), box-shadow var(--duration-base), transform var(--duration-fast)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  if (!isBest) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }
                  else e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-soft), var(--shadow-md)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'none';
                  if (!isBest) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }
                  else e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-soft)';
                }}
              >
                {/* Thumb */}
                <div style={{ width: 72, height: 72, borderRadius: 12, background: roomThumb(r.color), alignSelf: 'center', position: 'relative' }}>
                  {isFav && (
                    <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 12, color: '#ff4d6d' }}>♥</span>
                  )}
                </div>

                {/* Content */}
                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div className="flex items-center gap-1.5" style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.2 }}>
                    {r.name}
                    {isBest && (
                      <span style={{ fontSize: 10.5, background: 'var(--butter-soft)', color: 'var(--butter-ink)', padding: '2px 7px', borderRadius: 999, fontWeight: 500 }}>
                        ⭐ 추천
                      </span>
                    )}
                    {isFav && (
                      <span style={{ fontSize: 10.5, background: 'var(--rose-soft, #fce7ee)', color: 'var(--rose-ink, #8a3654)', padding: '2px 7px', borderRadius: 999, fontWeight: 500 }}>
                        ♥ 즐겨찾기
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.3 }}>
                    {r.floor} · 👥 {r.capacity} · {r.zone}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {r.features.map((f) => (
                      <span
                        key={f}
                        style={{
                          display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
                          borderRadius: 999, fontSize: 10.5, background: 'var(--surface-2)', border: 'none', color: 'var(--text-2)', fontWeight: 500,
                        }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Availability info */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: 0.5 }}>
                    {results !== null ? '✓ 사용 가능' : '09 — 19시'}
                  </span>
                </div>

                {/* Status */}
                {results !== null && (
                  <div className="flex flex-col items-center gap-0.5 text-center" style={{ fontSize: 12, color: 'var(--mint-ink)', fontWeight: 600 }}>
                    ✓ {duration}분 가능
                    {timeInfo && <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 400 }}>{timeInfo.label}부터</span>}
                  </div>
                )}

                {/* Action */}
                <div className="flex justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); openNewBooking({ room: r, hour: Math.ceil(NOW_HOUR) }); }}
                    style={{
                      padding: '5px 10px', borderRadius: 10, border: 'none',
                      background: 'var(--accent)', color: 'white', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    예약 →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
