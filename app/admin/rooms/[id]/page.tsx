import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { fetchAllRoomsAdmin } from '@/lib/supabase/queries';
import RoomForm from '@/components/admin/RoomForm';
import Icon from '@/components/Icon';

interface PageProps { params: Promise<{ id: string }> }

export default async function EditRoomPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const rooms = await fetchAllRoomsAdmin(supabase);
  const room = rooms.find((r) => r.id === id);
  if (!room) notFound();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Link
          href="/admin/rooms"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-2)', textDecoration: 'none', marginBottom: 12 }}
        >
          <Icon name="chevronL" size={14} /> 목록으로
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>{room.name} 수정</h1>
      </div>
      <div
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '28px 32px',
        }}
      >
        <RoomForm initial={room} />
      </div>
    </div>
  );
}
