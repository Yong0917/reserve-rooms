'use client';

import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { PLATEER_DATA } from '@/lib/data';
import { createClient } from '@/lib/supabase/client';
import {
  fetchRooms,
  fetchUserProfile,
  fetchBookingsByDate,
  fetchMyUpcoming,
  fetchRecurring,
  fetchMyPast,
  fetchMyCancelled,
  fetchUserFavorites,
} from '@/lib/supabase/queries';
import { addFavorite, removeFavorite } from '@/lib/supabase/mutations';
import type {
  Room, Booking, User, RecurringBooking, UpcomingBooking, PlateerData, BookingTag,
} from '@/lib/types';

interface Filters {
  floor: string;
  minCap: number | null;
  feature: string | null;
}

const ACCENT_HUES = {
  lavender: { accent: '#8b7dd8', soft: '#eee7ff', ink: '#4a3d8a' },
  mint: { accent: '#5fb59a', soft: '#e6f4ee', ink: '#2f6b56' },
  peach: { accent: '#e89364', soft: '#fde8dc', ink: '#8a4a28' },
  rose: { accent: '#d6738f', soft: '#fce7ee', ink: '#8a3654' },
  sky: { accent: '#6a9ad0', soft: '#e3edf9', ink: '#335682' },
} as const;

type AccentHue = keyof typeof ACCENT_HUES;
type CancelScope = 'this' | 'future' | 'all';

interface AppContextValue {
  data: PlateerData;
  isLoading: boolean;
  currentUserId: string;
  pastBookings: UpcomingBooking[];
  cancelledBookings: UpcomingBooking[];
  pastHasMore: boolean;
  cancelledHasMore: boolean;
  pastPage: number;
  cancelledPage: number;
  setPastPage: (p: number) => void;
  setCancelledPage: (p: number) => void;
  favorites: string[];
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  viewType: 'timeline' | 'grid';
  setViewType: (v: 'timeline' | 'grid') => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  accentHue: AccentHue;
  setAccentHue: (v: AccentHue) => void;
  ACCENT_HUES: typeof ACCENT_HUES;
  modalNew: { room?: Room; hour?: number; durationMinutes?: number } | null;
  modalDetail: Booking | null;
  modalEdit: Booking | null;
  openNewBooking: (ctx?: { room?: Room; hour?: number; durationMinutes?: number }) => void;
  openBookingDetail: (b: Booking) => void;
  setModalNew: (v: { room?: Room; hour?: number; durationMinutes?: number } | null) => void;
  setModalDetail: (v: Booking | null) => void;
  setModalEdit: (v: Booking | null) => void;
  toast: string | null;
  showToast: (msg: string) => void;
  handleCreate: (booking: {
    title: string; roomId: string; date: string; start: number; end: number; attendees: string[]; rrule: string; tag?: string;
  }) => Promise<void>;
  handleUpdate: (booking: {
    title: string; roomId: string; date: string; start: number; end: number; attendees: string[]; tag: BookingTag;
  }) => Promise<void>;
  handleCancelBooking: (bookingId: string, recurringId?: string, scope?: CancelScope) => Promise<void>;
  handleDeleteRecurring: (recurringId: string) => Promise<void>;
  handleUpdateRecurring: (id: string, data: { title: string }) => Promise<void>;
  handleToggleFavorite: (roomId: string) => Promise<void>;
  modalEditRecurring: RecurringBooking | null;
  setModalEditRecurring: (v: RecurringBooking | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [myUpcoming, setMyUpcoming] = useState<UpcomingBooking[]>([]);
  const [pastBookings, setPastBookings] = useState<UpcomingBooking[]>([]);
  const [cancelledBookings, setCancelledBookings] = useState<UpcomingBooking[]>([]);
  const [recurring, setRecurring] = useState<RecurringBooking[]>([]);
  const [me, setMe] = useState<User>(PLATEER_DATA.ME);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [modalNew, setModalNew] = useState<{ room?: Room; hour?: number; durationMinutes?: number } | null>(null);
  const [modalDetail, setModalDetail] = useState<Booking | null>(null);
  const [modalEdit, setModalEdit] = useState<Booking | null>(null);
  const [modalEditRecurring, setModalEditRecurring] = useState<RecurringBooking | null>(null);
  const [filters, setFilters] = useState<Filters>({ floor: 'all', minCap: null, feature: null });
  const [viewType, setViewType] = useState<'timeline' | 'grid'>('timeline');
  const [toast, setToast] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('darkMode') === 'true';
  });
  const [accentHue, setAccentHue] = useState<AccentHue>(() => {
    if (typeof window === 'undefined') return 'lavender';
    return (localStorage.getItem('accentHue') as AccentHue) || 'lavender';
  });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [pastPage, setPastPage] = useState(0);
  const [cancelledPage, setCancelledPage] = useState(0);
  const [pastHasMore, setPastHasMore] = useState(false);
  const [cancelledHasMore, setCancelledHasMore] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }
      setCurrentUserId(user.id);
      const [roomsData, profileData, recurringData, pastResult, cancelledResult, favData] = await Promise.all([
        fetchRooms(supabase),
        fetchUserProfile(supabase, user.id),
        fetchRecurring(supabase, user.id),
        fetchMyPast(supabase, user.id, 0),
        fetchMyCancelled(supabase, user.id, 0),
        fetchUserFavorites(supabase, user.id),
      ]);
      if (roomsData.length) setRooms(roomsData);
      if (profileData) setMe(profileData);
      if (recurringData.length) setRecurring(recurringData);
      setPastBookings(pastResult.items);
      setPastHasMore(pastResult.hasMore);
      setCancelledBookings(cancelledResult.items);
      setCancelledHasMore(cancelledResult.hasMore);
      setFavorites(favData);
      setIsLoading(false);
    }
    init();
  }, [supabase]);

  useEffect(() => {
    if (!currentUserId) return;
    fetchBookingsByDate(supabase, selectedDate, currentUserId).then((b) => setBookings(b));
    fetchMyUpcoming(supabase, currentUserId).then((u) => setMyUpcoming(u));
  }, [supabase, selectedDate, currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    fetchMyPast(supabase, currentUserId, pastPage).then(({ items, hasMore }) => {
      setPastBookings(items);
      setPastHasMore(hasMore);
    });
  }, [supabase, currentUserId, pastPage]);

  useEffect(() => {
    if (!currentUserId) return;
    fetchMyCancelled(supabase, currentUserId, cancelledPage).then(({ items, hasMore }) => {
      setCancelledBookings(items);
      setCancelledHasMore(hasMore);
    });
  }, [supabase, currentUserId, cancelledPage]);

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('accentHue', accentHue);
  }, [accentHue]);

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const h = ACCENT_HUES[accentHue];
    document.documentElement.style.setProperty('--accent', h.accent);
    document.documentElement.style.setProperty('--accent-soft', h.soft);
    document.documentElement.style.setProperty('--accent-ink', h.ink);
  }, [accentHue]);

  const refetchRef = useRef<() => void>(() => {});
  useEffect(() => {
    refetchRef.current = () => {
      if (!currentUserId) return;
      fetchBookingsByDate(supabase, selectedDate, currentUserId).then((b) => setBookings(b));
      fetchMyUpcoming(supabase, currentUserId).then((u) => setMyUpcoming(u));
      fetchMyPast(supabase, currentUserId, pastPage).then(({ items, hasMore }) => {
        setPastBookings(items);
        setPastHasMore(hasMore);
      });
      fetchMyCancelled(supabase, currentUserId, cancelledPage).then(({ items, hasMore }) => {
        setCancelledBookings(items);
        setCancelledHasMore(hasMore);
      });
    };
  });

  useEffect(() => {
    const channel = supabase
      .channel('bookings-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        refetchRef.current();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const data: PlateerData = { ROOMS: rooms, BOOKINGS: bookings, ME: me, RECURRING: recurring, MY_UPCOMING: myUpcoming };

  const openNewBooking = (ctx?: { room?: Room; hour?: number; durationMinutes?: number }) => setModalNew(ctx ?? {});
  const openBookingDetail = (b: Booking) => setModalDetail(b);

  const handleToggleFavorite = async (roomId: string) => {
    const isFav = favorites.includes(roomId);
    setFavorites(isFav ? favorites.filter((id) => id !== roomId) : [...favorites, roomId]);
    if (isFav) {
      await removeFavorite(supabase, currentUserId, roomId);
    } else {
      await addFavorite(supabase, currentUserId, roomId);
    }
  };

  const handleCreate = async (booking: {
    title: string; roomId: string; date: string; start: number; end: number; attendees: string[]; rrule: string; tag?: string;
  }) => {
    setModalNew(null);
    const isRecurring = booking.rrule && booking.rrule !== 'none';
    const endpoint = isRecurring ? '/api/recurring' : '/api/bookings';
    const body = isRecurring
      ? { title: booking.title, roomId: booking.roomId, date: booking.date, startH: booking.start, duration: Math.round((booking.end - booking.start) * 60), rrule: booking.rrule, tag: booking.tag }
      : { title: booking.title, roomId: booking.roomId, date: booking.date, startH: booking.start, endH: booking.end, attendees: booking.attendees, rrule: 'none', tag: booking.tag };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json() as { error?: string };
      showToast(`예약 실패: ${err.error ?? '알 수 없는 오류'}`);
      return;
    }

    const room = rooms.find((r) => r.id === booking.roomId);
    showToast(`"${booking.title}" · ${room?.name ?? ''} 예약 완료`);
    if (isRecurring) {
      fetchRecurring(supabase, currentUserId).then(setRecurring);
    }
  };

  const handleUpdate = async (booking: {
    title: string; roomId: string; date: string; start: number; end: number; attendees: string[]; tag: BookingTag;
  }) => {
    if (!modalEdit) return;
    setModalEdit(null);
    setModalDetail(null);

    const res = await fetch(`/api/bookings/${modalEdit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: booking.title, roomId: booking.roomId, date: booking.date, startH: booking.start, endH: booking.end, attendees: booking.attendees, tag: booking.tag }),
    });

    if (!res.ok) {
      const err = await res.json() as { error?: string };
      showToast(`수정 실패: ${err.error ?? '알 수 없는 오류'}`);
      return;
    }
    showToast('예약이 수정되었습니다');
    fetchBookingsByDate(supabase, selectedDate, currentUserId).then((b) => setBookings(b));
    fetchMyUpcoming(supabase, currentUserId).then((u) => setMyUpcoming(u));
  };

  const handleUpdateRecurring = async (id: string, data: { title: string }) => {
    const res = await fetch(`/api/recurring/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      showToast(`수정 실패: ${err.error ?? '알 수 없는 오류'}`);
      return;
    }
    showToast('반복 예약이 수정되었습니다');
    setModalEditRecurring(null);
    fetchRecurring(supabase, currentUserId).then(setRecurring);
  };

  const handleCancelBooking = async (
    bookingId: string,
    recurringId?: string,
    scope: CancelScope = 'this',
  ) => {
    setModalDetail(null);
    const params = new URLSearchParams({ scope });
    if (recurringId) params.set('recurringId', recurringId);
    if (scope === 'future') {
      const b = bookings.find((x) => x.id === bookingId);
      if (b?.startAt) params.set('fromDate', b.startAt.split('T')[0]);
    }

    const res = await fetch(`/api/bookings/${bookingId}?${params.toString()}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      showToast(`취소 실패: ${err.error ?? '알 수 없는 오류'}`);
      return;
    }
    showToast('예약이 취소되었습니다');
    if (recurringId && (scope === 'future' || scope === 'all')) {
      fetchRecurring(supabase, currentUserId).then(setRecurring);
    }
  };

  const handleDeleteRecurring = async (recurringId: string) => {
    const res = await fetch(`/api/recurring/${recurringId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      showToast(`삭제 실패: ${err.error ?? '알 수 없는 오류'}`);
      return;
    }
    showToast('반복 예약이 삭제되었습니다');
    fetchRecurring(supabase, currentUserId).then(setRecurring);
  };

  return (
    <AppContext.Provider value={{
      data,
      isLoading,
      currentUserId,
      pastBookings,
      cancelledBookings,
      pastHasMore,
      cancelledHasMore,
      pastPage,
      cancelledPage,
      setPastPage,
      setCancelledPage,
      favorites,
      selectedDate,
      setSelectedDate,
      filters,
      setFilters,
      viewType,
      setViewType,
      darkMode,
      setDarkMode,
      accentHue,
      setAccentHue,
      ACCENT_HUES,
      modalNew,
      modalDetail,
      modalEdit,
      openNewBooking,
      openBookingDetail,
      setModalNew,
      setModalDetail,
      setModalEdit,
      toast,
      showToast,
      handleCreate,
      handleUpdate,
      handleCancelBooking,
      handleDeleteRecurring,
      handleUpdateRecurring,
      handleToggleFavorite,
      modalEditRecurring,
      setModalEditRecurring,
    }}>
      {children}
    </AppContext.Provider>
  );
}
