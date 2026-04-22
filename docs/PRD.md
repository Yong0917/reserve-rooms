# 회의실 예약 앱 (Reserve Rooms) 기획서

## Context

현재 UI는 완성도 높은 프로토타입 수준으로 구현되어 있으나, 실제 데이터 저장·인증·API가 없는 목업 상태. 이 기획서는 현재 UI를 기반으로 Supabase + Next.js App Router를 활용해 실제 서비스로 전환하는 방향을 정의한다.

---

## 1. 서비스 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | Reserve Rooms |
| 목적 | 회사 내 회의실을 효율적으로 예약하고 관리 |
| 대상 | 회사 직원 (일반 사용자) + 관리자 |
| 기술 스택 | Next.js 15 (App Router) · React 19 · TypeScript · Tailwind 4 · Supabase · Vercel |

---

## 2. 사용자 역할 및 권한

| 기능 | 일반 직원 | 관리자 |
|------|-----------|--------|
| 회의실 조회/검색 | ✅ | ✅ |
| 내 예약 생성/수정/취소 | ✅ | ✅ |
| 반복 예약 생성/수정/관리 | ✅ | ✅ |
| 즐겨찾기 관리 | ✅ | ✅ |
| 타인 예약 취소 | ❌ | ✅ |
| 회의실 추가/수정/삭제 | ❌ | ✅ |
| 전체 예약 현황 보기 | ❌ | ✅ |
| 사용자 역할 변경 | ❌ | ✅ |

---

## 3. 인증 시스템

### 인증 방식
- **프로덕션**: Microsoft 365 OAuth (Azure AD) → Supabase Auth 연동
- **개발/테스트**: Supabase 이메일/비밀번호 테스트 계정 2개 (일반, 관리자)

### 인증 플로우
1. 로그인 페이지 (`/login`) → Microsoft 로그인 버튼 + 테스트 계정 로그인 폼
2. OAuth 콜백 → Supabase Auth 세션 발급
3. 신규 사용자: OAuth 토큰의 Microsoft 프로필(이름, 이메일, 아바타 URL)을 `users` 테이블에 자동 저장 (role: 'employee' 기본값)
4. 재로그인: 프로필 정보 최신 상태로 업데이트 (upsert)
5. 관리자: DB에서 `role = 'admin'` 수동 변경

---

## 4. 핵심 기능 정의

### 4-1. 홈 대시보드
**현재 구현 수준: 85%**

- KPI 카드 4개 (현재 이용 가능 회의실 / 오늘 내 예약 / 평균 사용률 / 반복 예약) → 실 데이터 연동
- 층/인원/장비 필터 → 실제 필터링 동작
- 날짜 네비게이션 `‹ ›` 버튼 → 날짜 변경 동작 (현재 미동작)
- 타임라인 / 그리드 뷰 전환
- 우측 사이드바: 오늘 내 예약 클릭 시 예약 상세 오픈

### 4-2. 빠른 예약 검색
**현재 구현 수준: 60%**

- "언제" 필터: 지금 / 1시간 후 / 내일 오전 / **날짜 선택 (달력 피커 필요)**
- "얼마나" 필터: 15 / 30 / 60 / 90분
- "몇 명" 필터: 1-2 / 3-4 / 5-8 / 9+명
- 사이드바 필터: 층 / 장비 / 즐겨찾기만 / 창문 있음
- "찾기" 버튼 → 실제 DB 조회 후 결과 반환
- 결과 정렬: 추천순(가용 시간 + 즐겨찾기 우선) / 가까운순(층 기준) / 큰 순(용량 기준)
- 회의실 카드 가용성 스트립 → 실 예약 데이터 반영

### 4-3. 예약 생성 / 수정
**현재 구현 수준: 예약 생성 80% / 수정 0%**

**예약 생성:**
- 제목, 회의실 선택, 날짜 선택 (달력 피커), 시작 시간, 소요 시간
- 바쁜 시간 표시 → 실 예약 데이터 기반
- 태그 선택: team / design / company / external / 1on1 / exec / product
- 반복 설정: 반복 안 함 / 매일 / 매주 / 격주 / 매월 / 직접 설정
- 참석자 추가: 사용자 검색 (이름/이메일) → 자동완성
- 중복 예약 실시간 검증

**예약 수정:**
- BookingModal을 수정 모드로 재사용 (`mode: 'edit'` prop 추가)
- 기존 예약 데이터 초기값으로 폼 채우기
- 단건 예약: 바로 수정
- 반복 예약 수정 시 선택 팝업:
  - 이 예약만 수정
  - 이후 예약 모두 수정
  - 전체 시리즈 수정

### 4-4. 내 예약
**현재 구현 수준: 40%**

- 탭: 다가오는 예약 / 지난 예약 / 취소된 예약 (탭 전환 실제 동작)
- 편집 버튼 → 예약 수정 모달 오픈
- 삭제 버튼 → 확인 다이얼로그 → 취소 처리
- 반복 예약 취소 시 선택:
  - 이 예약만 취소
  - 이후 예약 모두 취소
  - 전체 시리즈 취소

### 4-5. 반복 예약 관리
**현재 구현 수준: 20%**

- 반복 예약 목록 → 실 DB 데이터 연동
- 수정 버튼 → 반복 예약 수정 모달 (전체 시리즈 수정)
- 삭제 버튼 → 전체 시리즈 취소 확인 다이얼로그

### 4-6. 회의실 상세
**현재 구현 수준: 70%**

- 오늘 타임라인 → 실 예약 데이터 반영
- 다음 7일 가용성 % → 실 데이터 계산
- 즐겨찾기 토글 버튼 (하트 아이콘 추가 필요)
- 빠른 예약 버튼 30/60/90분 → 해당 시간으로 예약 모달 오픈

### 4-7. 글로벌 검색
**현재 구현 수준: 0%**

- Topbar 검색바 `⌘K` 단축키 동작
- 검색 대상: 회의실 이름, 예약 제목, 날짜
- 검색 결과 드롭다운 표시

### 4-8. 즐겨찾기
**현재 구현 수준: 0% (UI도 없음)**

- 회의실 카드 / 상세 페이지에 하트 아이콘 추가
- 즐겨찾기 토글 → `user_favorites` 테이블 업데이트
- 빠른 예약 검색에서 "즐겨찾기만" 필터 동작

### 4-9. 사용자 설정
**현재 구현 수준: 0% (UI는 있으나 저장 안 됨)**

- 다크모드 on/off → `localStorage` + `users` 테이블에 저장
- 포인트 컬러 선택 (9가지) → 동일하게 저장
- 설정 버튼 → 설정 드로어/모달 오픈

### 4-10. 관리자 페이지 (신규)
- `/admin` 라우트 (관리자만 접근)
- 회의실 CRUD (추가/수정/삭제, 이미지 업로드)
- 전체 예약 목록 + 강제 취소
- 사용자 목록 + 역할 변경 (employee ↔ admin)
- 사용률 통계 (일/주/월별 회의실별 점유율)

---

## 5. Supabase 데이터베이스 스키마

### users
```sql
id          uuid PRIMARY KEY  -- auth.users.id 참조
email       text UNIQUE NOT NULL
name        text NOT NULL
team        text
desk        text
role        text DEFAULT 'employee'  -- 'employee' | 'admin'
avatar_url  text
theme_color text DEFAULT 'lavender'
dark_mode   boolean DEFAULT false
created_at  timestamptz DEFAULT now()
```

### rooms
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
name        text NOT NULL
floor       int NOT NULL
zone        text
capacity    int NOT NULL
features    text[] DEFAULT '{}'  -- 'tv','whiteboard','window','phone','video_conf','projector'
color       text DEFAULT 'lavender'
image_url   text
is_active   boolean DEFAULT true
created_at  timestamptz DEFAULT now()
```

### bookings
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
room_id         uuid REFERENCES rooms(id)
owner_id        uuid REFERENCES users(id)
title           text NOT NULL
start_at        timestamptz NOT NULL
end_at          timestamptz NOT NULL
tag             text  -- 'team'|'design'|'company'|'external'|'1on1'|'exec'|'product'
recurring_id    uuid REFERENCES recurring_bookings(id) NULL
status          text DEFAULT 'active'  -- 'active' | 'cancelled'
cancelled_at    timestamptz
created_at      timestamptz DEFAULT now()
```

### booking_attendees
```sql
booking_id  uuid REFERENCES bookings(id) ON DELETE CASCADE
user_id     uuid REFERENCES users(id)
PRIMARY KEY (booking_id, user_id)
```

### recurring_bookings
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
room_id     uuid REFERENCES rooms(id)
owner_id    uuid REFERENCES users(id)
title       text NOT NULL
rrule       text NOT NULL   -- RFC 5545 RRULE 문자열
duration    int NOT NULL    -- 분 단위
tag         text
status      text DEFAULT 'active'  -- 'active' | 'cancelled'
created_at  timestamptz DEFAULT now()
```

### user_favorites
```sql
user_id   uuid REFERENCES users(id)
room_id   uuid REFERENCES rooms(id)
created_at timestamptz DEFAULT now()
PRIMARY KEY (user_id, room_id)
```

---

## 6. Row Level Security (RLS) 정책

| 테이블 | 읽기 | 쓰기/수정 | 삭제 |
|--------|------|-----------|------|
| rooms | 모든 인증 사용자 | 관리자만 | 관리자만 |
| bookings | 모든 인증 사용자 | 본인 생성·수정, 본인+관리자 취소 | — |
| booking_attendees | 모든 인증 사용자 | 예약 owner만 | 예약 owner만 |
| users | 모든 인증 사용자 | 본인만 | — |
| recurring_bookings | 모든 인증 사용자 | 본인 생성·수정, 본인+관리자 취소 | — |
| user_favorites | 본인만 | 본인만 | 본인만 |

---

## 7. 페이지 구조 (App Router)

```
app/
├── (auth)/
│   └── login/              page.tsx  # MS OAuth + 테스트 계정 로그인
├── (app)/                  layout.tsx # 인증된 사용자 전용
│   ├── page.tsx            # 홈 대시보드
│   ├── search/
│   │   └── page.tsx        # 빠른 예약 검색
│   ├── bookings/
│   │   └── page.tsx        # 내 예약 (다가오는/지난/취소)
│   ├── recurring/
│   │   └── page.tsx        # 반복 예약 관리
│   └── rooms/
│       └── [id]/
│           └── page.tsx    # 회의실 상세
├── admin/                  layout.tsx # 관리자 전용
│   ├── page.tsx            # 관리자 대시보드 (사용률 통계)
│   ├── rooms/
│   │   └── page.tsx        # 회의실 CRUD
│   ├── bookings/
│   │   └── page.tsx        # 전체 예약 관리
│   └── users/
│       └── page.tsx        # 사용자 역할 관리
└── api/
    ├── auth/callback/      route.ts  # OAuth 콜백
    ├── bookings/           route.ts  # 예약 생성/수정/취소 (중복 검증 포함)
    └── recurring/          route.ts  # 반복 예약 일괄 생성
```

---

## 8. 핵심 비즈니스 로직

### 예약 중복 검증
```sql
SELECT id FROM bookings
WHERE room_id = $1
  AND status = 'active'
  AND start_at < $end_at
  AND end_at > $start_at
```
→ 결과 있으면 예약 불가. 클라이언트 + DB 레벨 이중 검증.

**Race Condition 방지**: 두 사용자가 동시에 같은 시간대를 예약할 경우를 대비해 PostgreSQL 배타적 제약(exclusion constraint)을 사용한다.
```sql
-- btree_gist 익스텐션 필요
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE bookings ADD CONSTRAINT no_double_booking
  EXCLUDE USING gist (
    room_id WITH =,
    tstzrange(start_at, end_at) WITH &&
  ) WHERE (status = 'active');
```

### 예약 수정/취소 제약
- 시작 시간이 이미 지난 예약은 수정·취소 불가 (UI에서 버튼 비활성화)
- 지난 예약 탭에서는 읽기 전용으로만 표시

### 반복 예약 처리
- `recurring_bookings`에 RRULE 저장
- 생성 시 향후 1년치 `bookings` 레코드 일괄 생성 (rrule.js 라이브러리 활용)
- **이 건만 수정**: 해당 `booking` 레코드만 수정 (recurring_id 유지)
- **이후 모두 수정**: 해당 날짜 이후 같은 recurring_id의 bookings 업데이트
- **전체 시리즈 수정**: `recurring_bookings` 업데이트 + 모든 하위 bookings 업데이트

### 추천 정렬 알고리즘
1. 즐겨찾기 회의실 우선
2. 요청 인원 대비 수용 인원 낭비 최소화 (capacity - requested 오름차순)
3. 층 근접성 (본인 desk 층 기준)

### 사용자 설정 동기화
- 최초 로드: DB → 클라이언트 상태
- 변경 시: 즉시 `localStorage` + Supabase `users` 테이블 업데이트
- 오프라인: `localStorage` 폴백

### Supabase Realtime
- 타임라인 뷰: `bookings` 테이블 변경 구독 → 실시간 업데이트
- 빠른 예약 결과 화면에서도 동일 적용

---

## 9. UI 보완 사항 (현재 미구현 항목)

| 컴포넌트 | 미구현 항목 | 구현 방향 |
|----------|-------------|-----------|
| BookingModal | 날짜 선택 달력 | react-day-picker 또는 native date input |
| BookingModal | 참석자 자동완성 | Supabase users 테이블 실시간 검색 |
| BookingModal | 수정 모드 | `mode: 'create' \| 'edit'` prop 추가 |
| Search | 날짜 선택 달력 | 동일 |
| Search | 찾기 버튼 실동작 | Supabase 쿼리 연동 |
| Search | 정렬 탭 실동작 | 클라이언트 정렬 로직 |
| MyBookings | 탭 전환 실동작 | status 필터 쿼리 |
| MyBookings | 편집/삭제 버튼 | onClick 핸들러 구현 |
| Recurring | 수정/삭제 버튼 | onClick 핸들러 + 수정 옵션 팝업 |
| RoomDetail | 즐겨찾기 하트 아이콘 | user_favorites 테이블 연동 |
| RoomDetail | 빠른 예약 버튼 | 시간별 분리 동작 |
| Topbar | 검색바 실동작 | ⌘K 단축키 + 검색 드롭다운 |
| Dashboard | 날짜 네비게이션 | 날짜 state 변경 + 쿼리 재요청 |

---

## 10. 개발 단계 (MVP 우선)

### Phase 1 — 기반 구축 (1주)
- [ ] Supabase 프로젝트 설정 + 스키마 생성 + RLS 설정
- [ ] Microsoft Azure AD OAuth 등록 + Supabase Auth 연동
- [ ] Next.js middleware (인증 게이트 + 관리자 라우트 보호)
- [ ] 테스트 계정 2개 생성 (일반, 관리자)
- [ ] 목업 데이터 Supabase에 시드

### Phase 2 — 데이터 연동 (1주)
- [ ] 회의실 목록/타임라인 실시간 조회 (Supabase Realtime)
- [ ] 대시보드 KPI 실 데이터 연동
- [ ] 날짜 네비게이션 동작

### Phase 3 — 예약 CRUD (1주)
- [ ] 예약 생성 (달력 피커 + 참석자 자동완성 + 중복 검증)
- [ ] 예약 수정 (BookingModal edit 모드)
- [ ] 예약 취소 (단건 / 반복 시리즈 옵션)
- [ ] 반복 예약 생성 (rrule.js + 일괄 생성 API)

### Phase 4 — 부가 기능 (0.5주)
- [ ] 즐겨찾기 (하트 아이콘 + user_favorites 연동)
- [ ] 빠른 예약 검색 실동작 + 정렬
- [ ] 사용자 설정 저장 (다크모드, 컬러테마)
- [ ] 글로벌 검색 (⌘K)
- [ ] 내 예약 / 관리자 예약 목록 페이지네이션 (20건씩)

### Phase 5 — 관리자 (0.5주)
- [ ] 관리자 페이지 (/admin)
- [ ] 회의실 CRUD + 이미지 업로드 (Supabase Storage)
- [ ] 전체 예약 관리 + 사용자 역할 관리
- [ ] 사용률 통계

### Phase 6 — 배포 (0.5주)
- [ ] Vercel 배포 설정
- [ ] 환경변수 설정
- [ ] 도메인 연결

---

## 11. 환경 변수

```env
# Next.js 앱 (공개 가능)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# 서버 전용 (절대 클라이언트 노출 금지)
SUPABASE_SERVICE_ROLE_KEY=
```

> Azure AD OAuth (클라이언트 ID, 시크릿, 테넌트 ID)는 **Supabase 대시보드 → Authentication → Providers → Azure**에서 직접 설정. Next.js 환경변수로 노출 불필요.

---

## 12. 주요 라이브러리

| 라이브러리 | 용도 |
|-----------|------|
| @supabase/supabase-js | Supabase 클라이언트 |
| @supabase/ssr | Next.js App Router SSR 지원 |
| rrule | 반복 예약 RRULE 생성/파싱 |
| react-day-picker | 달력 날짜 선택 |
| date-fns | 날짜 계산 유틸리티 |
