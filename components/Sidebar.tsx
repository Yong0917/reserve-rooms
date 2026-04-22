'use client';

import { useRouter, usePathname } from 'next/navigation';
import Icon from './Icon';
import { useAppContext } from '@/lib/context/AppContext';

interface SidebarProps {
  onNewBooking: () => void;
}

const navItems = [
  { id: 'home', label: '타임라인', icon: 'timeline', href: '/' },
  { id: 'search', label: '빠른 예약', icon: 'search', href: '/search' },
  { id: 'my', label: '내 예약', icon: 'list', badge: 3, href: '/my' },
  { id: 'recurring', label: '반복 예약', icon: 'repeat', href: '/recurring' },
];

const floors = ['5F · 집중', '6F · 협업', '7F · 라운지'];

export default function Sidebar({ onNewBooking }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { filters, setFilters } = useAppContext();

  return (
    <aside
      className="flex flex-col gap-1"
      style={{
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        padding: '20px 16px',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'auto',
        width: 240,
      }}
    >
      <div
        className="flex items-center gap-2.5 cursor-pointer"
        style={{ padding: '4px 8px 20px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}
        onClick={() => router.push('/')}
      >
        <div
          style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--rose) 100%)',
            display: 'grid', placeItems: 'center',
            color: 'white', fontWeight: 700, fontSize: 16,
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(139,125,216,0.3)',
          }}
        >
          P
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.2px' }}>Plateer</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '1.5px' }}>ROOMS</div>
        </div>
      </div>

      <button
        onClick={onNewBooking}
        className="flex items-center justify-center gap-1.5 w-full cursor-pointer"
        style={{
          padding: '8px 14px',
          borderRadius: 10,
          border: 'none',
          background: 'var(--accent)',
          color: 'white',
          fontSize: 13,
          fontWeight: 500,
          marginBottom: 16,
          transition: 'background var(--duration-base), transform var(--duration-fast), box-shadow var(--duration-base)',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'var(--accent-ink)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'var(--accent)';
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <Icon name="plus" size={14} /> 새 예약
      </button>

      <div className="label-sm" style={{ padding: '12px 10px 6px' }}>
        Workspace
      </div>

      {navItems.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            className="flex items-center gap-2.5 w-full text-left cursor-pointer"
            style={{
              padding: isActive ? '8px 10px 8px 7px' : '8px 10px',
              borderRadius: 8,
              fontSize: 13.5,
              border: 'none',
              borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              background: isActive ? 'var(--accent-soft)' : 'transparent',
              color: isActive ? 'var(--accent-ink)' : 'var(--text-2)',
              fontWeight: isActive ? 600 : 400,
              transition: 'background var(--duration-base), color var(--duration-base), border-color var(--duration-base)',
            }}
            onMouseOver={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--surface-2)';
                e.currentTarget.style.color = 'var(--text)';
              }
            }}
            onMouseOut={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-2)';
              }
            }}
          >
            <Icon name={item.icon} size={16} />
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (
              <span
                style={{
                  fontSize: 10, background: 'var(--accent)', color: 'white',
                  padding: '1px 6px', borderRadius: 999, fontWeight: 600,
                }}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}

      <div className="label-sm" style={{ padding: '12px 10px 6px' }}>
        층 · 본사
      </div>

      {floors.map((f) => {
        const floorKey = f.split(' · ')[0] as '5F' | '6F' | '7F';
        const isActive = filters.floor === floorKey;
        return (
          <button
            key={f}
            onClick={() => setFilters({ ...filters, floor: isActive ? 'all' : floorKey })}
            className="flex items-center gap-2.5 w-full text-left cursor-pointer"
            style={{
              padding: '8px 10px', borderRadius: 8, fontSize: 13.5,
              border: 'none',
              background: isActive ? 'var(--surface-2)' : 'transparent',
              color: isActive ? 'var(--text)' : 'var(--text-2)',
              fontWeight: isActive ? 600 : 400,
              transition: 'background var(--duration-base), color var(--duration-base)',
            }}
            onMouseOver={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--surface-2)';
                e.currentTarget.style.color = 'var(--text)';
              }
            }}
            onMouseOut={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-2)';
              }
            }}
          >
            <Icon name="floor" size={16} />
            <span>{f}</span>
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      <div
        style={{
          padding: 12, borderRadius: 14, marginTop: 12,
          background: 'linear-gradient(135deg, var(--accent-soft), var(--lavender-soft))',
          border: '1px solid var(--accent-soft)',
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-ink)' }}>💡 Tip</div>
        <div style={{ fontSize: 11.5, color: 'var(--accent-ink)', opacity: 0.8, marginTop: 4, lineHeight: 1.4 }}>
          타임라인에서 빈 칸을 클릭해 빠르게 예약하세요
        </div>
      </div>
    </aside>
  );
}
