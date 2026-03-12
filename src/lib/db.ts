import {
  seedEmployees,
  seedLogs,
  seedNotes,
  seedSummaries,
  seedTeams,
  seedUsers,
} from "@/lib/seed";
import { getFirestoreAdmin, getRtdbRef, isFirebaseEnabled } from "@/lib/firebase-admin";
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

const FIRESTORE_COLLECTION = "coaching_log";
const FIRESTORE_DOC_ID = "state_main";
const RTDB_STATE_PATH = "coaching_log/state_main";

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
  db.users = clone(state.users);
  db.teams = clone(state.teams);
  db.employees = clone(state.employees);
  db.logs = clone(state.logs);
  db.notes = clone(state.notes);
  db.summaries = clone(state.summaries);
  db.leadershipAssessments = clone(
    Array.isArray(state.leadershipAssessments) ? state.leadershipAssessments : [],
  );
  db.meetings = clone(Array.isArray(state.meetings) ? state.meetings : []);
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

    const rtdbRef = getRtdbRef(RTDB_STATE_PATH);
    if (rtdbRef) {
      try {
        const snap = await rtdbRef.get();
        const remote = snap.val() as DBState | null;
        if (!remote) {
          await rtdbRef.set(clone(db));
          return;
        }
        applyState(remote);
        return;
      } catch {
        // RTDB 실패 시 REST 폴백
      }
    }

    const rtdbUrl = process.env.FIREBASE_DATABASE_URL;
    if (!rtdbUrl) return;
    const base = rtdbUrl.endsWith("/") ? rtdbUrl.slice(0, -1) : rtdbUrl;
    const stateUrl = `${base}/${RTDB_STATE_PATH}.json`;
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

  const rtdbRef = getRtdbRef(RTDB_STATE_PATH);
  if (rtdbRef) {
    await rtdbRef.set(clone(db));
    return;
  }

  const rtdbUrl = process.env.FIREBASE_DATABASE_URL;
  if (!rtdbUrl) {
    throw new Error(
      "DB 저장소가 설정되지 않았습니다. Vercel 환경변수에 FIREBASE_SERVICE_ACCOUNT_JSON(또는 FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY)과 FIREBASE_DATABASE_URL을 추가해주세요.",
    );
  }
  const base = rtdbUrl.endsWith("/") ? rtdbUrl.slice(0, -1) : rtdbUrl;
  const stateUrl = `${base}/${RTDB_STATE_PATH}.json`;
  const res = await fetch(stateUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(clone(db)),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DB 저장 실패 (${res.status}): ${text.slice(0, 200)}`);
  }
}
