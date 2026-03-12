#!/usr/bin/env node
/**
 * 환경변수 설정 안내
 * - .env.local 이 없으면 .env.example 을 복사
 * - Vercel 연동 시 필요한 변수 안내
 */
const fs = require("fs");
const path = require("path");

const envLocal = path.join(process.cwd(), ".env.local");
const envExample = path.join(process.cwd(), ".env.example");

if (!fs.existsSync(envLocal) && fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, envLocal);
  console.log("✓ .env.local 생성됨 (.env.example 복사)");
  console.log("  → .env.local 에 Firebase 값 채운 뒤 npm run dev 실행");
} else if (fs.existsSync(envLocal)) {
  console.log("✓ .env.local 이미 존재");
} else {
  console.log("⚠ .env.example 이 없습니다.");
}

console.log("\n[Vercel 연동]");
console.log("1. Vercel 대시보드 → 프로젝트 → Settings → Environment Variables");
console.log("2. .env.example 참고하여 아래 변수 추가:");
console.log("   - NEXT_PUBLIC_FIREBASE_* (클라이언트)");
console.log("   - FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
console.log("   - FIREBASE_DATABASE_URL");
console.log("3. 또는: npm run vercel:env:pull (Vercel에 이미 설정된 경우)");
console.log("");
