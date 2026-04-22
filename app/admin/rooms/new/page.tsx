import RoomForm from '@/components/admin/RoomForm';
import Link from 'next/link';
import Icon from '@/components/Icon';

export default function NewRoomPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Link
          href="/admin/rooms"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-2)', textDecoration: 'none', marginBottom: 12 }}
        >
          <Icon name="chevronL" size={14} /> 목록으로
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>회의실 추가</h1>
      </div>
      <div
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '28px 32px',
        }}
      >
        <RoomForm />
      </div>
    </div>
  );
}
