#!/usr/bin/env node
/**
 * Google Sheets 2중 관리용 스프레드시트 생성
 * .env.local 의 Firebase 서비스 계정으로 시트 생성 후 ID 출력
 */
const fs = require("fs");
const path = require("path");
try {
  const envPath = path.join(process.cwd(), ".env.local");
  fs.readFileSync(envPath, "utf8").split("\n").forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1].trim()] = v;
    }
  });
} catch {}
const { google } = require("googleapis");

function getCreds() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try {
      const p = JSON.parse(raw);
      return { email: p.client_email, key: (p.private_key || "").replace(/\\n/g, "\n") };
    } catch {}
  }
  const email = process.env.GOOGLE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (email && key) return { email, key };
  return null;
}

async function main() {
  const creds = getCreds();
  if (!creds) {
    console.error("GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY 또는 FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY 필요");
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: creds.email, private_key: creds.key },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: "Team Review DB Backup (2중 관리)" },
      sheets: [{ properties: { title: "DBState" } }],
    },
  });

  const id = res.data.spreadsheetId;
  const url = res.data.spreadsheetUrl;
  console.log("생성됨:", url);
  console.log("GOOGLE_SPREADSHEET_ID=" + id);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
