#!/usr/bin/env node
/**
 * 환경변수 설정 안내
 * - .env.local 이 없으면 .env.example 을 복사
 * - Firebase + Vercel 연동 가이드: docs/vercel-firebase-setup.md
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

console.log("\n[Firebase + Vercel 연동]");
console.log("  상세 가이드: docs/vercel-firebase-setup.md");
console.log("");
console.log("  로컬: .env.local 에 Firebase 변수 추가");
console.log("  Vercel: Settings > Environment Variables 에 동일 변수 추가");
console.log("  Vercel 변수 Pull: npm run vercel:env:pull");
console.log("  프로젝트 연결: npm run vercel:link");
console.log("");
