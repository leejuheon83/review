# Vercel 연동 스크립트 (PowerShell)
# 1. npx vercel login (최초 1회)
# 2. npx vercel link (프로젝트 연결)
# 3. npx vercel env pull .env.local (환경변수 가져오기)

Write-Host "=== Vercel 연동 ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. 로그인 확인..."
$whoami = npx vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "먼저 'npx vercel login' 실행 후 GitHub 등으로 로그인하세요." -ForegroundColor Yellow
    exit 1
}
Write-Host ""

Write-Host "2. 프로젝트 연결..."
npx vercel link
Write-Host ""

Write-Host "3. 환경변수 가져오기..."
npx vercel env pull .env.local
Write-Host ""

Write-Host "완료. .env.local 에 Vercel 환경변수가 저장되었습니다." -ForegroundColor Green
