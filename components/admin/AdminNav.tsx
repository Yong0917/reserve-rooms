'use client';

import { usePathname, useRouter } from 'next/navigation';
import Icon from '@/components/Icon';

const navItems = [
  { href: '/admin/stats', label: '통계', icon: 'chart' },
  { href: '/admin/rooms', label: '회의실', icon: 'building' },
  { href: '/admin/bookings', label: '예약', icon: 'calendar' },
  { href: '/admin/users', label: '사용자', icon: 'users' },
];

interface AdminNavProps {
  adminName: string;
}

export default function AdminNav({ adminName }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 40px',
        gap: 4,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        height: 52,
      }}
    >
      <div
        className="flex items-center gap-2"
        style={{ marginRight: 24, paddingRight: 24, borderRight: '1px solid var(--border)' }}
      >
        <div
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--rose, #f97316) 100%)',
            display: 'grid', placeItems: 'center',
            color: 'white', fontWeight: 700, fontSize: 13,
            flexShrink: 0,
          }}
        >
          P
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.2px' }}>관리자</span>
      </div>

      {navItems.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="flex items-center gap-1.5 cursor-pointer"
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              background: active ? 'var(--accent-soft)' : 'transparent',
              color: active ? 'var(--accent)' : 'var(--text-2)',
              transition: 'background 0.12s, color 0.12s',
              cursor: 'pointer',
            }}
            onMouseOver={(e) => {
              if (!active) e.currentTarget.style.background = 'var(--surface-2, var(--surface))';
            }}
            onMouseOut={(e) => {
              if (!active) e.currentTarget.style.background = 'transparent';
            }}
          >
            <Icon name={item.icon} size={14} />
            {item.label}
          </button>
        );
      })}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>관리자</span> · {adminName}
        </div>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1 cursor-pointer"
          style={{
            padding: '5px 10px',
            borderRadius: 7,
            border: '1px solid var(--border)',
            background: 'transparent',
            fontSize: 12,
            color: 'var(--text-2)',
            cursor: 'pointer',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'var(--surface-2, var(--surface))')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Icon name="arrow" size={12} />
          메인 앱
        </button>
      </div>
    </nav>
  );
}
