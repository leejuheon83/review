import {
  seedEmployees,
  seedLogs,
  seedNotes,
  seedSummaries,
  seedTeams,
  seedUsers,
} from "@/lib/seed";
import { getRtdbRef } from "@/lib/firebase-admin";
import type {
  Employee,
  FeedbackLog,
  LeadershipAssessment,
  MeetingRecord,
  MemberNote,
  Summary,
  Team,
  User,
} from "@/lib/types";

type DBState = {
  users: User[];
  teams: Team[];
  employees: Employee[];
  logs: FeedbackLog[];
  notes: MemberNote[];
  summaries: Summary[];
  leadershipAssessments: LeadershipAssessment[];
  meetings: MeetingRecord[];
};

const RTDB_STATE_PATH = "coaching_log/state_main";

function clone<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

const globalForDB = globalThis as unknown as { coachingLogDB?: DBState };
const globalForDBReady = globalThis as unknown as { coachingLogDBReady?: Promise<void> };
const globalForDBLoadedAt = globalThis as unknown as { coachingLogDBLoadedAt?: number };
const CACHE_TTL_MS = 0;

function createSeedState(): DBState {
  return {
    users: clone(seedUsers),
    teams: clone(seedTeams),
    employees: clone(seedEmployees),
    logs: clone(seedLogs),
    notes: clone(seedNotes),
    summaries: clone(seedSummaries),
    leadershipAssessments: [],
    meetings: [],
  };
}

function needsSeedRefresh(state: DBState | undefined): boolean {
  if (!state) return true;
  const hasAdmin = state.users.some((user) => user.id === "admin");
  const hasEmployeeNoManager = state.users.some((user) => user.id === "mgr_120032");
  return !hasAdmin || !hasEmployeeNoManager;
}

if (needsSeedRefresh(globalForDB.coachingLogDB)) {
  globalForDB.coachingLogDB = createSeedState();
}

const dbRef = globalForDB.coachingLogDB as DBState;
if (!Array.isArray(dbRef.meetings)) dbRef.meetings = [];
export const db: DBState = dbRef;

function applyState(state: DBState) {
  db.users = clone(Array.isArray(state.users) ? state.users : []);
  db.teams = clone(Array.isArray(state.teams) ? state.teams : []);
  db.employees = clone(Array.isArray(state.employees) ? state.employees : []);
  db.logs = clone(Array.isArray(state.logs) ? state.logs : []);
  db.notes = clone(Array.isArray(state.notes) ? state.notes : []);
  db.summaries = clone(Array.isArray(state.summaries) ? state.summaries : []);
  db.leadershipAssessments = clone(
    Array.isArray(state.leadershipAssessments) ? state.leadershipAssessments : [],
  );
  db.meetings = clone(Array.isArray(state.meetings) ? state.meetings : []);
}

async function readStateFromRTDB(): Promise<DBState | null> {
  const rtdbRef = getRtdbRef(RTDB_STATE_PATH);
  if (rtdbRef) {
    try {
      const snap = await rtdbRef.get();
      return (snap.val() as DBState | null) ?? null;
    } catch {
      // Admin SDK RTDB read 실패 시 REST 폴백
    }
  }

  const rtdbUrl = process.env.FIREBASE_DATABASE_URL;
  if (!rtdbUrl) return null;
  try {
    const base = rtdbUrl.endsWith("/") ? rtdbUrl.slice(0, -1) : rtdbUrl;
    const stateUrl = `${base}/${RTDB_STATE_PATH}.json`;
    const res = await fetch(stateUrl, { method: "GET" });
    if (!res.ok) return null;
    return (await res.json()) as DBState | null;
  } catch {
    return null;
  }
}

async function writeStateToRTDB(state: DBState): Promise<void> {
  const rtdbRef = getRtdbRef(RTDB_STATE_PATH);
  if (rtdbRef) {
    try {
      await rtdbRef.set(state);
      return;
    } catch {
      // Admin SDK RTDB write 실패 시 REST 폴백
    }
  }

  const rtdbUrl = process.env.FIREBASE_DATABASE_URL;
  if (!rtdbUrl) {
    return;
  }
  try {
    const base = rtdbUrl.endsWith("/") ? rtdbUrl.slice(0, -1) : rtdbUrl;
    const stateUrl = `${base}/${RTDB_STATE_PATH}.json`;
    const res = await fetch(stateUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`RTDB 저장 실패 (${res.status}): ${text.slice(0, 200)}`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "RTDB 저장 실패";
    throw new Error(msg);
  }
}

async function loadFromPrimary(): Promise<void> {
  const remote = await readStateFromRTDB();
  if (remote) {
    applyState(remote);
    return;
  }
  try {
    await writeStateToRTDB(clone(db));
  } catch {
    // 저장소 초기화 실패 시 메모리 시드 상태 유지
  }
}

export async function ensureDbReady(): Promise<void> {
  const now = Date.now();
  const loadedAt = globalForDBLoadedAt.coachingLogDBLoadedAt ?? 0;
  if (now - loadedAt < CACHE_TTL_MS && globalForDBReady.coachingLogDBReady) {
    await globalForDBReady.coachingLogDBReady;
    return;
  }
  globalForDBReady.coachingLogDBReady = (async () => {
    await loadFromPrimary();
    globalForDBLoadedAt.coachingLogDBLoadedAt = Date.now();
  })();
  await globalForDBReady.coachingLogDBReady;
}

export async function mutateDbWithTransaction(
  updater: (state: DBState) => DBState,
): Promise<void> {
  const seed = createSeedState();
  const rtdbRef = getRtdbRef(RTDB_STATE_PATH);
  if (rtdbRef) {
    const result = await rtdbRef.transaction((current) => {
      const base = (current as DBState | null) || seed;
      return updater(clone(base));
    });
    if (!result.committed) {
      throw new Error("RTDB 트랜잭션 커밋에 실패했습니다.");
    }
    const committed = result.snapshot.val() as DBState;
    applyState(committed);
    return;
  }

  await ensureDbReady();
  const next = updater(clone(db));
  applyState(next);
  await writeStateToRTDB(next);
}

export async function persistDbState(): Promise<void> {
  const state = clone(db);
  await writeStateToRTDB(state);
}
