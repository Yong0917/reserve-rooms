export interface Room {
  id: string;
  name: string;
  floor: string;
  capacity: number;
  features: string[];
  color: RoomColor;
  zone: string;
}

export type RoomColor =
  | 'lavender' | 'mint' | 'peach' | 'butter'
  | 'sage' | 'rose' | 'sky' | 'coral' | 'lilac';

export type BookingTag = 'team' | 'design' | 'company' | 'external' | '1on1' | 'exec' | 'product';

export interface Booking {
  id: string;
  roomId: string;
  start: number; // hour float e.g. 9.5 = 09:30
  end: number;
  title: string;
  owner: string;
  mine: boolean;
  attendees: string[];
  tag: BookingTag;
  recurringId?: string;
  startAt?: string; // ISO timestamp, edit 모드에서 사용
}

export interface RecurringBooking {
  id: string;
  title: string;
  roomId: string;
  rrule: string;
  duration: number;
  nextDate: string;
}

export interface UpcomingBooking {
  id: string;
  date: string;
  dateLabel: string;
  time: string;
  title: string;
  room: string;
  floor: string;
  attendees: number;
  recurring: boolean;
}

export type UserRole = 'employee' | 'admin';

export interface User {
  id: string;
  name: string;
  team: string;
  desk: string;
  role?: UserRole;
}

export interface AdminRoom extends Room {
  is_active: boolean;
  image_url: string | null;
}

export interface AdminBooking {
  id: string;
  roomId: string;
  roomName: string;
  title: string;
  ownerName: string;
  startAt: string;
  endAt: string;
  status: 'active' | 'cancelled';
  tag: BookingTag;
  attendeesCount: number;
  recurringId: string | null;
}

export interface AdminUser {
  id: string;
  name: string;
  team: string;
  desk: string;
  role: UserRole;
}

export interface AdminStats {
  totalBookings: number;
  avgUtilization: number;
  cancellationRate: number;
  topRoom: { name: string; count: number } | null;
  byRoom: Array<{ roomId: string; name: string; bookings: number; utilization: number }>;
  trend: Array<{ label: string; count: number }>;
}

export interface PlateerData {
  ROOMS: Room[];
  BOOKINGS: Booking[];
  ME: User;
  RECURRING: RecurringBooking[];
  MY_UPCOMING: UpcomingBooking[];
}

