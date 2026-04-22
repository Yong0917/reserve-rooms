# Reserve Rooms

회사 내 회의실을 효율적으로 예약하고 관리하는 사내 웹 애플리케이션입니다.

---

## 목차

- [프로젝트 개요](#프로젝트-개요)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [아키텍처](#아키텍처)
- [화면 구성](#화면-구성)
- [핵심 비즈니스 로직](#핵심-비즈니스-로직)
- [데이터베이스 스키마](#데이터베이스-스키마)
- [폴더 구조](#폴더-구조)
- [로컬 실행](#로컬-실행)

---

## 프로젝트 개요

Plateer 사내 구성원을 위한 회의실 예약 시스템입니다. 층별·시간대별 회의실 현황을 한눈에 파악하고, 단건·반복 예약을 생성·수정·취소할 수 있습니다. 관리자는 별도 페이지에서 회의실 CRUD, 전체 예약 관리, 사용자 역할 변경, 사용률 통계를 확인할 수 있습니다.

| 항목 | 내용 |
|------|------|
| 서비스명 | Reserve Rooms |
| 대상 | 사내 직원 (일반 / 관리자) |
| 목적 | 회의실 이중 예약 방지 및 효율적 공간 운영 |
| 배포 | Vercel + Supabase |

---

## 주요 기능

**일반 직원**

- 날짜별 회의실 타임라인 / 그리드 뷰 전환
- 회의실 단건·반복 예약 생성·수정·취소 (이 건만 / 이후 전체 / 시리즈 전체)
- 내 예약 조회 (다가오는 / 지난 / 취소된 탭)
- 반복 예약 시리즈 관리
- 빠른 예약 검색 (시간대·인원·장비·즐겨찾기 필터)
- 글로벌 검색 (`⌘K`) — 회의실 이름·예약 제목 동시 검색
- 즐겨찾기 회의실 등록·해제
- 다크모드·포인트 컬러 테마 설정

**관리자**

- 회의실 CRUD (추가·수정·삭제·활성화)
- 전체 예약 목록 조회 및 강제 취소
- 사용자 역할 변경 (employee ↔ admin)
- 일·주·월별 회의실 사용률 통계

---

## 기술 스택

### Frontend

| 기술 | 버전 | 선택 이유 |
|------|------|-----------|
| Next.js | 16 (App Router) | 파일 기반 라우팅, 서버 컴포넌트, API Routes를 단일 프레임워크에서 운용 |
| React | 19 | 최신 훅 API 및 Server Components 지원 |
| TypeScript | 5 | 도메인 타입(`Booking`, `Room`, `RecurringBooking` 등) 정의로 런타임 에러 방지 |
| Tailwind CSS | 4 | 유틸리티 기반 스타일링. CSS 변수(`--accent`, `--surface` 등)와 조합해 다크모드·테마 전환 구현 |

### Backend

| 기술 | 설명 |
|------|------|
| Next.js API Routes | `/api/bookings`, `/api/recurring`, `/api/admin/*` 엔드포인트를 서버리스 함수로 운영 |
| Supabase Auth | 이메일/비밀번호 인증. 세션은 `@supabase/ssr`의 cookie 기반 방식으로 서버 컴포넌트와 공유 |

### Database

| 기술 | 설명 |
|------|------|
| PostgreSQL (Supabase) | 예약 충돌 방지를 위한 **Exclusion Constraint** (`tstzrange WITH &&`) 적용 |
| Row Level Security | 테이블별 읽기·쓰기·삭제 권한을 DB 레벨에서 분리 |
| Supabase Realtime | `bookings` 테이블 변경 시 클라이언트에 즉시 반영 |

### 기타 라이브러리

| 라이브러리 | 용도 |
|-----------|------|
| `rrule` | RFC 5545 RRULE 파싱 및 최대 1년치 반복 날짜 생성 |
| `@supabase/ssr` | Next.js App Router에서 서버·클라이언트 Supabase 인스턴스를 쿠키 기반으로 통합 관리 |

---

## 아키텍처

### 라우트 구조

```
app/
├── login/                          # 이메일/비밀번호 로그인
├── (main)/                         # 인증된 직원 영역
│   ├── layout.tsx                  # AppProvider + AppShell 래핑
│   ├── page.tsx                    # 홈 대시보드
│   ├── my/page.tsx                 # 내 예약
│   ├── recurring/page.tsx          # 반복 예약 관리
│   ├── search/page.tsx             # 빠른 예약 검색
│   └── rooms/[id]/page.tsx         # 회의실 상세
├── admin/                          # 관리자 전용
│   ├── layout.tsx
│   ├── page.tsx                    # 관리자 홈 (통계)
│   ├── stats/page.tsx
│   ├── rooms/page.tsx              # 회의실 CRUD
│   ├── bookings/page.tsx           # 전체 예약 관리
│   └── users/page.tsx             # 사용자 역할 관리
└── api/
    ├── auth/callback/route.ts
    ├── bookings/[id]/route.ts      # 단건 예약 PATCH · DELETE
    ├── bookings/route.ts           # 예약 생성 POST
    ├── recurring/[id]/route.ts     # 반복 예약 수정 · 삭제
    ├── recurring/route.ts          # 반복 예약 일괄 생성
    └── admin/                      # 관리자 전용 API
```

### 상태 관리 — `AppContext`

`(main)` 레이아웃 전체를 감싸는 단일 Context. 다음을 담당합니다.

- Supabase 세션 초기화 및 병렬 데이터 패칭 (`Promise.all`)
- `selectedDate` 변경 시 해당 날짜의 예약 자동 재조회
- 예약 생성·수정·취소 핸들러 — 내부에서 API Route 호출 후 Realtime으로 UI 갱신
- 모달 상태 (`modalNew`, `modalDetail`, `modalEdit`, `modalEditRecurring`)
- 다크모드·포인트 컬러 (`localStorage` 영속 + CSS 변수 동적 주입)
- Supabase Realtime 구독 (`bookings` 변경 시 refetch 트리거)

**뮤테이션 흐름:**

```
클라이언트 컴포넌트
  → AppContext 핸들러 (handleCreate / handleUpdate / handleCancelBooking)
    → fetch('/api/bookings' | '/api/recurring')
      → lib/supabase/mutations.ts (Supabase insert / update / RPC)
        → Supabase Realtime → AppContext refetch → UI 갱신
```

### Supabase 클라이언트 패턴

| 파일 | 용도 |
|------|------|
| `lib/supabase/client.ts` | 브라우저 전용 (`createBrowserClient`) |
| `lib/supabase/server.ts` | Server Component · API Route용 (`createServerClient` + cookies) |
| `lib/supabase/middleware.ts` | `updateSession()` — 미들웨어에서 세션 갱신 및 인증 검사 |
| `lib/supabase/admin-guard.ts` | `requireAdmin()` — `users.role === 'admin'` 검사 |

---

## 화면 구성

### 홈 대시보드

**기능**

- KPI 카드 4개: 현재 이용 가능 회의실 / 이날 내 예약 / 평균 사용률 / 다음 반복 예약
- 층·인원·장비 필터로 회의실 즉시 필터링
- `‹ ›` 날짜 네비게이션으로 날짜 이동 시 예약 데이터 재조회
- 타임라인 뷰 / 그리드 뷰 전환

**핵심 UI/UX 포인트**

- 타임라인: 회의실을 행으로, 시간을 열로 배치. 예약 블록을 클릭하면 상세 모달 오픈. 빈 셀 클릭 시 해당 회의실·시간으로 예약 모달이 미리 채워진 상태로 오픈.
- 현재 시각 기준으로 "지금 이용 가능" 회의실 수를 실시간 계산.
- Supabase Realtime 구독으로 다른 사용자가 예약을 생성하면 새로고침 없이 타임라인이 갱신.

### 예약 생성 / 수정 모달

**기능**

- 회의실 선택, 날짜 피커, 시간 슬라이더, 소요 시간 설정
- 참석자 이름 자동완성 (Supabase `users` 테이블 실시간 검색)
- 반복 설정: 매일 / 매주 / 격주 / 매월
- 태그 선택: 팀 회의 / 디자인 / 전사 / 외부 / 1on1 / 임원 / 제품
- `mode: 'create' | 'edit'` prop 하나로 동일 컴포넌트 재사용

**사용자 시나리오**

1. 타임라인의 빈 셀 클릭 → 회의실·시간이 미리 채워진 모달 오픈
2. 제목 입력 → 반복 설정 → 참석자 추가 → 저장
3. 반복 예약이면 `/api/recurring` POST, 단건이면 `/api/bookings` POST

### 빠른 예약 검색

**기능**

- "언제" (지금 / 1시간 후 / 내일 오전 / 날짜 직접 선택)
- "얼마나" (15 / 30 / 60 / 90분)
- "몇 명" (1–2 / 3–4 / 5–8 / 9+명)
- 사이드 필터: 층 / 장비 / 즐겨찾기만
- 결과 정렬: 추천순(즐겨찾기 + 용량 낭비 최소) / 가까운순 / 큰 순

**핵심 로직**

```typescript
// 선택한 시간대에 이미 예약된 room_id를 제외하고 조회
const { data: busyData } = await client
  .from('bookings')
  .select('room_id')
  .eq('status', 'active')
  .lt('start_at', filter.endAt)
  .gt('end_at', filter.startAt);

const busyRoomIds = new Set(busyData.map((b) => b.room_id));
```

### 내 예약

- 다가오는 / 지난 / 취소된 탭 전환
- 20건 단위 페이지네이션
- 반복 예약 취소 시 범위 선택: 이 건만 / 이후 전체 / 시리즈 전체

### 관리자 — 사용률 통계

- 일·주·월 기간 전환
- 회의실별 예약 건수 및 사용률(%) 바 차트
- 취소율, 가장 많이 사용된 회의실 KPI 카드

---

## 핵심 비즈니스 로직

### 예약 충돌 방지 (이중 방어)

**1차 — 클라이언트 쿼리로 사전 검증:**

```sql
SELECT id FROM bookings
WHERE room_id = $room_id
  AND status = 'active'
  AND start_at < $end_at
  AND end_at > $start_at
```

**2차 — PostgreSQL Exclusion Constraint (Race Condition 방지):**

동시에 두 사용자가 같은 시간대에 예약을 시도할 경우 DB 레벨에서 차단합니다.

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings ADD CONSTRAINT no_double_booking
  EXCLUDE USING gist (
    room_id WITH =,
    tstzrange(start_at, end_at) WITH &&
  ) WHERE (status = 'active');
```

제약 위반 시 PostgreSQL error code `23P01`을 반환하며, API Route에서 이를 감지해 사용자에게 명확한 오류 메시지를 반환합니다.

```typescript
if (error?.code === '23P01') {
  return { error: '해당 시간대에 이미 예약이 있습니다' };
}
```

### 반복 예약 생성

rrule.js로 최대 1년치 날짜를 계산한 뒤 `recurring_bookings` 1행과 `bookings` N행을 batch insert합니다.

```typescript
// 예: 매주 수요일 반복, 최대 52회
const rule = new RRule({
  freq: RRule.WEEKLY,
  byweekday: RRule.WE,
  dtstart: startDate,
  count: 52,
});
const dates = rule.all(); // Date[]
// → createRecurringBooking(supabase, { ..., dates })
```

취소 범위는 세 가지 scope로 처리합니다.

| scope | 처리 방식 |
|-------|-----------|
| `'this'` | 해당 booking 1건만 `status = 'cancelled'` |
| `'future'` | `fromDate` 이후 같은 `recurring_id`의 bookings 일괄 취소 |
| `'all'` | 시리즈 전체 + `recurring_bookings` 레코드 비활성화 |

### KST 시간대 처리

모든 시각은 KST(UTC+9) 기준으로 표시하되, DB에는 UTC ISO 문자열로 저장합니다.

```typescript
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// UTC timestamp → KST float hour (9.5 = 09:30)
function tsToFloatHour(ts: string): number {
  const d = new Date(ts);
  return d.getUTCHours() + 9 + d.getUTCMinutes() / 60;
}

// 날짜 범위 쿼리 시 KST 자정을 UTC로 변환
function getKSTDayRange(date: Date) {
  const kstMs = date.getTime() + KST_OFFSET_MS;
  const kstDateStr = new Date(kstMs).toISOString().split('T')[0];
  const dayStartMs = new Date(`${kstDateStr}T00:00:00.000Z`).getTime() - KST_OFFSET_MS;
  return {
    start: new Date(dayStartMs).toISOString(),
    end: new Date(dayStartMs + 24 * 60 * 60 * 1000).toISOString(),
  };
}
```

### 관리자 인증 가드

모든 `/api/admin/*` 라우트 첫 줄에서 `requireAdmin()`을 호출합니다. Supabase Auth 세션 + `users.role` 필드를 이중으로 검사합니다.

```typescript
// lib/supabase/admin-guard.ts
export async function requireAdmin(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '인증 필요', status: 401 };

  const { data } = await supabase
    .from('users').select('role').eq('id', user.id).single();

  if (data?.role !== 'admin') return { error: '관리자 권한 필요', status: 403 };
  return { userId: user.id };
}
```

### Supabase Realtime

`bookings` 테이블의 모든 변경(`INSERT`, `UPDATE`, `DELETE`)을 구독하여 다른 사용자의 예약이 즉시 타임라인에 반영됩니다.

```typescript
const channel = supabase
  .channel('bookings-rt')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
    refetchRef.current(); // 현재 날짜 데이터 재조회
  })
  .subscribe();
```

---

## 데이터베이스 스키마

```sql
-- 회의실
rooms (id, name, floor, zone, capacity, features[], color, image_url, is_active, created_at)

-- 예약 — Exclusion Constraint 적용
bookings (id, room_id, owner_id, title, start_at, end_at, tag, status, recurring_id, cancelled_at, created_at)

-- 참석자 (M:N)
booking_attendees (booking_id, user_id)

-- 반복 예약 메타 (RFC 5545 RRULE 저장)
recurring_bookings (id, room_id, owner_id, title, rrule, duration, tag, status, created_at)

-- 사용자 (Supabase Auth와 1:1 연동)
users (id, email, name, team, desk, role, avatar_url, theme_color, dark_mode, created_at)

-- 즐겨찾기
user_favorites (user_id, room_id, created_at)
```

### Row Level Security 정책

| 테이블 | 읽기 | 쓰기·수정 | 삭제 |
|--------|------|-----------|------|
| `rooms` | 인증된 모든 사용자 | 관리자만 | 관리자만 |
| `bookings` | 인증된 모든 사용자 | 본인 생성·수정 | 본인 + 관리자 취소 |
| `booking_attendees` | 인증된 모든 사용자 | 예약 owner만 | 예약 owner만 |
| `users` | 인증된 모든 사용자 | 본인만 | — |
| `recurring_bookings` | 인증된 모든 사용자 | 본인 생성·수정 | 본인 + 관리자 |
| `user_favorites` | 본인만 | 본인만 | 본인만 |

---

## 폴더 구조

```
reserve-rooms/
├── app/
│   ├── (main)/                     # 인증된 직원 영역
│   │   ├── layout.tsx              # AppProvider + AppShell
│   │   ├── page.tsx                # 홈 대시보드
│   │   ├── my/page.tsx             # 내 예약
│   │   ├── recurring/page.tsx      # 반복 예약
│   │   ├── search/page.tsx         # 빠른 예약 검색
│   │   └── rooms/[id]/page.tsx     # 회의실 상세
│   ├── admin/                      # 관리자 전용
│   │   ├── stats/
│   │   ├── rooms/
│   │   ├── bookings/
│   │   └── users/
│   ├── api/
│   │   ├── auth/callback/
│   │   ├── bookings/[id]/
│   │   ├── bookings/
│   │   ├── recurring/[id]/
│   │   ├── recurring/
│   │   └── admin/                  # stats, rooms, bookings, users
│   ├── layout.tsx
│   └── login/page.tsx
├── components/
│   ├── AppShell.tsx                # Sidebar + Topbar 레이아웃
│   ├── Dashboard.tsx               # KPI + 필터 + TimelineView
│   ├── TimelineView.tsx            # 타임라인·그리드 뷰
│   ├── BookingModal.tsx            # 예약 생성·수정 모달 (create/edit 모드)
│   ├── BookingDetailModal.tsx      # 예약 상세 모달
│   ├── MyBookings.tsx              # 내 예약 탭
│   ├── Recurring.tsx               # 반복 예약 목록
│   ├── RecurringEditModal.tsx      # 반복 예약 수정 모달
│   ├── RoomDetail.tsx              # 회의실 상세·가용성
│   ├── Search.tsx                  # 빠른 예약 검색
│   ├── Sidebar.tsx
│   ├── Topbar.tsx                  # 글로벌 검색 (⌘K)
│   └── admin/
│       ├── AdminNav.tsx
│       ├── BookingRow.tsx
│       ├── RoomForm.tsx
│       ├── StatCard.tsx
│       ├── UsageChart.tsx
│       └── UserRow.tsx
├── lib/
│   ├── context/AppContext.tsx      # 전역 상태 + 뮤테이션 핸들러
│   ├── types.ts                    # 도메인 타입 정의
│   ├── data.ts                     # 상수·헬퍼
│   └── supabase/
│       ├── client.ts               # 브라우저 클라이언트
│       ├── server.ts               # 서버 클라이언트
│       ├── middleware.ts           # 세션 갱신
│       ├── admin-guard.ts          # 관리자 권한 검사
│       ├── queries.ts              # 읽기 전용 쿼리
│       └── mutations.ts            # 쓰기 뮤테이션
└── docs/
    ├── PRD.md
    ├── ROADMAP.md
    └── TEST_ACCOUNTS.md
```

---

## 로컬 실행

### 사전 요구사항

- Node.js 20+
- Supabase 프로젝트

### 환경 변수

`.env.local` 파일을 생성합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### 실행

```bash
npm install
npm run dev     # http://localhost:3000
```

### 테스트 계정

| 이름 | 이메일 | 역할 | 비밀번호 |
|------|--------|------|----------|
| 관리자 | admin@plateer.com | 관리자 | `1234` |
| 김지안 | employee@plateer.com | 일반 직원 | `1234` |
| 이수진 | sujin@plateer.com | 일반 직원 | `1234` |

### 검증 명령

```bash
npm run build && npm run lint
```
