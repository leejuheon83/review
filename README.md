# Coaching Log (MVP)

팀장의 수시 코칭/피드백 기록과 HR 분석/내보내기를 제공하는 사내 MVP입니다.

## 실행 방법

1. 의존성 설치

```bash
npm install
```

2. (선택) Firebase 연동 환경변수 설정

`.env.local`에 아래 항목을 추가하면 Firestore를 영구 저장소로 사용합니다.
설정이 없으면 기존 메모리 시드 DB로 동작합니다.
서비스 계정 키가 없더라도 `FIREBASE_DATABASE_URL`만 있으면 Realtime Database REST로 상태를 저장합니다.

```bash
# Firebase Web SDK (client)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCljdsQOAlvQsIBX7MzqP0w9tRMiA6kkHA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=review-coaching.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=review-coaching
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=review-coaching.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=310921105158
NEXT_PUBLIC_FIREBASE_APP_ID=1:310921105158:web:0269b83ecb8ef0b8545887
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://review-coaching-default-rtdb.asia-southeast1.firebasedatabase.app/

# Firebase Admin SDK (server)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://review-coaching-default-rtdb.asia-southeast1.firebasedatabase.app/
```

또는 단일 JSON 문자열 방식:

```bash
FIREBASE_SERVICE_ACCOUNT_JSON='{"project_id":"...","client_email":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"}'
```

3. 개발 서버 실행

```bash
npm run dev
```

4. 브라우저 접속

- `http://localhost:3000`

## 테스트 로그인 방법

`/login`에서 아래 계정으로 로그인합니다.

- 팀장 계정: `사번 / 사번` (예: `120032 / 120032`)
- 관리자 계정: `admin / admin`

## 주요 화면

- `/` Dashboard
  - 빠른 기록 3단계(팀원 선택 → 유형 선택 → 메모 입력)
  - AI 추천 멘트(상황 설명 기반 3개 문장 추천, 다시 생성, 클릭 시 메모 자동 입력)
  - 최근 피드백 피드
- `/members`
  - 팀원 목록/추가/활성 상태 변경
  - 이름 클릭 시 팀원 정보 팝업
- `/members/[id]`
  - 피드백 작성/필터/수정/삭제
  - AI 요약 카드(기간/유형/태그 기준 요약 생성, 재생성, 복사, 사용 로그 하이라이트)
  - 1:1 Prep 탭(핀 목록, Next Action)
- `/hr`
  - 팀장 활동률
  - 유형 분포
  - Export(CSV)

## API / 라우트 목록

- `GET /api/auth/actors` 테스트 로그인 사용자 목록
- `GET /api/members` 팀원 목록 조회
- `POST /api/members` 팀원 생성 (팀장)
- `GET /api/members/:id` 팀원 상세 조회
- `PATCH /api/members/:id` 팀원 활성/비활성 변경 (팀장)
- `GET /api/logs` 피드백 로그 조회(기간/유형/태그/검색/정렬)
- `POST /api/logs` 피드백 로그 생성 (팀장)
- `POST /api/suggestions/phrases` AI 추천 멘트 3개 생성
- `PATCH /api/logs/:id` 피드백 수정 (작성 팀장)
- `DELETE /api/logs/:id` 피드백 삭제 (작성 팀장)
- `POST /api/summaries/employee` 팀원 AI 요약 생성/캐시 조회
- `GET /api/member-notes/:memberId` 1:1 액션 메모 조회
- `PATCH /api/member-notes/:memberId` 1:1 액션 메모 저장 (팀장)
- `GET /api/hr/summary` HR 요약 지표
- `GET /api/hr/export` CSV 내보내기

## 권한 규칙

- Manager
  - 본인 팀원(`employee.managerId === actor.id`)만 접근
  - 본인 작성 로그만 수정/삭제 가능
  - AI 추천 멘트는 본인 팀원에 대해서만 생성 가능
- HR
  - 전체 팀/팀원/로그 조회 가능
  - 대시보드/Export 가능
  - 모든 팀원 AI 요약 생성 가능

## AI 요약 기능 (MVP)

- 위치: `/members/[id]` 상단 `AI 요약` 카드
- 입력: 기간(기본 최근 30일), 유형(선택), 태그(선택)
- 액션: `요약 생성`, `재생성`, `복사`, `사용된 로그 보기`
- 출력 형식:
  - `[강점]`
  - `[성장 포인트]`
  - `[다음 코칭 액션]`
  - `[근거]` (유형 분포/상위 태그/인용 최대 2개)

### 안전 가드레일

- 중립/사실 기반 요약만 생성
- 성격, 정신건강, 사생활, 보호 특성에 대한 추론 금지
- 로그 2건 미만이면 안내 문구 반환:
  - `요약할 기록이 충분하지 않습니다. 최근 코칭 로그를 2건 이상 남긴 뒤 다시 시도해 주세요.`

### 캐시/성능 규칙

- 같은 팀원 + 같은 필터 + 같은 source 로그면 캐시 반환
- 로그 변경(추가/수정/삭제) 시 source fingerprint가 달라져 재생성
- 프롬프트 입력은 로그 최대 30건, 메모는 각 300자 이내로 제한

## 시드 데이터

- 팀 2개
- 매니저 2명
- 팀원 6명
- 유형이 섞인 피드백 로그 다수

## 테스트 시나리오 체크

- Manager A가 Manager B 팀원 로그 접근 시 차단
- 메모 5~200자 제한 확인
- 필터(유형/태그/기간/핀) 동작 확인
- Export CSV 컬럼 확인: `date, manager, employee, type, memo, tags`

## AI 추천 멘트 (MVP)

- 위치: 대시보드 `빠른 기록` 카드
- 입력:
  - 팀원 선택(필수)
  - 피드백 유형(필수)
  - 상황 설명(선택, 120자 제한)
- 동작:
  - `AI 추천 멘트` 클릭 시 추천 문장 3개 생성
  - 문장 카드 클릭 시 메모 입력창 자동 채움
  - 자동 저장 없음(팀장이 확인 후 저장)
- 안전 규칙:
  - 행동 기반 문장만 생성
  - 성격/사생활/보호특성/징계·보상 판단 문구 생성 금지
