"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useActor } from "@/components/actor-provider";
import { apiFetch } from "@/lib/client-api";
import type { Team } from "@/lib/types";

function navClass(active: boolean): string {
  return active
    ? "block rounded-lg px-4 py-3 text-sm font-medium transition bg-blue-600 text-white"
    : "block rounded-lg px-4 py-3 text-sm font-medium transition text-gray-700 hover:bg-gray-100";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { actor, logout } = useActor();
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadTeams = async () => {
      const res = await apiFetch<{ items: Team[] }>("/api/teams");
      if (cancelled) return;
      setTeams(res.items);
    };
    void loadTeams();
    return () => {
      cancelled = true;
    };
  }, []);

  const teamName = useMemo(() => {
    if (!actor?.teamId) return "";
    return teams.find((team) => team.id === actor.teamId)?.name || "";
  }, [actor?.teamId, teams]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
          <Image
            src="/sbs-mnc-ci.png"
            alt="SBS M&C CI"
            width={132}
            height={44}
            priority
            className="h-11 w-auto object-contain"
          />
          <div className="text-right">
            <p className="text-base font-semibold text-slate-900">
              {teamName ? `${teamName} / ${actor?.name}` : actor?.name}
            </p>
            <button
              type="button"
              onClick={logout}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-5">
        <aside className="w-[240px] min-h-screen shrink-0 rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">팀원 리뷰/코칭 프로그램</h1>
          </div>
          <nav className="space-y-2">
            <Link href="/" className={navClass(pathname === "/")}>
              대시보드
            </Link>
            <Link href="/members" className={navClass(pathname.startsWith("/members"))}>
              팀원
            </Link>
            <Link href="/leadership" className={navClass(pathname.startsWith("/leadership"))}>
              리더십 진단
            </Link>
            {actor?.role === "HR" ? (
              <Link href="/hr" className={navClass(pathname.startsWith("/hr"))}>
                HR 대시보드
              </Link>
            ) : null}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
