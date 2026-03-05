"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useActor } from "@/components/actor-provider";
import { apiFetch } from "@/lib/client-api";
import type { Team } from "@/lib/types";

function navClass(active: boolean): string {
  return active
    ? "block w-full whitespace-nowrap rounded-lg bg-[#0070C9] px-3 py-2 text-base font-semibold text-white"
    : "block w-full whitespace-nowrap rounded-lg px-3 py-2 text-base text-slate-600 hover:bg-slate-100";
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
        <aside className="w-64 shrink-0 rounded-xl border bg-white p-3">
          <p className="mb-2 px-2 text-lg font-semibold text-slate-900">
            팀원 리뷰/코칭 프로그램
          </p>
          <nav className="flex flex-col gap-1">
            <Link href="/" className={navClass(pathname === "/")}>
              대시보드
            </Link>
            <Link href="/members" className={navClass(pathname.startsWith("/members"))}>
              팀원
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
