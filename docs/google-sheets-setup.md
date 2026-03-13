# Google Sheets 2중 관리 설정

Firebase와 함께 Google Sheets에 DB 상태를 동시 저장하여 데이터 이중화(2중 관리)를 구현합니다.

## 동작 방식

- **저장**: Firebase 저장 성공 시, 동시에 Google Sheets에도 저장
- **로드**: Firebase → REST API → Google Sheets 순으로 시도 (첫 번째 성공 시 사용)
- **목적**: Firebase 장애 시 Google Sheets에서 복구 가능

## 1. Google Cloud 설정

### 1.1 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 또는 새 프로젝트 생성
3. **API 및 서비스** → **라이브러리** → "Google Sheets API" 검색 → **사용 설정**

### 1.2 서비스 계정 생성

1. **API 및 서비스** → **사용자 인증 정보**
2. **사용자 인증 정보 만들기** → **서비스 계정**
3. 이름 입력 후 생성
4. **키** 탭 → **키 추가** → **새 비공개 키** → JSON 선택 → 다운로드

### 1.3 JSON에서 값 추출

다운로드한 JSON에서:
- `client_email` → `GOOGLE_CLIENT_EMAIL`
- `private_key` → `GOOGLE_PRIVATE_KEY` (줄바꿈 `\n` 유지)

또는 전체 JSON을 한 줄로: `GOOGLE_SERVICE_ACCOUNT_JSON`

## 2. Google 시트 생성

1. [Google Sheets](https://sheets.google.com/)에서 새 스프레드시트 생성
2. **URL에서 스프레드시트 ID 복사**  
   예: `https://docs.google.com/spreadsheets/d/1abc...xyz/edit` → `1abc...xyz`
3. **시트 탭**: 새 시트 추가 후 이름을 `DBState`로 지정  
   (기본 "Sheet1" 사용 시 `GOOGLE_SHEET_NAME=Sheet1` 설정)
4. **공유** → 서비스 계정 이메일(`client_email`) 추가 → **편집자** 권한 부여

## 3. 환경변수 등록

| 변수명 | 설명 |
|--------|------|
| `GOOGLE_SPREADSHEET_ID` | 스프레드시트 ID (URL의 `/d/` 다음 부분) |
| `GOOGLE_CLIENT_EMAIL` | 서비스 계정 이메일 |
| `GOOGLE_PRIVATE_KEY` | 서비스 계정 private_key |
| `GOOGLE_SHEET_NAME` | (선택) 시트 탭 이름, 기본값 `DBState` |

**대안**: `GOOGLE_SERVICE_ACCOUNT_JSON` 전체 JSON 문자열

## 4. Vercel 환경변수

Vercel 대시보드 → 프로젝트 → **Settings** → **Environment Variables**에 위 변수 추가.

## 5. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| Sheets 저장 실패 | 시트 미공유 | 스프레드시트를 서비스 계정 이메일과 공유 |
| `The caller does not have permission` | Sheets API 미활성화 | Google Cloud에서 Sheets API 사용 설정 |
| 시트를 찾을 수 없음 | 탭 이름 불일치 | `GOOGLE_SHEET_NAME`으로 시트 탭 이름 확인 |
