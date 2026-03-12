#!/bin/bash
# Vercel 연동 스크립트
# 1. npx vercel login (최초 1회)
# 2. npx vercel link (프로젝트 연결)
# 3. npx vercel env pull .env.local (환경변수 가져오기)

echo "=== Vercel 연동 ==="
echo ""
echo "1. 로그인 확인..."
npx vercel whoami 2>/dev/null || { echo "먼저 'npx vercel login' 실행 후 GitHub 등으로 로그인하세요."; exit 1; }
echo ""
echo "2. 프로젝트 연결..."
npx vercel link
echo ""
echo "3. 환경변수 가져오기..."
npx vercel env pull .env.local
echo ""
echo "✓ 완료. .env.local 에 Vercel 환경변수가 저장되었습니다."
