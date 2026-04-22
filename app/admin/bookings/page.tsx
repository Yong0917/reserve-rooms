import { createClient } from '@/lib/supabase/server';
import { fetchAllBookingsAdmin, fetchAllRoomsAdmin } from '@/lib/supabase/queries';
import BookingsClient from './BookingsClient';

interface PageProps {
  searchParams: Promise<{ page?: string; roomId?: string; status?: string; from?: string; to?: string; search?: string }>;
}

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = parseInt(sp.page ?? '0');
  const roomId = sp.roomId ?? undefined;
  const status = (sp.status as 'active' | 'cancelled' | 'all') ?? 'all';
  const from = sp.from ?? undefined;
  const to = sp.to ?? undefined;
  const search = sp.search ?? undefined;

  const supabase = await createClient();
  const [{ items, hasMore }, rooms] = await Promise.all([
    fetchAllBookingsAdmin(supabase, { page, roomId, status, from, to, search }),
    fetchAllRoomsAdmin(supabase),
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>예약 관리</h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)' }}>전체 예약 조회 및 강제 취소</p>
      </div>
      <BookingsClient
        initialItems={items}
        hasMore={hasMore}
        rooms={rooms}
        initialFilters={{ page, roomId: roomId ?? '', status, from: from ?? '', to: to ?? '', search: search ?? '' }}
      />
    </div>
  );
}
