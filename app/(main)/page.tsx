'use client';

import { useRouter } from 'next/navigation';
import Dashboard from '@/components/Dashboard';
import { useAppContext } from '@/lib/context/AppContext';

export default function HomePage() {
  const router = useRouter();
  const {
    data, isLoading, filters, setFilters, viewType, setViewType,
    selectedDate, setSelectedDate, openNewBooking, openBookingDetail,
  } = useAppContext();

  if (isLoading) {
    return (
      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ flex: 1, height: 88, borderRadius: 16, background: 'var(--surface-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ height: 52, borderRadius: 12, background: 'var(--surface-2)', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <Dashboard
        data={data}
        onRoomSelect={(roomId) => router.push(`/rooms/${roomId}`)}
        onNavigateMy={() => router.push('/my')}
        onNavigateRecurring={() => router.push('/recurring')}
        openNewBooking={openNewBooking}
        openBookingDetail={openBookingDetail}
        filters={filters}
        setFilters={setFilters}
        viewType={viewType}
        setViewType={setViewType}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
    </div>
  );
}
