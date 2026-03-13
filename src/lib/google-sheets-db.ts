/**
 * Google Sheets as secondary DB storage for dual management (2중 관리)
 * Persists DBState to a Google Sheet alongside Firebase.
 */

import { google } from "googleapis";
import type { DBState } from "@/lib/types";

const CELL_LIMIT = 49_000;

function getSheetName(): string {
  return process.env.GOOGLE_SHEET_NAME || "DBState";
}

function getCredentials():
  | { client_email: string; private_key: string }
  | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { client_email?: string; private_key?: string };
      if (parsed.client_email && parsed.private_key) {
        return {
          client_email: parsed.client_email,
          private_key: parsed.private_key.replace(/\\n/g, "\n"),
        };
      }
    } catch {
      return null;
    }
  }

  const email = process.env.GOOGLE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, "\n");
  if (!email || !key) return null;
  return { client_email: email, private_key: key };
}

export function isGoogleSheetsEnabled(): boolean {
  return Boolean(getCredentials()) && Boolean(process.env.GOOGLE_SPREADSHEET_ID);
}

function chunkString(str: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size));
  }
  return chunks;
}

export async function writeDbStateToSheets(state: DBState): Promise<void> {
  const creds = getCredentials();
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!creds || !spreadsheetId) return;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const json = JSON.stringify(state);
  const chunks = chunkString(json, CELL_LIMIT);

  const sheetName = getSheetName();
  const range = `${sheetName}!A1:A${chunks.length}`;
  const values = chunks.map((c) => [c]);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

export async function readDbStateFromSheets(): Promise<DBState | null> {
  const creds = getCredentials();
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!creds || !spreadsheetId) return null;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  try {
    const sheetName = getSheetName();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:A5000`,
    });
    const rows = res.data.values as string[][] | undefined;
    if (!rows?.length) return null;

    const json = rows.map((r) => r[0] ?? "").join("");
    if (!json.trim()) return null;

    return JSON.parse(json) as DBState;
  } catch {
    return null;
  }
}
