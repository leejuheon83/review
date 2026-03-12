#!/usr/bin/env node
/**
 * 피드백·노트·요약·리더십·미팅 데이터 초기화
 * - 로컬: npm run reset:feedback (localhost, npm run dev 필요)
 * - 프로덕션: npm run reset:feedback:prod (배포 URL 직접 호출)
 */
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const envPath = path.join(process.cwd(), ".env.local");
let secret = "dev-reset";
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  const match = content.match(/RESET_SECRET=(.+)/);
  if (match) secret = match[1].trim().replace(/^["']|["']$/g, "");
}

const isProd = process.argv.includes("--prod") || process.env.RESET_TARGET === "prod";
const baseUrl = process.env.RESET_BASE_URL || "https://sbsmc-team-review.vercel.app";
const url = isProd ? new URL("/api/admin/reset-feedback", baseUrl) : null;
const port = process.env.PORT || 3000;

const options = isProd
  ? {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: { "x-reset-secret": secret },
      ...(url.protocol === "https:" && { port: 443 }),
    }
  : {
      hostname: "localhost",
      port,
      path: "/api/admin/reset-feedback",
      method: "POST",
      headers: { "x-reset-secret": secret },
    };

const requestModule = isProd && url.protocol === "https:" ? https : http;

const req = requestModule.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    if (res.statusCode === 200) {
      try {
        const json = data ? JSON.parse(data) : {};
        console.log("✓", json.message || "초기화 완료");
      } catch {
        console.log("✓ 초기화 완료");
      }
      return;
    }
    let errMsg = `HTTP ${res.statusCode}`;
    try {
      const json = data ? JSON.parse(data) : {};
      if (json.error) errMsg = json.detail ? `${json.error}: ${json.detail}` : json.error;
    } catch {
      /* ignore */
    }
    console.error("✗", errMsg);
    if (res.statusCode === 404) {
      console.error("  → reset API가 배포되지 않았습니다. 이 코드를 push한 뒤 배포 완료 후 재시도하세요.");
    }
    if (res.statusCode === 401) {
      console.error("  → Vercel 환경변수 RESET_SECRET과 .env.local의 값이 일치하는지 확인하세요.");
    }
    if (res.statusCode === 500) {
      console.error("  → Vercel에 FIREBASE_* 환경변수가 설정되어 있는지 확인하세요.");
    }
    process.exit(1);
  });
});

req.on("error", (err) => {
  console.error("✗ 연결 실패.", isProd ? "배포 URL을 확인하세요." : "개발 서버가 실행 중인지 확인하세요. (npm run dev)");
  console.error("  ", err.message);
  process.exit(1);
});

req.end();
