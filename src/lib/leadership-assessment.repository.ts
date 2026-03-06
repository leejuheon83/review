import type { Firestore } from "firebase/firestore";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { LeadershipScores } from "@/lib/leadership-assessment";

export type LeadershipAssessmentDoc = {
  ownerUid: string;
  monthKey: string;
  scores: LeadershipScores;
  totalScore: number;
  memo: string;
  createdAt?: unknown;
};

type FirestoreDeps = {
  addDoc: typeof addDoc;
  collection: typeof collection;
  getDocs: typeof getDocs;
  limit: typeof limit;
  orderBy: typeof orderBy;
  query: typeof query;
  serverTimestamp: typeof serverTimestamp;
  where: typeof where;
};

type RepositoryDeps = {
  db: Firestore | Record<string, unknown>;
  deps: FirestoreDeps;
};

export function createLeadershipAssessmentRepository({ db, deps }: RepositoryDeps) {
  return {
    saveLeadershipAssessment(input: LeadershipAssessmentDoc) {
      return deps.addDoc(deps.collection(db as Firestore, "leadershipAssessments"), {
        ...input,
        createdAt: deps.serverTimestamp(),
      });
    },

    async getRecentLeadershipAssessments(ownerUid: string) {
      const q = deps.query(
        deps.collection(db as Firestore, "leadershipAssessments"),
        deps.where("ownerUid", "==", ownerUid),
        deps.orderBy("createdAt", "desc"),
        deps.limit(6),
      );
      const snapshot = await deps.getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    },
  };
}

function getRepository() {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error("Firebase Firestore is not initialized. Check Firebase client env values.");
  }
  return createLeadershipAssessmentRepository({
    db,
    deps: {
      addDoc,
      collection,
      getDocs,
      limit,
      orderBy,
      query,
      serverTimestamp,
      where,
    },
  });
}

export function saveLeadershipAssessment(input: LeadershipAssessmentDoc) {
  return getRepository().saveLeadershipAssessment(input);
}

export function getRecentLeadershipAssessments(ownerUid: string) {
  return getRepository().getRecentLeadershipAssessments(ownerUid);
}
