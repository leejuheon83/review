import { NextResponse } from "next/server";
import { db, ensureDbReady } from "@/lib/db";
import { toPublicUser } from "@/lib/auth";

export async function GET() {
  await ensureDbReady();
  return NextResponse.json({
    actors: db.users
      .filter((user) => user.role === "MANAGER" || user.id === "admin")
      .map(toPublicUser),
  });
}
