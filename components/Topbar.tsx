'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';
import { createClient } from '@/lib/supabase/client';
import { searchGlobal } from '@/lib/supabase/queries';
import { useAppContext } from '@/lib/context/AppContext';
import type { User, Room } from '@/lib/types';

interface SearchResult {
  rooms: Room[];
  bookings: Array<{ id: string; title: string; startAt: string; roomName: string }>;
}

interface TopbarProps {
  me: User;
  userId: string;
}

export default function Topbar({ me, userId }: TopbarProps) {
  const router = useRouter();
  const { data, setSelectedDate, darkMode, setDarkMode, accentHue, setAccentHue, ACCENT_HUES } = useAppContext();
  const supabase = useRef(createClient()).current;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult>({ rooms: [], bookings: [] });
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSearch = useCallback((q: string) => {
    if (!q.trim() || !userId) {
      setResults({ rooms: [], bookings: [] });
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await searchGlobal(supabase, userId, q);
      setResults(res);
    }, 300);
  }, [supabase, userId]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    handleSearch(q);
  };

  const hasResults = results.rooms.length > 0 || results.bookings.length > 0;

  const formatKST = (isoStr: string) => {
    const d = new Date(isoStr);
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    return `${kst.getUTCMonth() + 1}/${kst.getUTCDate()} ${String(kst.getUTCHours()).padStart(2, '0')}:${String(kst.getUTCMinutes()).padStart(2, '0')}`;
  };

  const { todayStr, tomorrowStr } = useMemo(() => {
    const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
    const kstNow = new Date(new Date().getTime() + KST_OFFSET_MS);
    const today = kstNow.toISOString().split('T')[0];
    const tomorrow = new Date(kstNow.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { todayStr: today, tomorrowStr: tomorrow };
  }, []);
  const notifications = useMemo(
    () => data.MY_UPCOMING.filter((b) => b.date === todayStr || b.date === tomorrowStr),
    [data.MY_UPCOMING, todayStr, tomorrowStr],
  );

  return (
    <div
      className="flex items-center gap-4"
      style={{
        padding: '18px 40px',
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Search bar */}
      <div style={{ flex: 1, maxWidth: 440, position: 'relative' }}>
        <div
          className="flex items-center gap-2"
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
          style={{
            background: 'var(--surface-2)',
            border: `1px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
            boxShadow: open ? 'var(--shadow-focus)' : 'none',
            borderRadius: 10,
            padding: open ? '0 12px' : '8px 12px',
            fontSize: 13,
            color: 'var(--text-3)',
            cursor: 'text',
            transition: 'border-color var(--duration-base), box-shadow var(--duration-base)',
          }}
          onMouseOver={(e) => { if (!open) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-strong)'; }}
          onMouseOut={(e) => { if (!open) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
        >
          <Icon name="search" size={14} />
          {open ? (
            <input
              ref={inputRef}
              value={query}
              onChange={handleQueryChange}
              placeholder="회의실, 예약 제목으로 검색..."
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: 13, color: 'var(--text)', outline: 'none',
                padding: '8px 0',
              }}
            />
          ) : (
            <span>회의실, 시간, 팀원으로 검색...</span>
          )}
          <kbd
            style={{
              marginLeft: 'auto', fontFamily: 'inherit', fontSize: 10,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderBottom: '2px solid var(--border-strong)',
              padding: '1px 5px', borderRadius: 4, color: 'var(--text-3)',
              flexShrink: 0,
            }}
          >
            ⌘K
          </kbd>
        </div>

        {/* Dropdown */}
        {open && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => { setOpen(false); setQuery(''); setResults({ rooms: [], bookings: [] }); }}
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            />
            <div
              className="animate-slideDown"
              style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, boxShadow: 'var(--shadow-lg)',
                zIndex: 100, overflow: 'hidden',
                minHeight: 40,
              }}
            >
              {!query.trim() && (
                <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-3)' }}>
                  검색어를 입력하세요
                </div>
              )}

              {query.trim() && !hasResults && (
                <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-3)' }}>
                  검색 결과 없음
                </div>
              )}

              {results.rooms.length > 0 && (
                <div>
                  <div className="label-sm" style={{ padding: '8px 16px 4px' }}>
                    회의실
                  </div>
                  {results.rooms.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => { router.push(`/rooms/${r.id}`); setOpen(false); setQuery(''); }}
                      className="flex items-center gap-2.5"
                      style={{
                        padding: '8px 16px', cursor: 'pointer',
                        transition: 'background 0.1s',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Icon name="building" size={14} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.floor} · 👥 {r.capacity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.bookings.length > 0 && (
                <div>
                  <div className="label-sm" style={{ padding: '8px 16px 4px' }}>
                    예약
                  </div>
                  {results.bookings.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => {
                        setSelectedDate(new Date(b.startAt));
                        router.push('/');
                        setOpen(false);
                        setQuery('');
                      }}
                      className="flex items-center gap-2.5"
                      style={{
                        padding: '8px 16px', cursor: 'pointer',
                        transition: 'background 0.1s',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Icon name="calendar" size={14} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{b.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{b.roomName} · {formatKST(b.startAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Notification button */}
      <div style={{ position: 'relative' }}>
        <button
          className="flex items-center justify-center cursor-pointer"
          style={{
            padding: 8, width: 34, height: 34, borderRadius: 10,
            border: 'none', background: notifOpen ? 'var(--surface-2)' : 'transparent',
            color: 'var(--text-2)', transition: 'background 0.12s',
            position: 'relative',
          }}
          onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
          onMouseOut={(e) => { if (!notifOpen) e.currentTarget.style.background = 'transparent'; }}
        >
          <Icon name="bell" />
          {notifications.length > 0 && (
            <span style={{
              position: 'absolute', top: 5, right: 5,
              width: 7, height: 7, borderRadius: '50%',
              background: '#e05c5c', border: '1.5px solid var(--surface)',
            }} />
          )}
        </button>

        {notifOpen && (
          <>
            <div
              onClick={() => setNotifOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            />
            <div
              className="animate-slideDown"
              style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                width: 280, background: 'var(--surface)',
                border: '1px solid var(--border)', borderRadius: 12,
                boxShadow: 'var(--shadow-lg)', zIndex: 100, overflow: 'hidden',
              }}
            >
              <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
                알림
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
                  새 알림이 없습니다
                </div>
              ) : (
                <div>
                  {notifications.map((b) => (
                    <div
                      key={b.id}
                      style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedDate(new Date(b.date));
                        setNotifOpen(false);
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                        {b.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {b.date === todayStr ? '오늘' : '내일'} · {b.time} · {b.room}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Profile button */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--peach), var(--rose))',
            display: 'grid', placeItems: 'center',
            color: 'white', fontWeight: 700, fontSize: 12,
            cursor: 'pointer',
            transition: 'box-shadow var(--duration-base)',
            boxShadow: profileOpen ? '0 0 0 3px var(--accent-soft)' : 'none',
          }}
          onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
          onMouseOver={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 3px var(--accent-soft)'; }}
          onMouseOut={(e) => { if (!profileOpen) (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
        >
          {me.name[0]}
        </div>

        {profileOpen && (
          <>
            <div
              onClick={() => setProfileOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            />
            <div
              className="animate-slideDown"
              style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                width: 220, background: 'var(--surface)',
                border: '1px solid var(--border)', borderRadius: 12,
                boxShadow: 'var(--shadow-lg)', zIndex: 100, overflow: 'hidden',
              }}
            >
              {/* User info */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{me.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{me.team}</div>
              </div>

              {/* Dark mode toggle */}
              <div
                className="flex items-center"
                style={{ padding: '10px 16px', gap: 10, borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={() => setDarkMode(!darkMode)}
              >
                <Icon name={darkMode ? 'sun' : 'moon'} size={14} />
                <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>{darkMode ? '라이트 모드' : '다크 모드'}</span>
                <div style={{
                  width: 32, height: 18, borderRadius: 9, background: darkMode ? 'var(--accent)' : 'var(--border-strong)',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%', background: 'white',
                    position: 'absolute', top: 2, left: darkMode ? 16 : 2,
                    transition: 'left 0.2s',
                  }} />
                </div>
              </div>

              {/* Accent color */}
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>테마 색상</div>
                <div className="flex items-center" style={{ gap: 6 }}>
                  {(Object.entries(ACCENT_HUES) as [keyof typeof ACCENT_HUES, { accent: string; soft: string; ink: string }][]).map(([hue, val]) => (
                    <div
                      key={hue}
                      onClick={() => setAccentHue(hue)}
                      style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: val.accent, cursor: 'pointer',
                        outline: accentHue === hue ? `2px solid ${val.accent}` : 'none',
                        outlineOffset: 2,
                        transition: 'transform 0.1s',
                      }}
                      onMouseOver={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.15)'; }}
                      onMouseOut={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
                    />
                  ))}
                </div>
              </div>

              {/* Logout */}
              <div
                className="flex items-center"
                style={{ padding: '10px 16px', gap: 10, cursor: 'pointer', color: 'var(--text-2)' }}
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/login');
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon name="logout" size={14} />
                <span style={{ fontSize: 13 }}>로그아웃</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
