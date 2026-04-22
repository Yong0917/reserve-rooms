'use client';

import Recurring from '@/components/Recurring';
import { useAppContext } from '@/lib/context/AppContext';

export default function RecurringPage() {
  const { data, openNewBooking, handleDeleteRecurring, setModalEditRecurring } = useAppContext();

  return (
    <div className="animate-fadeIn">
      <Recurring
        data={data}
        openNewBooking={openNewBooking}
        onEditRecurring={(r) => setModalEditRecurring(r)}
        onDeleteRecurring={handleDeleteRecurring}
      />
    </div>
  );
}
