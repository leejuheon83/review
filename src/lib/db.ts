import {
  seedEmployees,
  seedLogs,
  seedNotes,
  seedSummaries,
  seedTeams,
  seedUsers,
} from "@/lib/seed";
import { getFirestoreAdmin, getRtdbRef, isFirebaseEnabled } from "@/lib/firebase-admin";
import {
  isGoogleSheetsEnabled,
  readDbStateFromSheets,
  writeDbStateToSheets,
} from "@/lib/google-sheets-db";
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

/**
 * Load order: RTDB first when FIREBASE_DATABASE_URL is set (docs say RTDB is primary),
 * then Firestore, REST, Google Sheets. Single source consistency prevents data loss.
 */
export async function ensureDbReady(): Promise<void> {
  if (globalForDBReady.coachingLogDBReady) {
    await globalForDBReady.coachingLogDBReady;
    return;
  }
  globalForDBReady.coachingLogDBReady = (async () => {
    const rtdbRef = getRtdbRef(RTDB_STATE_PATH);
    if (rtdbRef) {
      try {
        const snap = await rtdbRef.get();
        const remote = snap.val() as DBState | null;
        if (remote) {
          applyState(remote);
          return;
        }
        await rtdbRef.set(clone(db));
        return;
      } catch {
        // RTDB 실패 시 다음 소스 시도
      }
    }

    const rtdbUrl = process.env.FIREBASE_DATABASE_URL;
    if (rtdbUrl) {
      const base = rtdbUrl.endsWith("/") ? rtdbUrl.slice(0, -1) : rtdbUrl;
      const stateUrl = `${base}/${RTDB_STATE_PATH}.json`;
      try {
        const res = await fetch(stateUrl, { method: "GET" });
        if (res.ok) {
          const remote = (await res.json()) as DBState | null;
          if (remote) {
            applyState(remote);
            return;
          }
        }
      } catch {
        // REST 실패 시 다음 소스 시도
      }
    }

    if (isFirebaseEnabled()) {
      const firestore = getFirestoreAdmin();
      if (firestore) {
        try {
          const ref = firestore.collection(FIRESTORE_COLLECTION).doc(FIRESTORE_DOC_ID);
          const snap = await ref.get();
          if (snap.exists) {
            const data = snap.data() as DBState | undefined;
            if (data) {
              applyState(data);
              return;
            }
          }
        } catch {
          // Firestore 실패 시 다음 소스 시도
        }
      }
    }

    if (isGoogleSheetsEnabled()) {
      try {
        const remote = await readDbStateFromSheets();
        if (remote) {
          applyState(remote);
          return;
        }
      } catch {
        // fall through
      }
    }
  })();
  await globalForDBReady.coachingLogDBReady;
}

/**
 * Atomically mutate DB state using RTDB transaction. Prevents serverless race condition
 * where multiple instances overwrite each other's writes (read-modify-write).
 * Falls back to direct persist when RTDB is unavailable.
 */
export async function mutateDbWithTransaction(
  updater: (state: DBState) => DBState,
): Promise<void> {
  const rtdbRef = getRtdbRef(RTDB_STATE_PATH);
  if (rtdbRef) {
    const seed = createSeedState();
    const result = await rtdbRef.transaction((current) => {
      const base = (current as DBState | null) || seed;
      const next = updater(clone(base));
      return next;
    });
    if (result.committed) {
      applyState(result.snapshot.val() as DBState);
      await syncToSecondary(result.snapshot.val() as DBState);
      return;
    }
  }

  const next = updater(clone(db));
  applyState(next);
  await persistDbState();
}

async function syncToSecondary(state: DBState): Promise<void> {
  const s = clone(state);
  if (isFirebaseEnabled()) {
    const firestore = getFirestoreAdmin();
    if (firestore) {
      try {
        await firestore.collection(FIRESTORE_COLLECTION).doc(FIRESTORE_DOC_ID).set(s);
      } catch {
        // ignore
      }
    }
  }
  if (isGoogleSheetsEnabled()) {
    writeDbStateToSheets(s).catch(() => {});
  }
}

export async function persistDbState(): Promise<void> {
  const state = clone(db);

  if (isFirebaseEnabled()) {
    const firestore = getFirestoreAdmin();
    if (firestore) {
      try {
        await firestore.collection(FIRESTORE_COLLECTION).doc(FIRESTORE_DOC_ID).set(state);
        if (isGoogleSheetsEnabled()) {
          writeDbStateToSheets(state).catch(() => {});
        }
        return;
      } catch {
        // Firestore 저장 실패 시 RTDB 폴백
      }
    }
  }

  const rtdbRef = getRtdbRef(RTDB_STATE_PATH);
  if (rtdbRef) {
    await rtdbRef.set(state);
    if (isGoogleSheetsEnabled()) {
      writeDbStateToSheets(state).catch(() => {});
    }
    return;
  }

  const rtdbUrl = process.env.FIREBASE_DATABASE_URL;
  if (rtdbUrl) {
    const base = rtdbUrl.endsWith("/") ? rtdbUrl.slice(0, -1) : rtdbUrl;
    const stateUrl = `${base}/${RTDB_STATE_PATH}.json`;
    const res = await fetch(stateUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    if (res.ok) {
      if (isGoogleSheetsEnabled()) {
        writeDbStateToSheets(state).catch(() => {});
      }
      return;
    }
    const text = await res.text();
    throw new Error(`DB 저장 실패 (${res.status}): ${text.slice(0, 200)}`);
  }

  if (isGoogleSheetsEnabled()) {
    await writeDbStateToSheets(state);
    return;
  }

  throw new Error(
    "DB 저장소가 설정되지 않았습니다. Vercel 환경변수에 FIREBASE_SERVICE_ACCOUNT_JSON(또는 FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY)과 FIREBASE_DATABASE_URL, 또는 GOOGLE_SPREADSHEET_ID를 추가해주세요.",
  );
}
