"use client";

import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useActor } from "@/components/actor-provider";
import { apiFetch } from "@/lib/client-api";
import type { User } from "@/lib/types";

function LoginContent() {
  const { actors, actor, setActorId, loading } = useActor();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [employeeNo, setEmployeeNo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [helperMessage, setHelperMessage] = useState("");
  const [changeOpen, setChangeOpen] = useState(false);
  const [changeEmployeeNo, setChangeEmployeeNo] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changeError, setChangeError] = useState("");
  const [changeMessage, setChangeMessage] = useState("");

  useEffect(() => {
    if (!loading && actor) {
      router.replace(searchParams.get("next") || "/");
    }
  }, [actor, loading, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setHelperMessage("");
    try {
      const res = await apiFetch<{ actor: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          employeeNo: employeeNo.trim(),
          password: password.trim(),
        }),
      });
      setActorId(res.actor.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setChangeError("");
    setChangeMessage("");
    if (!changeEmployeeNo.trim()) {
      setChangeError("사원번호를 입력해 주세요.");
      return;
    }
    try {
      await apiFetch<{ ok: boolean }>("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          employeeNo: changeEmployeeNo.trim(),
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });
      setChangeMessage("비밀번호가 변경되었습니다.");
      setChangeEmployeeNo("");
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setChangeOpen(false), 800);
    } catch (err) {
      setChangeError(err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다.");
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setHelperMessage("");
    if (!employeeNo.trim()) {
      setError("사원번호를 입력한 뒤 비밀번호 초기화를 눌러 주세요.");
      return;
    }
    try {
      const result = await apiFetch<{ message: string }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          employeeNo: employeeNo.trim(),
        }),
      });
      setHelperMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 초기화에 실패했습니다.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-6">
      <div className="font-sbs-trust-regular w-full max-w-[560px] rounded-[22px] border border-slate-200 bg-white px-12 py-10 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
        <div className="flex justify-center">
          <Image src="/sbs-mnc-ci.png" alt="SBS M&C" width={190} height={62} className="h-auto w-[190px]" />
        </div>

        <div className="mt-5 flex justify-center">
          <Image
            src="/team-review-title.jpg"
            alt=""
            width={120}
            height={90}
            className="h-auto w-[120px] object-contain"
          />
        </div>

        <form onSubmit={handleSubmit} className="mx-auto mt-10 w-full max-w-[760px] space-y-5">
          <div>
            <label htmlFor="employeeNo" className="mb-3 block text-[22px] font-medium tracking-[-0.02em] text-[#8199B8]">
              사원번호
            </label>
            <input
              id="employeeNo"
              value={employeeNo}
              onChange={(e) => setEmployeeNo(e.target.value.slice(0, 20))}
              placeholder="사번을 입력하세요 (예: 120032)"
              className="mx-auto block h-[72px] w-[96%] rounded-2xl border border-[#C9D5E6] px-6 text-[25px] tracking-[-0.02em] text-[#1E3A5F] placeholder:text-[20px] placeholder:text-[#A2B1C7] focus:border-[#0070C9] focus:outline-none"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-3 block text-[22px] font-medium tracking-[-0.02em] text-[#8199B8]">
              비밀번호
            </label>
            <input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value.slice(0, 20))}
              type="password"
              placeholder="비밀번호를 입력하세요"
              className="mx-auto block h-[72px] w-[96%] rounded-2xl border border-[#C9D5E6] px-6 text-[25px] tracking-[-0.02em] text-[#1E3A5F] placeholder:text-[20px] placeholder:text-[#A2B1C7] focus:border-[#0070C9] focus:outline-none"
              autoComplete="current-password"
              required
            />
            <div className="mx-auto mt-2 flex w-[96%] justify-end gap-3 text-sm text-slate-500">
              <button
                type="button"
                onClick={() => {
                  setChangeOpen(true);
                  setChangeError("");
                  setChangeMessage("");
                  setChangeEmployeeNo(employeeNo.trim());
                }}
                className="hover:text-slate-700"
              >
                비밀번호 변경
              </button>
              <span>|</span>
              <button
                type="button"
                onClick={() => void handleResetPassword()}
                className="hover:text-slate-700"
              >
                비밀번호 초기화
              </button>
            </div>
          </div>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {helperMessage ? <p className="text-sm text-slate-500">{helperMessage}</p> : null}

          <button
            type="submit"
            disabled={loading || actors.length === 0}
            className="mx-auto mt-2 block h-[72px] w-[96%] rounded-2xl bg-[#0059A8] text-[22px] font-semibold tracking-[-0.02em] text-white transition hover:bg-[#004A8C] disabled:cursor-not-allowed disabled:opacity-50"
          >
            로그인
          </button>
        </form>

        <div className="mx-auto mt-9 max-w-[760px] border-t border-slate-200 pt-6 text-center text-[18px] tracking-[-0.02em] text-[#9BAAC1]">
          로그인 관련 문의: 경영지원팀 (내선 2828)
        </div>

        {changeOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
            <form onSubmit={handleChangePassword} className="w-full max-w-md rounded-xl bg-white p-5">
              <h3 className="text-lg font-semibold text-slate-900">비밀번호 변경</h3>
              <div className="mt-3 space-y-2">
                <input
                  value={changeEmployeeNo}
                  onChange={(e) => setChangeEmployeeNo(e.target.value.slice(0, 20))}
                  placeholder="사원번호"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  required
                />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="현재 비밀번호"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  required
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="변경할 비밀번호 (4~32자)"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  required
                />
              </div>
              {changeError ? <p className="mt-2 text-sm text-rose-600">{changeError}</p> : null}
              {changeMessage ? <p className="mt-2 text-sm text-emerald-700">{changeMessage}</p> : null}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setChangeOpen(false)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm"
                >
                  취소
                </button>
                <button className="rounded-lg bg-[#0070C9] px-4 py-2 text-sm font-semibold text-white">
                  변경
                </button>
              </div>
            </form>
          </div>
        ) : null}

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">로딩 중...</div>}>
      <LoginContent />
    </Suspense>
  );
}
