import type { SupabaseClient } from '@supabase/supabase-js';
import type { Room, Booking, User, RecurringBooking, UpcomingBooking, AdminRoom, AdminBooking, AdminUser, AdminStats } from '@/lib/types';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function tsToFloatHour(ts: string): number {
  const d = new Date(ts);
  return d.getUTCHours() + 9 + d.getUTCMinutes() / 60;
}

function fmtHour(h: number): string {
  return `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
}

function getKSTDayRange(date: Date): { start: string; end: string } {
  const kstMs = date.getTime() + KST_OFFSET_MS;
  const kstDateStr = new Date(kstMs).toISOString().split('T')[0];
  const dayStartMs = new Date(`${kstDateStr}T00:00:00.000Z`).getTime() - KST_OFFSET_MS;
  return {
    start: new Date(dayStartMs).toISOString(),
    end: new Date(dayStartMs + 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function getKSTDateStr(date: Date): string {
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().split('T')[0];
}

export function isSameKSTDay(a: Date, b: Date): boolean {
  return getKSTDateStr(a) === getKSTDateStr(b);
}

const WEEKDAYS_SHORT = ['일', '월', '화', '수', '목', '금', '토'];
const WEEKDAYS_FULL = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

export function formatKSTDate(date: Date): string {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return `${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일 ${WEEKDAYS_FULL[kst.getUTCDay()]}`;
}

function getDateLabel(startAt: string): { date: string; dateLabel: string } {
  const now = new Date();
  const bookingDate = getKSTDateStr(new Date(startAt));
  const kst = new Date(new Date(startAt).getTime() + KST_OFFSET_MS);
  const dayOfWeek = WEEKDAYS_SHORT[kst.getUTCDay()];
  const mm = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kst.getUTCDate()).padStart(2, '0');

  let date: string;
  if (bookingDate === getKSTDateStr(now)) date = '오늘';
  else if (bookingDate === getKSTDateStr(new Date(now.getTime() + 86400000))) date = '내일';
  else date = dayOfWeek;

  return { date, dateLabel: `${mm}.${dd} ${dayOfWeek}` };
}

export async function fetchRooms(client: SupabaseClient): Promise<Room[]> {
  const { data, error } = await client
    .from('rooms')
    .select('id, name, floor, capacity, features, color, zone')
    .eq('is_active', true)
    .order('floor')
    .order('name');
  if (error || !data) return [];
  return (data as {
    id: string; name: string; floor: string; capacity: number;
    features: string[]; color: Room['color']; zone: string;
  }[]).map((r) => ({
    id: r.id,
    name: r.name,
    floor: r.floor,
    capacity: r.capacity,
    features: r.features ?? [],
    color: r.color,
    zone: r.zone,
  }));
}

export async function fetchUserProfile(client: SupabaseClient, authUserId: string): Promise<User | null> {
  const { data, error } = await client
    .from('users')
    .select('id, name, team, desk')
    .eq('id', authUserId)
    .single();
  if (error || !data) return null;
  const row = data as { id: string; name: string; team: string | null; desk: string | null };
  return { id: row.id, name: row.name, team: row.team ?? '', desk: row.desk ?? '' };
}

export async function fetchBookingsByDate(
  client: SupabaseClient,
  date: Date,
  currentUserId: string,
): Promise<Booking[]> {
  const { start, end } = getKSTDayRange(date);
  const { data, error } = await client
    .from('bookings')
    .select(`
      id, room_id, title, start_at, end_at, tag, user_id, recurring_id,
      users!bookings_user_id_fkey (name),
      booking_attendees (
        users!booking_attendees_user_id_fkey (name)
      )
    `)
    .gte('start_at', start)
    .lt('start_at', end)
    .eq('status', 'active');
  if (error || !data) return [];

  type BookingRow = {
    id: string; room_id: string; title: string; start_at: string; end_at: string;
    tag: string; user_id: string; recurring_id: string | null;
    users: { name: string } | null;
    booking_attendees: { users: { name: string } | null }[];
  };
  return (data as unknown as BookingRow[]).map((b) => ({
    id: b.id,
    roomId: b.room_id,
    start: tsToFloatHour(b.start_at),
    end: tsToFloatHour(b.end_at),
    title: b.title,
    owner: b.users?.name ?? '',
    mine: b.user_id === currentUserId,
    attendees: (b.booking_attendees ?? []).map((a) => a.users?.name ?? '').filter(Boolean),
    tag: b.tag as Booking['tag'],
    recurringId: b.recurring_id ?? undefined,
    startAt: b.start_at,
  }));
}

export async function fetchMyUpcoming(
  client: SupabaseClient,
  userId: string,
): Promise<UpcomingBooking[]> {
  const now = new Date().toISOString();
  const sevenDaysLater = new Date(Date.now() + 7 * 86400000).toISOString();
  const { data, error } = await client
    .from('bookings')
    .select(`
      id, title, start_at, end_at, recurring_id,
      rooms!bookings_room_id_fkey (name, floor),
      booking_attendees (user_id)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('start_at', now)
    .lte('start_at', sevenDaysLater)
    .order('start_at')
    .limit(10);
  if (error || !data) return [];

  type UpcomingRow = {
    id: string; title: string; start_at: string; end_at: string; recurring_id: string | null;
    rooms: { name: string; floor: string } | null;
    booking_attendees: { user_id: string }[];
  };
  return (data as unknown as UpcomingRow[]).map((b) => {
    const start = tsToFloatHour(b.start_at);
    const end = tsToFloatHour(b.end_at);
    const { date, dateLabel } = getDateLabel(b.start_at);
    return {
      id: b.id,
      date,
      dateLabel,
      time: `${fmtHour(start)}–${fmtHour(end)}`,
      title: b.title,
      room: b.rooms?.name ?? '',
      floor: b.rooms?.floor ?? '',
      attendees: (b.booking_attendees?.length ?? 0) + 1,
      recurring: b.recurring_id !== null,
    };
  });
}

export async function fetchRecurring(
  client: SupabaseClient,
  userId: string,
): Promise<RecurringBooking[]> {
  const { data, error } = await client
    .from('recurring_bookings')
    .select('id, title, room_id, rrule, duration')
    .eq('user_id', userId)
    .eq('is_active', true);
  if (error || !data) return [];

  type RecurringRow = { id: string; title: string; room_id: string; rrule: string; duration: number };
  const results = await Promise.all(
    (data as unknown as RecurringRow[]).map(
      async (r) => {
        const { data: nextData } = await client
          .from('bookings')
          .select('start_at')
          .eq('recurring_id', r.id)
          .eq('status', 'active')
          .gt('start_at', new Date().toISOString())
          .order('start_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        return {
          id: r.id,
          title: r.title,
          roomId: r.room_id,
          rrule: r.rrule,
          duration: r.duration,
          nextDate: nextData ? getKSTDateStr(new Date((nextData as { start_at: string }).start_at)) : '',
        };
      },
    ),
  );
  return results;
}

export interface DayAvailability {
  dateLabel: string;
  dayName: string;
  pct: number;
  level: 'high' | 'mid' | 'low';
}

export async function fetchRoomAvailability(
  client: SupabaseClient,
  roomId: string,
): Promise<DayAvailability[]> {
  const WORK_HOURS = 11; // 9:00–20:00
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => new Date(now.getTime() + i * 86400000));
  const rangeStart = getKSTDayRange(days[0]).start;
  const rangeEnd = getKSTDayRange(days[6]).end;

  const { data } = await client
    .from('bookings')
    .select('start_at, end_at')
    .eq('room_id', roomId)
    .eq('status', 'active')
    .gte('start_at', rangeStart)
    .lt('start_at', rangeEnd);

  return days.map((d) => {
    const { start: dayStart, end: dayEnd } = getKSTDayRange(d);
    const kst = new Date(d.getTime() + KST_OFFSET_MS);
    const dayBookings = (data ?? []).filter(
      (b: { start_at: string }) => b.start_at >= dayStart && b.start_at < dayEnd,
    );
    const bookedHours = dayBookings.reduce(
      (sum: number, b: { start_at: string; end_at: string }) =>
        sum + (tsToFloatHour(b.end_at) - tsToFloatHour(b.start_at)),
      0,
    );
    const pct = Math.max(0, Math.min(100, Math.round((1 - bookedHours / WORK_HOURS) * 100)));
    return {
      dateLabel: String(kst.getUTCDate()),
      dayName: WEEKDAYS_SHORT[kst.getUTCDay()],
      pct,
      level: (pct >= 70 ? 'high' : pct >= 40 ? 'mid' : 'low') as DayAvailability['level'],
    };
  });
}

const PAGE_SIZE = 20;

export async function fetchMyPast(
  client: SupabaseClient,
  userId: string,
  page: number = 0,
): Promise<{ items: UpcomingBooking[]; hasMore: boolean }> {
  const now = new Date().toISOString();
  const { data, error } = await client
    .from('bookings')
    .select(`
      id, title, start_at, end_at, recurring_id,
      rooms!bookings_room_id_fkey (name, floor),
      booking_attendees (user_id)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .lt('start_at', now)
    .order('start_at', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  if (error || !data) return { items: [], hasMore: false };

  type UpcomingRow = {
    id: string; title: string; start_at: string; end_at: string; recurring_id: string | null;
    rooms: { name: string; floor: string } | null;
    booking_attendees: { user_id: string }[];
  };
  const items = (data as unknown as UpcomingRow[]).slice(0, PAGE_SIZE).map((b) => {
    const start = tsToFloatHour(b.start_at);
    const end = tsToFloatHour(b.end_at);
    const { date, dateLabel } = getDateLabel(b.start_at);
    return {
      id: b.id,
      date,
      dateLabel,
      time: `${fmtHour(start)}–${fmtHour(end)}`,
      title: b.title,
      room: b.rooms?.name ?? '',
      floor: b.rooms?.floor ?? '',
      attendees: (b.booking_attendees?.length ?? 0) + 1,
      recurring: b.recurring_id !== null,
    };
  });
  return { items, hasMore: data.length > PAGE_SIZE };
}

export async function fetchMyCancelled(
  client: SupabaseClient,
  userId: string,
  page: number = 0,
): Promise<{ items: UpcomingBooking[]; hasMore: boolean }> {
  const { data, error } = await client
    .from('bookings')
    .select(`
      id, title, start_at, end_at, recurring_id,
      rooms!bookings_room_id_fkey (name, floor),
      booking_attendees (user_id)
    `)
    .eq('user_id', userId)
    .eq('status', 'cancelled')
    .order('start_at', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  if (error || !data) return { items: [], hasMore: false };

  type UpcomingRow = {
    id: string; title: string; start_at: string; end_at: string; recurring_id: string | null;
    rooms: { name: string; floor: string } | null;
    booking_attendees: { user_id: string }[];
  };
  const items = (data as unknown as UpcomingRow[]).slice(0, PAGE_SIZE).map((b) => {
    const start = tsToFloatHour(b.start_at);
    const end = tsToFloatHour(b.end_at);
    const { date, dateLabel } = getDateLabel(b.start_at);
    return {
      id: b.id,
      date,
      dateLabel,
      time: `${fmtHour(start)}–${fmtHour(end)}`,
      title: b.title,
      room: b.rooms?.name ?? '',
      floor: b.rooms?.floor ?? '',
      attendees: (b.booking_attendees?.length ?? 0) + 1,
      recurring: b.recurring_id !== null,
    };
  });
  return { items, hasMore: data.length > PAGE_SIZE };
}

export async function fetchUserFavorites(
  client: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data } = await client
    .from('user_favorites')
    .select('room_id')
    .eq('user_id', userId);
  if (!data) return [];
  return (data as { room_id: string }[]).map((r) => r.room_id);
}

export interface AvailableRoomsFilter {
  startAt: string;
  endAt: string;
  minCapacity: number;
  floors: string[];
  equipment: string[];
  favoritesOnly: boolean;
  favorites: string[];
}

export async function fetchAvailableRooms(
  client: SupabaseClient,
  filter: AvailableRoomsFilter,
): Promise<Room[]> {
  const { data: busyData } = await client
    .from('bookings')
    .select('room_id')
    .eq('status', 'active')
    .lt('start_at', filter.endAt)
    .gt('end_at', filter.startAt);

  const busyRoomIds = new Set(
    (busyData ?? []).map((b: { room_id: string }) => b.room_id),
  );

  let query = client
    .from('rooms')
    .select('id, name, floor, capacity, features, color, zone')
    .eq('is_active', true)
    .gte('capacity', filter.minCapacity)
    .order('floor')
    .order('name');

  if (filter.floors.length > 0) {
    query = query.in('floor', filter.floors);
  }

  const { data } = await query;
  if (!data) return [];

  type RoomRow = {
    id: string; name: string; floor: string; capacity: number;
    features: string[]; color: Room['color']; zone: string;
  };

  let rooms = (data as unknown as RoomRow[])
    .filter((r) => !busyRoomIds.has(r.id))
    .filter((r) =>
      filter.equipment.length === 0 ||
      filter.equipment.every((eq) => (r.features ?? []).includes(eq)),
    )
    .map((r) => ({
      id: r.id,
      name: r.name,
      floor: r.floor,
      capacity: r.capacity,
      features: r.features ?? [],
      color: r.color,
      zone: r.zone,
    }));

  if (filter.favoritesOnly) {
    rooms = rooms.filter((r) => filter.favorites.includes(r.id));
  }

  return rooms;
}

export async function searchGlobal(
  client: SupabaseClient,
  userId: string,
  query: string,
): Promise<{ rooms: Room[]; bookings: Array<{ id: string; title: string; startAt: string; roomName: string }> }> {
  if (!query.trim()) return { rooms: [], bookings: [] };

  const [roomResult, bookingResult] = await Promise.all([
    client
      .from('rooms')
      .select('id, name, floor, capacity, features, color, zone')
      .eq('is_active', true)
      .ilike('name', `%${query}%`)
      .limit(5),
    client
      .from('bookings')
      .select('id, title, start_at, rooms!bookings_room_id_fkey(name)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('start_at', new Date().toISOString())
      .ilike('title', `%${query}%`)
      .order('start_at')
      .limit(5),
  ]);

  type RoomRow = {
    id: string; name: string; floor: string; capacity: number;
    features: string[]; color: Room['color']; zone: string;
  };
  type BookingSearchRow = {
    id: string; title: string; start_at: string;
    rooms: { name: string } | null;
  };

  return {
    rooms: ((roomResult.data ?? []) as unknown as RoomRow[]).map((r) => ({
      id: r.id, name: r.name, floor: r.floor, capacity: r.capacity,
      features: r.features ?? [], color: r.color, zone: r.zone,
    })),
    bookings: ((bookingResult.data ?? []) as unknown as BookingSearchRow[]).map((b) => ({
      id: b.id, title: b.title, startAt: b.start_at, roomName: b.rooms?.name ?? '',
    })),
  };
}

// ─── Admin 전용 쿼리 ───────────────────────────────────────────────────────

export async function fetchAllRoomsAdmin(client: SupabaseClient): Promise<AdminRoom[]> {
  const { data, error } = await client
    .from('rooms')
    .select('id, name, floor, capacity, features, color, zone, is_active, image_url')
    .order('floor')
    .order('name');
  if (error || !data) return [];
  type RoomAdminRow = {
    id: string; name: string; floor: string; capacity: number;
    features: string[]; color: Room['color']; zone: string;
    is_active: boolean; image_url: string | null;
  };
  return (data as unknown as RoomAdminRow[]).map((r) => ({
    id: r.id, name: r.name, floor: r.floor, capacity: r.capacity,
    features: r.features ?? [], color: r.color, zone: r.zone,
    is_active: r.is_active, image_url: r.image_url,
  }));
}

const ADMIN_BOOKING_PAGE_SIZE = 30;

export async function fetchAllBookingsAdmin(
  client: SupabaseClient,
  options: {
    page?: number;
    roomId?: string;
    status?: 'active' | 'cancelled' | 'all';
    from?: string;
    to?: string;
    search?: string;
  } = {},
): Promise<{ items: AdminBooking[]; hasMore: boolean }> {
  const { page = 0, roomId, status = 'all', from, to, search } = options;

  let query = client
    .from('bookings')
    .select(`
      id, room_id, title, start_at, end_at, status, tag, recurring_id,
      users!bookings_user_id_fkey (name),
      rooms!bookings_room_id_fkey (name),
      booking_attendees (user_id)
    `)
    .order('start_at', { ascending: false })
    .range(page * ADMIN_BOOKING_PAGE_SIZE, page * ADMIN_BOOKING_PAGE_SIZE + ADMIN_BOOKING_PAGE_SIZE);

  if (status !== 'all') query = query.eq('status', status);
  if (roomId) query = query.eq('room_id', roomId);
  if (from) query = query.gte('start_at', from);
  if (to) query = query.lte('start_at', to);
  if (search) query = query.ilike('title', `%${search}%`);

  const { data, error } = await query;
  if (error || !data) return { items: [], hasMore: false };

  type AdminBookingRow = {
    id: string; room_id: string; title: string; start_at: string; end_at: string;
    status: string; tag: string; recurring_id: string | null;
    users: { name: string } | null;
    rooms: { name: string } | null;
    booking_attendees: { user_id: string }[];
  };

  const items = (data as unknown as AdminBookingRow[]).slice(0, ADMIN_BOOKING_PAGE_SIZE).map((b) => ({
    id: b.id,
    roomId: b.room_id,
    roomName: b.rooms?.name ?? '',
    title: b.title,
    ownerName: b.users?.name ?? '',
    startAt: b.start_at,
    endAt: b.end_at,
    status: b.status as AdminBooking['status'],
    tag: b.tag as AdminBooking['tag'],
    attendeesCount: (b.booking_attendees?.length ?? 0) + 1,
    recurringId: b.recurring_id,
  }));

  return { items, hasMore: data.length > ADMIN_BOOKING_PAGE_SIZE };
}

export async function fetchAllUsersAdmin(client: SupabaseClient): Promise<AdminUser[]> {
  const { data, error } = await client
    .from('users')
    .select('id, name, team, desk, role')
    .order('name');
  if (error || !data) return [];
  type UserAdminRow = { id: string; name: string; team: string | null; desk: string | null; role: string };
  return (data as unknown as UserAdminRow[]).map((u) => ({
    id: u.id, name: u.name, team: u.team ?? '', desk: u.desk ?? '',
    role: u.role as AdminUser['role'],
  }));
}

const WORK_HOURS_PER_DAY = 11; // 9:00–20:00

export async function fetchAdminStats(
  client: SupabaseClient,
  period: 'day' | 'week' | 'month',
  referenceDate: string, // YYYY-MM-DD KST
): Promise<AdminStats> {
  const [y, m, d] = referenceDate.split('-').map(Number);
  const refKST = new Date(Date.UTC(y, m - 1, d));

  let startKST: Date, endKST: Date, trendDays: number, trendFmt: (d: Date) => string;
  if (period === 'day') {
    startKST = refKST;
    endKST = new Date(refKST.getTime() + 86400000);
    trendDays = 7;
    trendFmt = (dt) => { const kd = new Date(dt.getTime()); return `${kd.getUTCMonth() + 1}/${kd.getUTCDate()}`; };
  } else if (period === 'week') {
    const dow = refKST.getUTCDay();
    startKST = new Date(refKST.getTime() - dow * 86400000);
    endKST = new Date(startKST.getTime() + 7 * 86400000);
    trendDays = 7;
    trendFmt = (dt) => ['일', '월', '화', '수', '목', '금', '토'][dt.getUTCDay()];
  } else {
    startKST = new Date(Date.UTC(y, m - 1, 1));
    endKST = new Date(Date.UTC(y, m, 1));
    trendDays = new Date(Date.UTC(y, m, 0)).getUTCDate();
    trendFmt = (dt) => String(dt.getUTCDate());
  }

  const KST = 9 * 3600000;
  const startUTC = new Date(startKST.getTime() - KST).toISOString();
  const endUTC = new Date(endKST.getTime() - KST).toISOString();

  const [bookingsRes, roomsRes] = await Promise.all([
    client
      .from('bookings')
      .select('id, room_id, start_at, end_at, status, rooms!bookings_room_id_fkey(name)')
      .gte('start_at', startUTC)
      .lt('start_at', endUTC),
    client.from('rooms').select('id, name').eq('is_active', true),
  ]);

  type BRow = { id: string; room_id: string; start_at: string; end_at: string; status: string; rooms: { name: string } | null };
  type RRow = { id: string; name: string };

  const allBookings = (bookingsRes.data ?? []) as unknown as BRow[];
  const allRooms = (roomsRes.data ?? []) as unknown as RRow[];

  const activeBookings = allBookings.filter((b) => b.status === 'active');
  const totalBookings = activeBookings.length;
  const cancellationRate = allBookings.length > 0
    ? Math.round((allBookings.filter((b) => b.status === 'cancelled').length / allBookings.length) * 100)
    : 0;

  const periodDays = Math.max(1, Math.round((endKST.getTime() - startKST.getTime()) / 86400000));
  const maxHoursPerRoom = WORK_HOURS_PER_DAY * periodDays;

  const roomMap = new Map(allRooms.map((r) => [r.id, { name: r.name, hours: 0, count: 0 }]));
  for (const b of activeBookings) {
    const entry = roomMap.get(b.room_id);
    if (entry) {
      const hrs = (new Date(b.end_at).getTime() - new Date(b.start_at).getTime()) / 3600000;
      entry.hours += hrs;
      entry.count += 1;
    }
  }

  const byRoom = Array.from(roomMap.entries()).map(([roomId, v]) => ({
    roomId,
    name: v.name,
    bookings: v.count,
    utilization: Math.min(100, Math.round((v.hours / maxHoursPerRoom) * 100)),
  })).sort((a, b) => b.bookings - a.bookings);

  const avgUtilization = byRoom.length > 0
    ? Math.round(byRoom.reduce((s, r) => s + r.utilization, 0) / byRoom.length)
    : 0;

  const topRoom = byRoom[0]
    ? { name: byRoom[0].name, count: byRoom[0].bookings }
    : null;

  // 트렌드
  const trend: Array<{ label: string; count: number }> = [];
  for (let i = 0; i < trendDays; i++) {
    const dt = new Date(startKST.getTime() + i * 86400000);
    const dtStart = new Date(dt.getTime() - KST).toISOString();
    const dtEnd = new Date(dt.getTime() + 86400000 - KST).toISOString();
    const count = activeBookings.filter((b) => b.start_at >= dtStart && b.start_at < dtEnd).length;
    trend.push({ label: trendFmt(dt), count });
  }

  return { totalBookings, avgUtilization, cancellationRate, topRoom, byRoom, trend };
}
