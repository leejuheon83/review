"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@/lib/types";

type ActorContextValue = {
  actor: User | null;
  actors: User[];
  loading: boolean;
  setActorId: (id: string) => void;
  logout: () => void;
};

const ActorContext = createContext<ActorContextValue | null>(null);

export function ActorProvider({ children }: { children: React.ReactNode }) {
  const [actor, setActor] = useState<User | null>(null);
  const [actors, setActors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await fetch("/api/auth/actors");
      const data = (await res.json()) as { actors: User[] };
      if (cancelled) return;
      setActors(data.actors);
      const savedId = window.localStorage.getItem("coaching-log-actor-id");
      if (savedId) {
        setActor(data.actors.find((u) => u.id === savedId) || null);
      }
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<ActorContextValue>(
    () => ({
      actor,
      actors,
      loading,
      setActorId: (id: string) => {
        window.localStorage.setItem("coaching-log-actor-id", id);
        setActor(actors.find((u) => u.id === id) || null);
      },
      logout: () => {
        window.localStorage.removeItem("coaching-log-actor-id");
        setActor(null);
      },
    }),
    [actor, actors, loading],
  );

  return <ActorContext.Provider value={value}>{children}</ActorContext.Provider>;
}

export function useActor() {
  const ctx = useContext(ActorContext);
  if (!ctx) throw new Error("useActor must be used within ActorProvider");
  return ctx;
}
