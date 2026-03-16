import { NextResponse } from "next/server";
import { db, ensureDbReady } from "@/lib/db";
import { toPublicUser } from "@/lib/auth";

export async function GET() {
  try {
    await ensureDbReady();
    return NextResponse.json({
      actors: db.users
        .filter((user) => user.role === "MANAGER" || user.id === "admin")
        .map(toPublicUser),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "actors GET failed";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
