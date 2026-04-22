import { createClient } from '@/lib/supabase/server';
import { fetchAdminStats } from '@/lib/supabase/queries';
import StatCard from '@/components/admin/StatCard';
import UsageChart from '@/components/admin/UsageChart';
import PeriodSelector from './PeriodSelector';

interface PageProps {
  searchParams: Promise<{ period?: string; date?: string }>;
}

export default async function StatsPage({ searchParams }: PageProps) {
  const { period: rawPeriod, date: rawDate } = await searchParams;
  const period = (['day', 'week', 'month'].includes(rawPeriod ?? '') ? rawPeriod : 'week') as 'day' | 'week' | 'month';
  const today = new Date().toISOString().split('T')[0];
  const date = rawDate ?? today;

  const supabase = await createClient();
  const stats = await fetchAdminStats(supabase, period, date);

  const maxTrend = Math.max(...stats.trend.map((t) => t.count), 1);

  const periodLabel = { day: '일별', week: '주별', month: '월별' }[period];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>사용 통계</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>{periodLabel} 회의실 사용 현황</p>
        </div>
        <PeriodSelector period={period} date={date} today={today} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard label="총 예약 수" value={stats.totalBookings} sub="이번 기간 활성 예약" accent />
        <StatCard label="평균 사용률" value={`${stats.avgUtilization}%`} sub="전체 회의실 평균" />
        <StatCard label="취소율" value={`${stats.cancellationRate}%`} sub="취소 / 전체 예약" />
        <StatCard
          label="인기 회의실"
          value={stats.topRoom?.name ?? '—'}
          sub={stats.topRoom ? `${stats.topRoom.count}건` : '데이터 없음'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '20px 24px',
          }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>회의실별 사용률</h2>
          <UsageChart data={stats.byRoom} />
        </div>

        <div
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '20px 24px',
          }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>예약 트렌드</h2>
          {stats.trend.length === 0 ? (
            <div style={{ color: 'var(--text-2)', fontSize: 13, paddingTop: 20 }}>데이터가 없습니다.</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
              {stats.trend.map((t, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div
                    style={{
                      width: '100%', borderRadius: '4px 4px 0 0',
                      background: 'var(--accent-soft)',
                      height: `${Math.round((t.count / maxTrend) * 90)}px`,
                      minHeight: t.count > 0 ? 4 : 0,
                    }}
                  />
                  <div style={{ fontSize: 10, color: 'var(--text-2)', textAlign: 'center' }}>{t.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
