"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useActor } from "@/components/actor-provider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { actor, loading } = useActor();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !actor) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
    }
  }, [actor, loading, pathname, router]);

  if (loading) return <div className="p-6 text-sm text-slate-500">로딩 중...</div>;
  if (!actor) return null;
  return <>{children}</>;
}
