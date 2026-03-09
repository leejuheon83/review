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

function NavContent({
  pathname,
  actor,
  navClassFn,
}: {
  pathname: string;
  actor: { role?: string } | null;
  navClassFn: (active: boolean) => string;
}) {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">팀원 리뷰/코칭 프로그램</h1>
      </div>
      <nav className="space-y-2">
        <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Main</p>
        {primaryMenus.map((menu) => (
          <Link
            key={menu.href}
            href={menu.href}
            className={navClassFn(
              menu.href === "/" ? pathname === "/" : pathname.startsWith(menu.href),
            )}
          >
            {menu.label}
          </Link>
        ))}
        <div className="my-3 border-t border-gray-200" />
        <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Leadership</p>
        <Link href={leadershipMenu.href} className={navClassFn(pathname.startsWith(leadershipMenu.href))}>
          {leadershipMenu.label}
        </Link>
        {actor?.role === "HR" ? (
          <>
            <div className="my-3 border-t border-gray-200" />
            <Link href="/hr" className={navClassFn(pathname.startsWith("/hr"))}>
              HR 대시보드
            </Link>
          </>
        ) : null}
      </nav>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { actor, logout } = useActor();
  const [teams, setTeams] = useState<Team[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const teamName = useMemo(() => {
    if (!actor?.teamId) return "";
    return teams.find((team) => team.id === actor.teamId)?.name || "";
  }, [actor?.teamId, teams]);

  return (
    <div className="min-h-screen bg-slate-50 pb-safe">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="메뉴 열기"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Image
              src="/sbs-mnc-ci.png"
              alt="SBS M&C CI"
              width={132}
              height={44}
              priority
              className="h-9 w-auto object-contain sm:h-11"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2 text-right">
            <span className="hidden max-w-[140px] truncate text-sm font-medium text-slate-900 sm:block sm:max-w-full">
              {teamName ? `${teamName} / ${actor?.name}` : actor?.name}
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-4 sm:px-6 sm:py-5">
        <aside className="hidden w-[240px] shrink-0 lg:block">
          <div className="sticky top-16 rounded-xl border border-gray-200 bg-white p-4">
            <NavContent pathname={pathname} actor={actor} navClassFn={navClass} />
          </div>
        </aside>

        {drawerOpen ? (
          <>
            <div
              className="fixed inset-0 z-50 bg-slate-900/50 lg:hidden"
              onClick={() => setDrawerOpen(false)}
              aria-hidden
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] overflow-y-auto border-r border-gray-200 bg-white p-4 shadow-xl lg:hidden">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">메뉴</h2>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                  aria-label="메뉴 닫기"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <NavContent pathname={pathname} actor={actor} navClassFn={navClass} />
            </aside>
          </>
        ) : null}

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
