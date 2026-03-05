import { NextResponse } from "next/server";
import { db, ensureDbReady, persistDbState } from "@/lib/db";
import { defaultPasswordForUser, employeeNoFromUser } from "@/lib/auth";

type ResetPasswordBody = {
  employeeNo?: string;
};

export async function POST(req: Request) {
  await ensureDbReady();
  const body = (await req.json()) as ResetPasswordBody;
  const employeeNo = (body.employeeNo || "").trim().toLowerCase();
  if (!employeeNo) {
    return NextResponse.json({ error: "사원번호를 입력해 주세요." }, { status: 400 });
  }

  const user = db.users.find((u) => employeeNoFromUser(u) === employeeNo);
  if (!user) {
    return NextResponse.json({ error: "해당 사원번호 계정을 찾을 수 없습니다." }, { status: 404 });
  }

  user.password = defaultPasswordForUser(user);
  await persistDbState();
  return NextResponse.json({
    ok: true,
    message: "비밀번호가 개인 사번으로 초기화되었습니다.",
  });
}
