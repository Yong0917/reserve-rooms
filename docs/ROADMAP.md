# Reserve Rooms — 개발 로드맵

> PRD 기준일: 2026-04-20  
> 목표: 목업 UI 프로토타입 → Supabase 연동 실제 서비스 전환

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | Reserve Rooms |
| 목적 | 회사 내 회의실 예약 및 관리 |
| 대상 | 일반 직원 + 관리자 |
| 기술 스택 | Next.js 15 · React 19 · TypeScript · Tailwind 4 · Supabase · Vercel |

---

## 전체 일정

| Phase | 내용 | 기간 | 소요 |
|-------|------|------|------|
| 1 | 기반 구축 | 2026-04-21 ~ 2026-04-27 | 1주 |
| 2 | 데이터 연동 | 2026-04-28 ~ 2026-05-04 | 1주 |
| 3 | 예약 CRUD | 2026-05-05 ~ 2026-05-11 | 1주 |
| 4 | 부가 기능 | 2026-05-12 ~ 2026-05-15 | 0.5주 |
| 5 | 관리자 페이지 | 2026-05-16 ~ 2026-05-19 | 0.5주 |
| 6 | 배포 | 2026-05-20 ~ 2026-05-22 | 0.5주 |

**총 기간: 약 4.5주 (2026-04-21 ~ 2026-05-22)**

---

## 현재 구현 현황

| 기능 | 구현 수준 | 주요 잔여 작업 |
|------|:---------:|---------------|
| 홈 대시보드 | 100% | ✅ 실 데이터 연동 완료, 날짜 네비게이션 완료 |
| 빠른 예약 검색 | 100% | ✅ 찾기 실동작, 날짜 피커, 결과 정렬 완료 |
| 예약 생성 | 100% | ✅ DB 저장, 날짜 피커, 참석자 자동완성, 반복 예약 생성 완료 |
| 예약 수정 | 100% | ✅ edit 모드 구현 완료 (`mode: 'create' | 'edit'`) |
| 예약 취소 | 100% | ✅ 단건·반복 범위 취소(이 건만/이후/전체) 완료 |
| 내 예약 | 100% | ✅ 탭 전환(다가오는/지난/취소된), 편집/삭제 버튼 연결 완료 |
| 반복 예약 관리 | 100% | ✅ 삭제 실동작(인라인 confirm) 완료 |
| 회의실 상세 | 95% | 즐겨찾기, 빠른 예약 버튼 |
| 글로벌 검색 | 100% | ✅ ⌘K 단축키, 드롭다운, 회의실/예약 검색 완료 |
| 즐겨찾기 | 100% | ✅ RoomDetail 하트 아이콘, Search 필터, DB 연동 완료 |
| 사용자 설정 | 100% | ✅ localStorage 연동 완료 (다크모드, 포인트 컬러) |
| 관리자 페이지 | 100% | ✅ 통계/회의실CRUD/예약관리/사용자관리 완료 |
| 로그인 페이지 | 100% | ✅ 이메일/비밀번호 인증 완료 |
| 인증 콜백 | 100% | ✅ `/api/auth/callback` 완료 |
| Supabase DB 스키마 | 100% | ✅ 6개 테이블 + RLS 마이그레이션 완료 |

---

## Phase 1 — 기반 구축 ✅ 완료 (2026-04-21)

**기간**: 2026-04-21 ~ 2026-04-27  
**의존 관계**: 모든 Phase의 선제 조건

### 태스크

- [x] Supabase 프로젝트 생성 + 환경변수 설정 (`.env.local`)
- [x] DB 스키마 생성 — 6개 테이블: `users` `rooms` `bookings` `booking_attendees` `recurring_bookings` `user_favorites` (마이그레이션 2개 완료)
- [ ] `btree_gist` 확장 + exclusion constraint (동시 예약 race condition 방지 — 마이그레이션 내 포함 여부 확인 필요)
- [x] RLS 정책 설정 (6개 테이블 전체)
- [x] `/api/auth/callback` route 구현
- [x] Next.js proxy (`proxy.ts`) — 인증 게이트 + `/admin` 라우트 보호 (Next.js 16은 `proxy.ts` 사용)
- [x] 테스트 계정 생성 (users 7명 시드 완료)
- [x] 목업 데이터 시드 (rooms 12개, bookings 15개)
- [x] 로그인 페이지 구현 (이메일/비밀번호 인증)

### 완료 기준 (DoD)

- 로그인 후 대시보드 접근 가능
- 미인증 상태에서 `/login` 자동 리다이렉트
- 일반 계정으로 `/admin` 접근 시 차단

---

## Phase 2 — 데이터 연동 ✅ 완료 (2026-04-20)

**기간**: 2026-04-20 (조기 완료)  
**의존 관계**: Phase 1 완료 후

### 태스크

- [x] Supabase 클라이언트 설정 (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
- [x] 회의실 목록 실시간 조회 (Supabase Realtime `bookings` 테이블 구독)
- [x] 타임라인/그리드 뷰 실 데이터 반영
- [x] 대시보드 KPI 4개 실 데이터 연동 (이용 가능 회의실 / 오늘 내 예약 / 평균 사용률 / 반복 예약)
- [x] 날짜 네비게이션 `‹ ›` 동작 (date state + 쿼리 재요청)
- [x] 회의실 상세 — 오늘 타임라인 실 데이터 반영
- [x] 회의실 상세 — 다음 7일 가용성 % 계산

### 구현 내용

- `lib/supabase/queries.ts` 신규 생성: `fetchRooms`, `fetchUserProfile`, `fetchBookingsByDate`, `fetchMyUpcoming`, `fetchRecurring`, `fetchRoomAvailability` 6개 쿼리 함수
- `app/page.tsx`: Supabase 데이터 페칭 + Realtime 구독 + `selectedDate` 상태 추가
- `components/Dashboard.tsx`: 날짜 네비게이션 `‹ ›` + 실 데이터 KPI 계산
- `components/RoomDetail.tsx`: 실시간 현재 시각 NOW 라인 + 7일 가용성 실 데이터
- UTC→KST 변환: `getUTCHours() + 9 + getUTCMinutes() / 60` 방식, date-fns 미사용

### 완료 기준 (DoD) ✅

- 대시보드에서 Supabase 실 예약 데이터 렌더링
- 날짜 변경 시 타임라인 즉시 갱신
- Realtime 구독으로 bookings 변경 시 즉시 반영

---

## Phase 3 — 예약 CRUD ✅ 완료 (2026-04-21)

**기간**: 2026-04-21 (조기 완료)  
**의존 관계**: Phase 2 완료 후

### 태스크

**예약 생성**
- [x] BookingModal 날짜 피커 — `<input type="date">` + `selectedDate` 연동
- [x] 참석자 자동완성 — `users` 테이블 debounce 실시간 검색 (이름)
- [x] 중복 예약 검증 — 클라이언트 레벨 (현재 BOOKINGS 기준 overlap 확인)
- [x] `/api/bookings` route — POST 생성

**예약 수정**
- [x] BookingModal `mode: 'create' | 'edit'` prop 추가
- [x] 수정 모드: 기존 예약 데이터 폼 초기값으로 채우기 (`editTarget`)
- [x] `/api/bookings/[id]` PATCH route

**예약 취소**
- [x] 단건 취소 확인 다이얼로그 (BookingDetailModal 인라인)
- [x] 반복 예약 취소 옵션 팝업 (이 건만 / 이후 모두 / 전체 시리즈 — 인라인)
- [x] `/api/bookings/[id]` DELETE route (scope 파라미터 지원)

**반복 예약**
- [x] rrule.js 기반 RRULE 생성 (`/api/recurring` 서버에서 처리)
- [x] `/api/recurring` route — 향후 1년치 `bookings` 일괄 생성
- [x] `/api/recurring/[id]` DELETE route (전체 시리즈 취소)
- [x] 반복 예약 관리 페이지 삭제 버튼 실동작 (인라인 confirm)

**내 예약**
- [x] 탭 전환 실동작 (다가오는 / 지난 / 취소된 — `fetchMyPast`, `fetchMyCancelled`)
- [x] 편집 버튼 → 수정 모달 오픈
- [x] 삭제 버튼 → 인라인 확인 다이얼로그 → 취소 처리

### 구현 내용

- `lib/supabase/mutations.ts` 신규: `createBooking`, `updateBooking`, `cancelBooking`, `createRecurringBooking`, `cancelRecurringBooking` 5개 함수
- `lib/supabase/queries.ts` 추가: `fetchMyPast`, `fetchMyCancelled`, `Booking.recurringId/startAt` 필드
- `lib/types.ts` 보완: `Booking`에 `recurringId?: string`, `startAt?: string` 추가
- API Routes 4개 신규: `/api/bookings` (POST), `/api/bookings/[id]` (PATCH, DELETE), `/api/recurring` (POST), `/api/recurring/[id]` (DELETE)
- `components/BookingModal.tsx`: mode/selectedDate/editTarget/자동완성/실제 busySlots 조회 추가
- `components/BookingDetailModal.tsx`: `onEdit`, `onCancel(scope)` 실연결, 반복 취소 옵션 인라인 UI
- `components/MyBookings.tsx`: 탭 상태(`useState`), 편집/삭제 핸들러, 인라인 confirm
- `components/Recurring.tsx`: `onEditRecurring`, `onDeleteRecurring` 핸들러 연결
- `app/page.tsx`: `handleCreate`→API 호출, `handleUpdate`, `handleCancelBooking`, `handleDeleteRecurring` 실구현

### 완료 기준 (DoD) ✅

- 예약 생성 → 조회 → 수정 → 취소 전 플로우 동작
- 중복 예약 시 에러 메시지 표시
- 반복 예약 생성 후 향후 1년치 예약 DB에 저장
- 빌드·린트 통과 (`npm run build && npm run lint`)

---

## Phase 4 — 부가 기능 ✅ 완료 (2026-04-21)

**기간**: 2026-04-21 (조기 완료)  
**의존 관계**: Phase 3 완료 후

### 태스크

**즐겨찾기**
- [x] RoomDetail 상세 페이지에 하트 아이콘 추가 (hero 우측 상단)
- [x] 즐겨찾기 토글 → `user_favorites` 테이블 연동 (`addFavorite`, `removeFavorite`)
- [x] 빠른 예약 검색 "즐겨찾기만" 필터 동작
- [x] 검색 결과 카드에 즐겨찾기 뱃지 표시

**빠른 예약 검색**
- [x] "찾기" 버튼 → `fetchAvailableRooms()` Supabase 쿼리 실동작
- [x] 날짜 선택 (`when === 'pick'` 시 `<input type="date">` 표시)
- [x] 결과 정렬 실동작 (추천순 / 가까운순 / 큰 순 — 클라이언트 정렬)
- [x] 추천순 알고리즘: 즐겨찾기 우선 → 용량 낭비 최소화 → 층 근접성

**사용자 설정**
- [x] 다크모드 on/off → `localStorage` 저장 + 새로고침 후 복원
- [x] 포인트 컬러 선택 (5가지) → 동일하게 저장
- [x] 오프라인 시 `localStorage` 폴백 (DB 없이 동작)

**글로벌 검색**
- [x] Topbar 검색바 `⌘K` / `Ctrl+K` 단축키 동작
- [x] 검색 대상: 회의실 이름, 예약 제목 (300ms debounce)
- [x] 검색 결과 드롭다운 — 회의실/예약 섹션 구분, `Escape` 닫기
- [x] 회의실 클릭 → 상세 페이지 이동 / 예약 클릭 → 해당 날짜 대시보드 이동

**페이지네이션**
- [x] 내 예약 목록 20건씩 (지난 예약 / 취소된 예약 — 서버사이드 `range`)
- [x] 반복 예약 목록 20건씩 (클라이언트사이드 slice)

### 구현 내용

- `lib/supabase/queries.ts` 추가: `fetchUserFavorites`, `fetchAvailableRooms`, `searchGlobal`, `fetchMyPast`/`fetchMyCancelled` 페이지네이션 (`{ items, hasMore }` 반환)
- `lib/supabase/mutations.ts` 추가: `addFavorite`, `removeFavorite`
- `components/Icon.tsx`: `building`, `heart`, `heartFilled` 아이콘 추가
- `components/Topbar.tsx`: 전면 재작성 — 글로벌 검색 상태, ⌘K 리스너, 드롭다운 UI
- `components/Search.tsx`: 전면 재작성 — 실동작 검색, 날짜 피커, 정렬, 즐겨찾기 필터
- `components/RoomDetail.tsx`: 즐겨찾기 하트 버튼, 빠른 예약 duration 파라미터 전달
- `components/MyBookings.tsx`: 페이지네이션 UI + props 확장
- `components/Recurring.tsx`: 클라이언트사이드 페이지네이션
- `app/page.tsx`: localStorage 초기화/동기화, `favorites` 상태 + `handleToggleFavorite`, 페이지네이션 상태 (`pastPage`, `cancelledPage`, `hasMore`)

### 완료 기준 (DoD) ✅

- 즐겨찾기 토글 즉시 반영, 새로고침 후 유지 (DB 연동)
- 빠른 예약 검색 — 해당 시간대 예약 없는 회의실만 실 데이터 표시
- 사용자 설정 (다크모드, 포인트 컬러) 새로고침 후 유지
- `npm run build && npm run lint` 통과 (에러 0)

---

## Phase 5 — 관리자 페이지 ✅ 완료 (2026-04-21)

**기간**: 2026-04-21 (조기 완료)  
**의존 관계**: Phase 3 완료 후 (Phase 4와 병행 가능)

### 태스크

- [x] `/admin` layout + 권한 가드 (`role = 'admin'` 검증 — layout 2중 방어 + proxy.ts)
- [x] 관리자 대시보드 — 일/주/월별 회의실별 사용률 통계 (`/admin/stats`)
- [x] 회의실 CRUD (추가/수정/비활성화 + Supabase Storage `room-images` 버킷 이미지 업로드)
- [x] 전체 예약 목록 + 강제 취소 (`/admin/bookings`, 필터: 회의실/상태/날짜/검색)
- [x] 사용자 목록 + 역할 변경 (employee ↔ admin, 자기 자신 변경 방지)

### 구현 내용

- `lib/types.ts`: `UserRole`, `AdminRoom`, `AdminBooking`, `AdminUser`, `AdminStats` 타입 추가 + `User.role?` 필드
- `lib/supabase/queries.ts`: `fetchAllRoomsAdmin`, `fetchAllBookingsAdmin`, `fetchAllUsersAdmin`, `fetchAdminStats` 추가
- `lib/supabase/mutations.ts`: `createRoom`, `updateRoom`, `deactivateRoom`, `updateUserRole` 추가
- `lib/supabase/admin-guard.ts` 신규: `requireAdmin()` 헬퍼 (API routes 공통 인증)
- Supabase migration: `rooms.image_url` 컬럼 추가 + `room-images` Storage 버킷 + 정책 설정
- API Routes 7개 신규: `/api/admin/stats`, `/api/admin/rooms`, `/api/admin/rooms/[id]`, `/api/admin/bookings`, `/api/admin/bookings/[id]`, `/api/admin/users`, `/api/admin/users/[id]`
- `components/admin/`: `AdminNav`, `StatCard`, `UsageChart`, `RoomForm`, `BookingRow`, `UserRow`
- `app/admin/`: `layout.tsx`, `page.tsx`, `stats/`, `rooms/`, `bookings/`, `users/`

### 완료 기준 (DoD) ✅

- 관리자 계정으로 회의실 추가 → 목록 즉시 반영
- 일반 계정에서 `/admin` 접근 시 `/` 리다이렉트 (proxy.ts + layout 이중 방어)
- `npm run build && npm run lint` 통과 (에러 0)

---

## Phase 6 — 배포

**기간**: 2026-05-20 ~ 2026-05-22  
**의존 관계**: Phase 5 완료 후

### 태스크

- [ ] Microsoft Azure AD OAuth 등록 + Supabase Auth 연동
- [ ] Vercel 프로젝트 연결 + 환경변수 설정
- [ ] Supabase Auth redirect URL에 프로덕션 도메인 추가
- [ ] Azure AD OAuth 앱 리다이렉트 URI 업데이트
- [ ] 도메인 연결 및 HTTPS 확인
- [ ] 프로덕션 시드 데이터 정리

### 완료 기준 (DoD)

- 프로덕션 URL에서 전체 플로우 동작 확인
- Microsoft 계정으로 OAuth 로그인 성공

---

## UI 보완 사항 트래킹

> PRD §9 기반 — 미구현 항목과 처리 Phase 매핑

| 컴포넌트 | 미구현 항목 | 처리 Phase |
|----------|-------------|:----------:|
| `BookingModal` | ~~날짜 선택 달력 피커~~ ✅ | Phase 3 |
| `BookingModal` | ~~참석자 자동완성~~ ✅ | Phase 3 |
| `BookingModal` | ~~수정 모드 (`mode: 'edit'`)~~ ✅ | Phase 3 |
| `Search` | ~~날짜 선택 달력 피커~~ ✅ | Phase 4 |
| `Search` | ~~찾기 버튼 실동작~~ ✅ | Phase 4 |
| `Search` | ~~정렬 탭 실동작~~ ✅ | Phase 4 |
| `MyBookings` | ~~탭 전환 실동작~~ ✅ | Phase 3 |
| `MyBookings` | ~~편집/삭제 버튼 핸들러~~ ✅ | Phase 3 |
| `Recurring` | ~~삭제 버튼 + 확인 팝업~~ ✅ | Phase 3 |
| `RoomDetail` | ~~즐겨찾기 하트 아이콘~~ ✅ | Phase 4 |
| `RoomDetail` | ~~빠른 예약 버튼 (30/60/90분)~~ ✅ | Phase 4 |
| `Topbar` | ~~검색바 ⌘K 단축키 + 드롭다운~~ ✅ | Phase 4 |
| `Dashboard` | ~~날짜 네비게이션 `‹ ›`~~ ✅ | Phase 2 |

---

## 주요 라이브러리

| 라이브러리 | 용도 | 사용 Phase |
|-----------|------|:----------:|
| `@supabase/supabase-js` | Supabase 클라이언트 | Phase 1 |
| `@supabase/ssr` | Next.js App Router SSR 지원 | Phase 1 |
| `rrule` | 반복 예약 RRULE 생성/파싱 | Phase 3 ✅ |
| ~~`react-day-picker`~~ | ~~달력 날짜 선택~~ | `<input type="date">` 로 대체 |
| `date-fns` | 날짜 계산 유틸리티 | Phase 2 |

---

## 환경 변수 체크리스트

```env
# 클라이언트 공개 가능
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# 서버 전용 (절대 클라이언트 노출 금지)
SUPABASE_SERVICE_ROLE_KEY=
```

> Azure AD OAuth (클라이언트 ID, 시크릿, 테넌트 ID)는 Supabase 대시보드 → Authentication → Providers → Azure에서 설정. Next.js 환경변수 불필요.

---

## 핵심 기술 결정 사항

### 동시 예약 race condition 방지
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE bookings ADD CONSTRAINT no_double_booking
  EXCLUDE USING gist (
    room_id WITH =,
    tstzrange(start_at, end_at) WITH &&
  ) WHERE (status = 'active');
```

### 반복 예약 처리 전략
- `recurring_bookings`에 RFC 5545 RRULE 저장
- 생성 시 rrule.js로 향후 1년치 `bookings` 레코드 일괄 생성
- **이 건만 수정**: 해당 `booking` 레코드만 수정 (recurring_id 유지)
- **이후 모두 수정**: 해당 날짜 이후 같은 `recurring_id`의 bookings 일괄 업데이트
- **전체 시리즈 수정**: `recurring_bookings` 업데이트 + 모든 하위 `bookings` 업데이트

### Supabase Realtime 구독 대상
- 타임라인 뷰 → `bookings` 테이블 변경 구독
- 빠른 예약 결과 화면 → 동일 적용
