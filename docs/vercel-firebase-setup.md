# Firebase + Vercel 연동 가이드

이 문서는 team-review 프로젝트를 Firebase와 Vercel에 연동하는 방법을 설명합니다.

## 1. Firebase 프로젝트 설정

### 1.1 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. **프로젝트 추가** 또는 기존 프로젝트 선택
3. 프로젝트 ID 확인 (예: `review-coaching`)

### 1.2 Realtime Database 생성

1. Firebase Console → **빌드** → **Realtime Database**
2. **데이터베이스 만들기** 클릭
3. 리전 선택 (예: `asia-southeast1`)
4. **테스트 모드로 시작** 또는 **규칙으로 시작** 선택 후 생성
5. **데이터베이스 URL** 복사 (예: `https://review-coaching-default-rtdb.asia-southeast1.firebasedatabase.app/`)

### 1.3 웹 앱 등록 (클라이언트 설정)

1. 프로젝트 설정 → **일반** → **내 앱** → **웹 앱 추가** (</> 아이콘)
2. 앱 닉네임 입력 후 등록
3. **Firebase SDK 설정**에서 `config` 객체 값 복사:
   - `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `storageBucket` → `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `databaseURL` → `NEXT_PUBLIC_FIREBASE_DATABASE_URL`

### 1.4 서비스 계정 키 발급 (서버 Admin SDK)

1. 프로젝트 설정 → **서비스 계정** 탭
2. **새 비공개 키 생성** 클릭 → JSON 파일 다운로드
3. JSON 파일에서 다음 값 추출:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (줄바꿈 `\n` 유지)

> ⚠️ **보안**: 서비스 계정 JSON 파일은 절대 Git에 커밋하지 마세요.

---

## 2. Vercel 프로젝트 설정

### 2.1 프로젝트 연결

```bash
# Vercel CLI로 프로젝트 연결
npm run vercel:link
```

또는 [Vercel 대시보드](https://vercel.com/dashboard)에서 GitHub 저장소 Import.

### 2.2 환경변수 등록

Vercel 대시보드 → 프로젝트 → **Settings** → **Environment Variables**

| 변수명 | 설명 | 환경 |
|--------|------|------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API 키 | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | 인증 도메인 | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | 프로젝트 ID | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | 스토리지 버킷 | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | 메시징 발신자 ID | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | 앱 ID | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Realtime DB URL | Production, Preview, Development |
| `FIREBASE_PROJECT_ID` | 서비스 계정 project_id | Production, Preview, Development |
| `FIREBASE_CLIENT_EMAIL` | 서비스 계정 client_email | Production, Preview, Development |
| `FIREBASE_PRIVATE_KEY` | 서비스 계정 private_key | Production, Preview, Development |
| `FIREBASE_DATABASE_URL` | Realtime DB URL | Production, Preview, Development |

**FIREBASE_PRIVATE_KEY 입력 시 주의:**
- JSON의 `private_key` 값을 그대로 복사
- 줄바꿈은 `\n`으로 유지 (실제 줄바꿈 X)
- 따옴표로 감싸서 입력: `"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"`

**대안: JSON 전체 사용**
- `FIREBASE_SERVICE_ACCOUNT_JSON`: 서비스 계정 JSON 전체를 한 줄 문자열로
- `FIREBASE_DATABASE_URL`: 별도로 필수

### 2.3 환경변수 Pull (로컬 개발용)

```bash
# Vercel에 등록된 환경변수를 .env.local로 가져오기
npm run vercel:env:pull
```

---

## 3. GitHub Actions 자동 배포 (선택)

`master` 브랜치 push 시 Firebase Rules + Vercel 자동 배포를 사용하려면:

**GitHub Secrets 등록** (저장소 Settings → Secrets and variables → Actions):

| 시크릿 | 설명 |
|--------|------|
| `FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID |
| `FIREBASE_TOKEN` | `firebase login:ci`로 발급 |
| `VERCEL_TOKEN` | Vercel 대시보드 → Settings → Tokens |
| `VERCEL_ORG_ID` | `vercel whoami` 또는 프로젝트 설정에서 확인 |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트 ID |

---

## 4. 배포 후 확인

1. Vercel 배포 URL 접속
2. 로그인 후 피드백/면담 기록 작성
3. 새로고침 후 데이터 유지 확인 (Firebase 저장 여부)

---

## 5. Google Sheets 2중 관리 (선택)

Firebase와 동시에 Google Sheets에 저장하여 데이터 이중화. [docs/google-sheets-setup.md](google-sheets-setup.md) 참고.

---

## 6. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| 저장 후 데이터 사라짐 | 환경변수 미설정 | Vercel에 `FIREBASE_*` 변수 추가 후 재배포 |
| `DB 저장소가 설정되지 않았습니다` | Admin SDK 변수 누락 | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_DATABASE_URL` 확인 |
| 환경변수 undefined | `NEXT_PUBLIC_` 누락 | 클라이언트용 변수는 반드시 `NEXT_PUBLIC_` 접두사 |
| 배포 후 변수 반영 안 됨 | 캐시 | Vercel에서 **Redeploy** 실행 |
| Google Sheets 저장 실패 | 시트 미공유 | [google-sheets-setup.md](google-sheets-setup.md) 참고 |
