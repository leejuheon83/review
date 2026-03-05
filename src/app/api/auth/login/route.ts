import { NextResponse } from "next/server";
import { ensureDbReady, db } from "@/lib/db";
import { employeeNoFromUser, toPublicUser, verifyCredential } from "@/lib/auth";

type LoginBody = {
  employeeNo?: string;
  password?: string;
};

export async function POST(req: Request) {
  await ensureDbReady();
  const body = (await req.json()) as LoginBody;
  const employeeNo = (body.employeeNo || "").trim();
  const password = (body.password || "").trim();

  if (!employeeNo || !password) {
    return NextResponse.json({ error: "사번과 비밀번호를 입력해 주세요." }, { status: 400 });
  }

  const candidates = db.users.filter((u) => u.role === "MANAGER" || u.id === "admin");
  const user = candidates.find((u) => employeeNoFromUser(u) === employeeNo.toLowerCase());
  if (!user || !verifyCredential(user, password)) {
    return NextResponse.json({ error: "사번 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  return NextResponse.json({ actor: toPublicUser(user) });
}
