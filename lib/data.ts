import type { PlateerData } from './types';

export const PLATEER_DATA: PlateerData = {
  ROOMS: [
    { id: 'r1', name: '라벤더', floor: '6F', capacity: 8, features: ['TV', '화이트보드', '창문'], color: 'lavender', zone: '협업' },
    { id: 'r2', name: '민트', floor: '6F', capacity: 12, features: ['화상회의', 'TV'], color: 'mint', zone: '협업' },
    { id: 'r3', name: '피치', floor: '5F', capacity: 4, features: ['모니터', '화이트보드'], color: 'peach', zone: '집중' },
    { id: 'r4', name: '버터', floor: '5F', capacity: 2, features: ['조용함'], color: 'butter', zone: '1on1' },
    { id: 'r5', name: '세이지', floor: '7F', capacity: 20, features: ['프로젝터', '화상회의', '마이크'], color: 'sage', zone: '대회의' },
    { id: 'r6', name: '로즈', floor: '7F', capacity: 6, features: ['화이트보드', '모니터'], color: 'rose', zone: '협업' },
    { id: 'r7', name: '스카이', floor: '5F', capacity: 6, features: ['모니터'], color: 'sky', zone: '집중' },
    { id: 'r8', name: '코랄', floor: '6F', capacity: 4, features: ['TV', '화이트보드'], color: 'coral', zone: '협업' },
    { id: 'r9', name: '라일락', floor: '7F', capacity: 10, features: ['프로젝터', 'TV', '창문'], color: 'lilac', zone: '대회의' },
    { id: 'r10', name: '바닐라', floor: '5F', capacity: 2, features: ['조용함'], color: 'butter', zone: '1on1' },
    { id: 'r11', name: '올리브', floor: '6F', capacity: 6, features: ['화이트보드'], color: 'sage', zone: '협업' },
    { id: 'r12', name: '블러썸', floor: '7F', capacity: 4, features: ['TV'], color: 'rose', zone: '집중' },
  ],
  BOOKINGS: [
    { id: 'b1', roomId: 'r1', start: 11, end: 11.5, title: '스프린트 리뷰', owner: '김지안', mine: true, attendees: ['지안','수진','민수','현우','유나'], tag: 'team' },
    { id: 'b2', roomId: 'r1', start: 13, end: 14, title: 'UX 리뷰', owner: '이수진', mine: false, attendees: ['수진','지안','현우'], tag: 'design' },
    { id: 'b3', roomId: 'r2', start: 9.5, end: 11, title: '전사 주간회의', owner: 'CEO', mine: false, attendees: [], tag: 'company' },
    { id: 'b4', roomId: 'r2', start: 15, end: 16.5, title: '고객 미팅 · BD', owner: '박민호', mine: false, attendees: [], tag: 'external' },
    { id: 'b5', roomId: 'r4', start: 9, end: 9.5, title: '1on1 · 민수', owner: '김지안', mine: true, attendees: ['지안','민수'], tag: '1on1' },
    { id: 'b6', roomId: 'r4', start: 11, end: 11.5, title: '1on1 · 지은', owner: '이수진', mine: false, attendees: [], tag: '1on1' },
    { id: 'b7', roomId: 'r4', start: 16.5, end: 17, title: '1on1 · 수진', owner: '김지안', mine: true, attendees: ['지안','수진'], tag: '1on1' },
    { id: 'b8', roomId: 'r5', start: 10, end: 12, title: '올핸즈 미팅', owner: 'CEO', mine: false, attendees: [], tag: 'company' },
    { id: 'b9', roomId: 'r5', start: 17, end: 18.5, title: '임원 세션', owner: 'CEO', mine: false, attendees: [], tag: 'exec' },
    { id: 'b10', roomId: 'r6', start: 14, end: 15, title: '디자인 크리틱', owner: '김지안', mine: true, attendees: ['지안','수진','현우'], tag: 'design' },
    { id: 'b11', roomId: 'r7', start: 9, end: 9.5, title: '데일리 스탠드업', owner: '박민호', mine: false, attendees: [], tag: 'team' },
    { id: 'b12', roomId: 'r8', start: 13.5, end: 14.5, title: '기획 싱크', owner: '최유나', mine: false, attendees: [], tag: 'product' },
    { id: 'b13', roomId: 'r9', start: 10, end: 12, title: '분기 리뷰', owner: '이수진', mine: false, attendees: [], tag: 'exec' },
    { id: 'b14', roomId: 'r11', start: 15.5, end: 16.5, title: '엔지니어링 싱크', owner: '정현우', mine: false, attendees: [], tag: 'team' },
    { id: 'b15', roomId: 'r12', start: 11, end: 12, title: '마케팅 리뷰', owner: '최유나', mine: false, attendees: [], tag: 'team' },
  ],
  ME: { id: 'u1', name: '김지안', team: '디자인팀', desk: '6F-24' },
  RECURRING: [
    { id: 'rc1', title: '월요일 스탠드업', roomId: 'r1', rrule: 'MON 09:30', duration: 30, nextDate: '2026-04-27' },
    { id: 'rc2', title: '격주 디자인 크리틱', roomId: 'r6', rrule: '격주 TUE 14:00', duration: 60, nextDate: '2026-04-21' },
    { id: 'rc3', title: '월간 리뷰', roomId: 'r5', rrule: '매월 마지막 금요일 15:00', duration: 90, nextDate: '2026-04-24' },
  ],
  MY_UPCOMING: [
    { id: 'b1', date: '오늘', dateLabel: '04.21 TUE', time: '11:00–11:30', title: '스프린트 리뷰', room: '라벤더', floor: '6F', attendees: 5, recurring: false },
    { id: 'b10', date: '오늘', dateLabel: '04.21 TUE', time: '14:00–15:00', title: '디자인 크리틱', room: '로즈', floor: '7F', attendees: 3, recurring: true },
    { id: 'b7', date: '오늘', dateLabel: '04.21 TUE', time: '16:30–17:00', title: '1on1 · 수진', room: '버터', floor: '5F', attendees: 2, recurring: false },
    { id: 'bm1', date: '내일', dateLabel: '04.22 WED', time: '10:00–11:00', title: '제품 기획 워크샵', room: '민트', floor: '6F', attendees: 8, recurring: false },
    { id: 'bm2', date: '내일', dateLabel: '04.22 WED', time: '15:00–15:30', title: '1on1 · 민수', room: '버터', floor: '5F', attendees: 2, recurring: true },
    { id: 'bm3', date: '목', dateLabel: '04.23 THU', time: '13:00–14:30', title: '분기 OKR 리뷰', room: '세이지', floor: '7F', attendees: 12, recurring: false },
    { id: 'bm4', date: '금', dateLabel: '04.24 FRI', time: '09:30–10:00', title: '위클리 싱크', room: '라벤더', floor: '6F', attendees: 4, recurring: true },
  ],
};

export const NOW_HOUR = 10.7;
export const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
export const HOUR_START = 9;
export const HOUR_END = 20;

export function formatH(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function roomBg(color: string): string {
  const map: Record<string, string> = {
    lavender: 'var(--lavender)', mint: 'var(--mint)', peach: 'var(--peach)',
    butter: 'var(--butter)', sage: 'var(--sage)', rose: 'var(--rose)',
    sky: 'var(--sky)', coral: 'var(--coral)', lilac: 'var(--lilac)',
  };
  return map[color] ?? 'var(--lavender)';
}

export function roomThumb(color: string): string {
  const c1 = roomBg(color);
  const c2Map: Record<string, string> = {
    lavender: 'var(--rose)', mint: 'var(--sage)', peach: 'var(--coral)',
    butter: 'var(--peach)', sage: 'var(--mint)', rose: 'var(--lilac)',
    sky: 'var(--mint)', coral: 'var(--peach)', lilac: 'var(--lavender)',
  };
  const c2 = c2Map[color] ?? 'var(--rose)';
  return `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;
}

export function featIcon(f: string): string {
  const map: Record<string, string> = {
    'TV': 'tv', '화이트보드': 'board', '모니터': 'monitor', '화상회의': 'video',
    '마이크': 'mic', '프로젝터': 'projector', '창문': 'window', '조용함': 'quiet',
  };
  return map[f] ?? 'dot';
}
