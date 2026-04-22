'use client';

import { useRouter } from 'next/navigation';

interface PeriodSelectorProps {
  period: 'day' | 'week' | 'month';
  date: string;
  today: string;
}

const PERIODS: Array<{ value: 'day' | 'week' | 'month'; label: string }> = [
  { value: 'day', label: '일' },
  { value: 'week', label: '주' },
  { value: 'month', label: '월' },
];

export default function PeriodSelector({ period, date, today }: PeriodSelectorProps) {
  const router = useRouter();

  const navigate = (newPeriod: typeof period, newDate?: string) => {
    const d = newDate ?? date;
    router.push(`/admin/stats?period=${newPeriod}&date=${d}`);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <input
        type="date"
        value={date}
        max={today}
        onChange={(e) => navigate(period, e.target.value)}
        style={{
          padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)',
          background: 'var(--surface)', color: 'var(--text)', fontSize: 13, cursor: 'pointer',
        }}
      />
      <div
        style={{
          display: 'flex', border: '1px solid var(--border)',
          borderRadius: 8, overflow: 'hidden',
        }}
      >
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => navigate(p.value)}
            style={{
              padding: '7px 16px', border: 'none', fontSize: 13, cursor: 'pointer',
              background: period === p.value ? 'var(--accent)' : 'transparent',
              color: period === p.value ? 'white' : 'var(--text-2)',
              fontWeight: period === p.value ? 600 : 400,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
