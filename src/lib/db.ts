import {
  seedEmployees,
  seedLogs,
  seedNotes,
  seedSummaries,
  seedTeams,
  seedUsers,
} from "@/lib/seed";
import { getFirestoreAdmin, isFirebaseEnabled } from "@/lib/firebase-admin";
import type {
  Employee,
  FeedbackLog,
  LeadershipAssessment,
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
};

const FIRESTORE_COLLECTION = "coaching_log";
const FIRESTORE_DOC_ID = "state_main";
const RTDB_STATE_PATH = "coaching_log/state_main.json";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const globalForDB = globalThis as unknown as { coachingLogDB?: DBState };
const globalForDBReady = globalThis as unknown as { coachingLogDBReady?: Promise<void> };

function createSeedState(): DBState {
  return {
    users: clone(seedUsers),
    teams: clone(seedTeams),
    employees: clone(seedEmployees),
    logs: clone(seedLogs),
    notes: clone(seedNotes),
    summaries: clone(seedSummaries),
    leadershipAssessments: [],
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

export const db: DBState = globalForDB.coachingLogDB as DBState;

function applyState(state: DBState) {
  db.users = clone(state.users);
  db.teams = clone(state.teams);
  db.employees = clone(state.employees);
  db.logs = clone(state.logs);
  db.notes = clone(state.notes);
  db.summaries = clone(state.summaries);
  db.leadershipAssessments = clone(state.leadershipAssessments || []);
}

export async function ensureDbReady(): Promise<void> {
  if (globalForDBReady.coachingLogDBReady) {
    await globalForDBReady.coachingLogDBReady;
    return;
  }
  globalForDBReady.coachingLogDBReady = (async () => {
    if (isFirebaseEnabled()) {
      const firestore = getFirestoreAdmin();
      if (firestore) {
        try {
          const ref = firestore.collection(FIRESTORE_COLLECTION).doc(FIRESTORE_DOC_ID);
          const snap = await ref.get();
          if (!snap.exists) {
            await ref.set(clone(db));
            return;
          }
          const data = snap.data() as DBState | undefined;
          if (!data) return;
          applyState(data);
          return;
        } catch {
          // Firestore API disabled/권한 이슈 시 RTDB 폴백
        }
      }
    }

    const rtdbUrl = process.env.FIREBASE_DATABASE_URL;
    if (!rtdbUrl) return;
    const base = rtdbUrl.endsWith("/") ? rtdbUrl.slice(0, -1) : rtdbUrl;
    const stateUrl = `${base}/${RTDB_STATE_PATH}`;
    try {
      const res = await fetch(stateUrl, { method: "GET" });
      if (!res.ok) return;
      const remote = (await res.json()) as DBState | null;
      if (!remote) {
        await fetch(stateUrl, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clone(db)),
        });
        return;
      }
      applyState(remote);
    } catch {
      return;
    }
  })();
  await globalForDBReady.coachingLogDBReady;
}

export async function persistDbState(): Promise<void> {
  if (isFirebaseEnabled()) {
    const firestore = getFirestoreAdmin();
    if (firestore) {
      try {
        await firestore.collection(FIRESTORE_COLLECTION).doc(FIRESTORE_DOC_ID).set(clone(db));
        return;
      } catch {
        // Firestore 저장 실패 시 RTDB 폴백
      }
    }
  }

  const rtdbUrl = process.env.FIREBASE_DATABASE_URL;
  if (!rtdbUrl) return;
  const base = rtdbUrl.endsWith("/") ? rtdbUrl.slice(0, -1) : rtdbUrl;
  const stateUrl = `${base}/${RTDB_STATE_PATH}`;
  try {
    await fetch(stateUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clone(db)),
    });
  } catch {
    return;
  }
}
