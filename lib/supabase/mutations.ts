import type { SupabaseClient } from '@supabase/supabase-js';
import type { RoomColor, UserRole, BookingTag } from '@/lib/types';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// YYYY-MM-DD 문자열 + float hour → UTC ISO timestamp
function floatHourToISO(dateStr: string, h: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const totalMins = Math.round(h * 60);
  const hh = Math.floor(totalMins / 60);
  const mm = totalMins % 60;
  // KST midnight → UTC: subtract 9h
  const kstMs = Date.UTC(y, m - 1, d, hh, mm, 0, 0);
  return new Date(kstMs - KST_OFFSET_MS).toISOString();
}

export interface CreateBookingInput {
  title: string;
  roomId: string;
  date: string;       // YYYY-MM-DD
  startH: number;
  endH: number;
  attendees: string[]; // user names — will be resolved to IDs
  userId: string;
  recurringId?: string;
  tag?: BookingTag;
}

export async function createBooking(
  client: SupabaseClient,
  input: CreateBookingInput,
): Promise<{ id: string } | { error: string }> {
  const startAt = floatHourToISO(input.date, input.startH);
  const endAt = floatHourToISO(input.date, input.endH);

  const { data, error } = await client
    .from('bookings')
    .insert({
      room_id: input.roomId,
      user_id: input.userId,
      title: input.title,
      start_at: startAt,
      end_at: endAt,
      status: 'active',
      recurring_id: input.recurringId ?? null,
      tag: input.tag ?? null,
    })
    .select('id')
    .single();

  if (error || !data) {
    if (error?.code === '23P01') return { error: '해당 시간대에 이미 예약이 있습니다' };
    return { error: error?.message ?? '예약 생성 실패' };
  }

  // booking_attendees — 이름으로 user id 조회 후 삽입
  if (input.attendees.length > 0) {
    const { data: users } = await client
      .from('users')
      .select('id, name')
      .in('name', input.attendees);

    if (users && users.length > 0) {
      const rows = (users as { id: string }[]).map((u) => ({
        booking_id: (data as { id: string }).id,
        user_id: u.id,
      }));
      await client.from('booking_attendees').insert(rows);
    }
  }

  return { id: (data as { id: string }).id };
}

export interface UpdateBookingInput {
  title: string;
  roomId: string;
  date: string;
  startH: number;
  endH: number;
  attendees: string[];
  tag?: BookingTag;
}

export async function updateBooking(
  client: SupabaseClient,
  bookingId: string,
  input: UpdateBookingInput,
): Promise<{ error?: string }> {
  const startAt = floatHourToISO(input.date, input.startH);
  const endAt = floatHourToISO(input.date, input.endH);

  const { error } = await client
    .from('bookings')
    .update({
      room_id: input.roomId,
      title: input.title,
      start_at: startAt,
      end_at: endAt,
      ...(input.tag !== undefined && { tag: input.tag }),
    })
    .eq('id', bookingId);

  if (error) {
    if (error.code === '23P01') return { error: '해당 시간대에 이미 예약이 있습니다' };
    return { error: error.message };
  }

  // 참석자 재설정
  await client.from('booking_attendees').delete().eq('booking_id', bookingId);
  if (input.attendees.length > 0) {
    const { data: users } = await client
      .from('users')
      .select('id, name')
      .in('name', input.attendees);
    if (users && users.length > 0) {
      const rows = (users as { id: string }[]).map((u) => ({
        booking_id: bookingId,
        user_id: u.id,
      }));
      await client.from('booking_attendees').insert(rows);
    }
  }

  return {};
}

export async function cancelBooking(
  client: SupabaseClient,
  bookingId: string,
): Promise<{ error?: string }> {
  const { error } = await client
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);
  return error ? { error: error.message } : {};
}

export interface CreateRecurringInput {
  title: string;
  roomId: string;
  startH: number;
  duration: number; // minutes
  rruleStr: string; // rrule.js가 생성한 RRULE 문자열
  userId: string;
  dates: string[]; // 1년치 날짜 YYYY-MM-DD 배열 (API route에서 rrule.js로 생성)
}

export async function createRecurringBooking(
  client: SupabaseClient,
  input: CreateRecurringInput,
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await client
    .from('recurring_bookings')
    .insert({
      user_id: input.userId,
      room_id: input.roomId,
      title: input.title,
      rrule: input.rruleStr,
      duration: input.duration,
      is_active: true,
    })
    .select('id')
    .single();

  if (error || !data) return { error: error?.message ?? '반복 예약 생성 실패' };

  const recurringId = (data as { id: string }).id;
  const endH = input.startH + input.duration / 60;

  const bookingRows = input.dates.map((dateStr) => ({
    room_id: input.roomId,
    user_id: input.userId,
    title: input.title,
    start_at: floatHourToISO(dateStr, input.startH),
    end_at: floatHourToISO(dateStr, endH),
    status: 'active',
    recurring_id: recurringId,
  }));

  if (bookingRows.length > 0) {
    const { error: batchError } = await client.from('bookings').insert(bookingRows);
    if (batchError) {
      if (batchError.code === '23P01') return { error: '해당 시간대에 이미 예약이 있는 날짜가 포함되어 있습니다' };
      return { error: batchError.message };
    }
  }

  return { id: recurringId };
}

export async function addFavorite(
  client: SupabaseClient,
  userId: string,
  roomId: string,
): Promise<{ error?: string }> {
  const { error } = await client
    .from('user_favorites')
    .insert({ user_id: userId, room_id: roomId });
  return error ? { error: error.message } : {};
}

export async function removeFavorite(
  client: SupabaseClient,
  userId: string,
  roomId: string,
): Promise<{ error?: string }> {
  const { error } = await client
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('room_id', roomId);
  return error ? { error: error.message } : {};
}

// ─── Admin 전용 뮤테이션 ──────────────────────────────────────────────────────

export interface CreateRoomInput {
  name: string;
  floor: string;
  zone: string;
  capacity: number;
  features: string[];
  color: RoomColor;
  is_active: boolean;
  image_url?: string | null;
}

export async function createRoom(
  client: SupabaseClient,
  input: CreateRoomInput,
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await client
    .from('rooms')
    .insert({
      name: input.name,
      floor: input.floor,
      zone: input.zone,
      capacity: input.capacity,
      features: input.features,
      color: input.color,
      is_active: input.is_active,
      image_url: input.image_url ?? null,
    })
    .select('id')
    .single();
  if (error || !data) return { error: error?.message ?? '회의실 생성 실패' };
  return { id: (data as { id: string }).id };
}

export async function updateRoom(
  client: SupabaseClient,
  roomId: string,
  input: Partial<CreateRoomInput>,
): Promise<{ error?: string }> {
  const { error } = await client
    .from('rooms')
    .update(input)
    .eq('id', roomId);
  return error ? { error: error.message } : {};
}

export async function deactivateRoom(
  client: SupabaseClient,
  roomId: string,
): Promise<{ error?: string }> {
  const { error } = await client
    .from('rooms')
    .update({ is_active: false })
    .eq('id', roomId);
  return error ? { error: error.message } : {};
}

export async function updateUserRole(
  client: SupabaseClient,
  userId: string,
  role: UserRole,
): Promise<{ error?: string }> {
  const { error } = await client
    .from('users')
    .update({ role })
    .eq('id', userId);
  return error ? { error: error.message } : {};
}

export async function updateRecurringBooking(
  client: SupabaseClient,
  recurringId: string,
  input: { title: string },
): Promise<{ error?: string }> {
  const { error: rbError } = await client
    .from('recurring_bookings')
    .update({ title: input.title })
    .eq('id', recurringId);
  if (rbError) return { error: rbError.message };

  const now = new Date().toISOString();
  const { error: bError } = await client
    .from('bookings')
    .update({ title: input.title })
    .eq('recurring_id', recurringId)
    .eq('status', 'active')
    .gte('start_at', now);
  if (bError) return { error: bError.message };

  return {};
}

export type RecurringCancelScope = 'this' | 'future' | 'all';

export async function cancelRecurringBooking(
  client: SupabaseClient,
  recurringId: string,
  scope: RecurringCancelScope,
  fromDate?: string, // YYYY-MM-DD, 'this' | 'future' 에서 필요
  bookingId?: string, // 'this' 에서 단건 취소
): Promise<{ error?: string }> {
  if (scope === 'this' && bookingId) {
    return cancelBooking(client, bookingId);
  }

  if (scope === 'future' && fromDate) {
    const fromISO = floatHourToISO(fromDate, 0);
    const { error } = await client
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('recurring_id', recurringId)
      .eq('status', 'active')
      .gte('start_at', fromISO);
    if (error) return { error: error.message };
    return {};
  }

  // 'all' — recurring_bookings 비활성화 + 모든 하위 bookings 취소
  const { error: rbError } = await client
    .from('recurring_bookings')
    .update({ is_active: false })
    .eq('id', recurringId);
  if (rbError) return { error: rbError.message };

  const { error: bError } = await client
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('recurring_id', recurringId)
    .eq('status', 'active');
  if (bError) return { error: bError.message };

  return {};
}
