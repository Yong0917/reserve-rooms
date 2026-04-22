# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # 개발 서버 (localhost:3000)
npm run build     # 프로덕션 빌드
npm run lint      # ESLint 검사
```

테스트 프레임워크 없음. 타입 검사: `npx tsc --noEmit`

## 코드 수정 후 필수 검증

코드를 수정한 뒤에는 반드시 아래 명령을 실행하고, 오류와 경고를 모두 해결한 후 작업을 완료로 표시한다.

```bash
npm run build && npm run lint
```

## 환경 변수

`.env.local`에 필요:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 아키텍처 개요

**Plateer 회사 내 회의실 예약 시스템** — Next.js 15 App Router + Supabase + Tailwind 4

### 라우트 구조

| 경로 | 설명 |
|------|------|
| `/login` | 이메일/비밀번호 로그인 (Supabase Auth) |
| `/(main)` | 일반 직원 영역 — `AppProvider`와 `AppShell`로 감쌈 |
| `/admin/*` | 관리자 전용 (`/admin/stats`, `/admin/rooms`, `/admin/bookings`, `/admin/users`) |
| `/api/bookings` | 단건 예약 CRUD |
| `/api/recurring` | 반복 예약 생성 (rrule.js로 1년치 날짜 생성 후 batch insert) |
| `/api/admin/*` | 관리자 전용 API (stats, rooms, bookings, users) |
| `/api/auth/callback` | OAuth 콜백 처리 |

### 상태 관리 — `AppContext` (`lib/context/AppContext.tsx`)

`(main)` 레이아웃 전체를 감싸는 단일 Context. 다음을 관리:
- Supabase 세션 초기화 및 데이터 로딩
- 선택된 날짜(`selectedDate`)에 따른 예약 실시간 갱신
- 예약 생성/수정/취소 핸들러 (내부에서 `/api/*` 호출)
- 모달 상태 (`modalNew`, `modalDetail`, `modalEdit`, `modalEditRecurring`)
- 다크모드·포인트 컬러 (`localStorage` 영속)
- Supabase Realtime (`bookings` 테이블 변경 시 자동 갱신)

**뮤테이션 흐름**: 클라이언트 컴포넌트 → `AppContext` 핸들러 → API Route → `lib/supabase/mutations.ts`

### Supabase 클라이언트 패턴

- `lib/supabase/client.ts` — 브라우저용 (`createBrowserClient`)
- `lib/supabase/server.ts` — Server Component·API Route용 (`createServerClient` + cookies)
- `lib/supabase/middleware.ts` — `updateSession()`: 미들웨어에서 세션 갱신 및 인증 검사

### 관리자 권한 처리

`lib/supabase/admin-guard.ts`의 `requireAdmin()` — `users.role === 'admin'` 검사. 모든 `/api/admin/*` 라우트에서 호출.

### 시간대 처리

**모든 시간은 KST(UTC+9)** 기준으로 표시하되, DB에는 UTC ISO 문자열로 저장.
- `queries.ts`의 `KST_OFFSET_MS = 9 * 60 * 60 * 1000` 상수로 변환
- `Booking.start`/`end`는 float hour (예: `9.5` = 09:30)

### 핵심 타입 (`lib/types.ts`)

- `Room`, `Booking`, `RecurringBooking`, `UpcomingBooking`, `User` — 일반 사용자 영역
- `AdminRoom`, `AdminBooking`, `AdminUser`, `AdminStats` — 관리자 영역
- `PlateerData` — `AppContext`의 `data` 프로퍼티 형태

### DB 테이블

`rooms`, `bookings`, `recurring_bookings`, `booking_attendees`, `users`, `user_favorites`

참석자는 이름 문자열 배열로 받아 `users` 테이블에서 ID 조회 후 `booking_attendees`에 저장.
예약 충돌 방지: DB exclusion constraint (`23P01` 에러 코드로 감지).

### 반복 예약

`/api/recurring` POST → rrule.js로 최대 1년치 날짜 계산 → `recurring_bookings` 1행 + `bookings` N행 batch insert. 취소 범위: `'this'` (단건) | `'future'` (이후 전체) | `'all'` (시리즈 전체).
