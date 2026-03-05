import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { User } from "@/lib/types";

export function employeeNoFromUser(user: User): string {
  if (user.id === "admin") return "admin";
  const matched = user.id.match(/\d+/);
  return matched ? matched[0] : "";
}

export function defaultPasswordForUser(user: User): string {
  return user.id === "admin" ? "admin" : employeeNoFromUser(user);
}

export function verifyCredential(user: User, password: string): boolean {
  const stored = user.password || defaultPasswordForUser(user);
  return stored === password;
}

export function toPublicUser(user: User): User {
  const { password, ...safe } = user;
  return safe;
}

export function getActorFromRequest(req: Request): User | null {
  const actorId = req.headers.get("x-actor-id");
  if (!actorId) return null;
  return db.users.find((u) => u.id === actorId) || null;
}

export function unauthorized(message = "인증이 필요합니다.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "권한이 없습니다.") {
  return NextResponse.json({ error: message }, { status: 403 });
}
