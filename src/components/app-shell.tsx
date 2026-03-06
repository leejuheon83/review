"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useActor } from "@/components/actor-provider";
import { apiFetch } from "@/lib/client-api";
import type { Team } from "@/lib/types";

const primaryMenus = [
  { label: "대시보드", href: "/" },
  { label: "팀원 관리", href: "/members" },
  { label: "학습 자료", href: "/learning" },
];
const leadershipMenu = { label: "내 리더십", href: "/leadership" };

function navClass(active: boolean): string {
  return active
    ? "block rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition"
    : "block rounded-xl border border-transparent px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50";
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
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Main</p>
            {primaryMenus.map((menu) => (
              <Link
                key={menu.href}
                href={menu.href}
                className={navClass(
                  menu.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(menu.href),
                )}
              >
                {menu.label}
              </Link>
            ))}
            <div className="my-3 border-t border-gray-200" />
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Leadership</p>
            <Link
              href={leadershipMenu.href}
              className={navClass(pathname.startsWith(leadershipMenu.href))}
            >
              {leadershipMenu.label}
            </Link>
            {actor?.role === "HR" ? (
              <>
                <div className="my-3 border-t border-gray-200" />
                <Link href="/hr" className={navClass(pathname.startsWith("/hr"))}>
                  HR 대시보드
                </Link>
              </>
            ) : null}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
