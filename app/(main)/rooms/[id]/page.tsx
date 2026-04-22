'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import RoomDetail from '@/components/RoomDetail';
import { useAppContext } from '@/lib/context/AppContext';

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, openNewBooking, openBookingDetail, favorites, handleToggleFavorite } = useAppContext();

  const room = data.ROOMS.find((r) => r.id === id);
  if (!room) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-3)' }}>
        회의실을 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <RoomDetail
        room={room}
        data={data}
        onBack={() => router.back()}
        openNewBooking={openNewBooking}
        openBookingDetail={openBookingDetail}
        isFavorite={favorites.includes(room.id)}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}
