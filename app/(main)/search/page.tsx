'use client';

import { useRouter } from 'next/navigation';
import Search from '@/components/Search';
import { useAppContext } from '@/lib/context/AppContext';

export default function SearchPage() {
  const router = useRouter();
  const { data, openNewBooking, favorites } = useAppContext();

  return (
    <div className="animate-fadeIn">
      <Search
        data={data}
        openNewBooking={openNewBooking}
        onRoomSelect={(roomId) => router.push(`/rooms/${roomId}`)}
        favorites={favorites}
      />
    </div>
  );
}
