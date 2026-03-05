import { NextResponse } from "next/server";
import { db, ensureDbReady } from "@/lib/db";

export async function GET() {
  await ensureDbReady();
  return NextResponse.json({ items: db.teams });
}
