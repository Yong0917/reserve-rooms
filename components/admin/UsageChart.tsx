interface UsageChartProps {
  data: Array<{ roomId: string; name: string; bookings: number; utilization: number }>;
}

export default function UsageChart({ data }: UsageChartProps) {
  if (data.length === 0) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-2)', fontSize: 13 }}>
        데이터가 없습니다.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((room) => (
        <div key={room.roomId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 140, fontSize: 13, color: 'var(--text)', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {room.name}
          </div>
          <div style={{ flex: 1, height: 8, background: 'var(--surface-2, #f1f5f9)', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${room.utilization}%`,
                background: room.utilization >= 70
                  ? 'var(--accent)'
                  : room.utilization >= 40
                    ? 'var(--accent-soft, #c7d2fe)'
                    : '#e2e8f0',
                borderRadius: 4,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div style={{ width: 36, fontSize: 12, color: 'var(--text-2)', textAlign: 'right', flexShrink: 0 }}>
            {room.utilization}%
          </div>
          <div style={{ width: 32, fontSize: 12, color: 'var(--text-3, var(--text-2))', textAlign: 'right', flexShrink: 0 }}>
            {room.bookings}건
          </div>
        </div>
      ))}
    </div>
  );
}
