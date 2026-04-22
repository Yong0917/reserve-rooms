'use client';

import MyBookings from '@/components/MyBookings';
import { useAppContext } from '@/lib/context/AppContext';

export default function MyPage() {
  const {
    data, pastBookings, cancelledBookings,
    pastHasMore, cancelledHasMore, pastPage, cancelledPage,
    setPastPage, setCancelledPage,
    openBookingDetail, openNewBooking,
    setModalEdit, setModalDetail,
    handleCancelBooking,
  } = useAppContext();

  return (
    <div className="animate-fadeIn">
      <MyBookings
        data={data}
        pastBookings={pastBookings}
        cancelledBookings={cancelledBookings}
        pastHasMore={pastHasMore}
        cancelledHasMore={cancelledHasMore}
        pastPage={pastPage}
        cancelledPage={cancelledPage}
        onPastPageChange={setPastPage}
        onCancelledPageChange={setCancelledPage}
        openBookingDetail={openBookingDetail}
        openNewBooking={openNewBooking}
        onEditBooking={(b) => { setModalEdit(b); setModalDetail(null); }}
        onCancelBooking={(id) => handleCancelBooking(id)}
      />
    </div>
  );
}
