import { NextResponse } from "next/server";
import { db, ensureDbReady, mutateDbWithTransaction } from "@/lib/db";
import { employeeNoFromUser, verifyCredential } from "@/lib/auth";

type ChangePasswordBody = {
  employeeNo?: string;
  currentPassword?: string;
  newPassword?: string;
};

export async function POST(req: Request) {
  await ensureDbReady();
  const body = (await req.json()) as ChangePasswordBody;
  const employeeNo = (body.employeeNo || "").trim().toLowerCase();
  const currentPassword = (body.currentPassword || "").trim();
  const newPassword = (body.newPassword || "").trim();

  if (!employeeNo || !currentPassword || !newPassword) {
    return NextResponse.json({ error: "필수값이 누락되었습니다." }, { status: 400 });
  }
  if (newPassword.length < 4 || newPassword.length > 32) {
    return NextResponse.json({ error: "새 비밀번호는 4~32자로 입력해 주세요." }, { status: 400 });
  }

  const candidates = db.users.filter((u) => u.role === "MANAGER" || u.id === "admin");
  const user = candidates.find((u) => employeeNoFromUser(u) === employeeNo);
  if (!user || !verifyCredential(user, currentPassword)) {
    return NextResponse.json({ error: "현재 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const userId = user.id;
  await mutateDbWithTransaction((state) => {
    const users = Array.isArray(state.users) ? [...state.users] : [];
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return state;
    users[idx] = { ...users[idx], password: newPassword };
    return { ...state, users };
  });
  return NextResponse.json({ ok: true });
}
