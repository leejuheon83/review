"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Timestamp as TimestampType } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { Meeting, MeetingFormData, MeetingInput, MeetingType } from "@/types/meeting";

const COLLECTION = "meetings";

function getDb() {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore is not initialized.");
  return db;
}

function toTimestamp(v: Date | TimestampType): TimestampType {
  if (v instanceof Date) return Timestamp.fromDate(v);
  return v;
}

export async function createMeeting(input: MeetingFormData | MeetingInput): Promise<string> {
  const db = getDb();
  const ref = await addDoc(collection(db, COLLECTION), {
    managerId: input.managerId,
    managerName: input.managerName,
    employeeId: input.employeeId,
    employeeName: input.employeeName,
    meetingType: input.meetingType,
    meetingDate: toTimestamp(input.meetingDate),
    goalSummary: input.goalSummary || "",
    discussionNotes: input.discussionNotes || "",
    managerComment: input.managerComment || "",
    supportNeeded: input.supportNeeded || "",
    actionItems: input.actionItems || "",
    nextMeetingDate: input.nextMeetingDate ? toTimestamp(input.nextMeetingDate) : null,
    aiSummary: input.aiSummary || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getMeetings(managerId: string, typeFilter?: MeetingType): Promise<Meeting[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION),
    where("managerId", "==", managerId),
    orderBy("meetingDate", "desc"),
  );
  const snapshot = await getDocs(q);
  let items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Meeting[];
  if (typeFilter) {
    items = items.filter((m) => m.meetingType === typeFilter);
  }
  return items;
}

export async function getMeetingById(id: string): Promise<Meeting | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Meeting;
}

export async function updateMeeting(id: string, input: Partial<MeetingFormData | MeetingInput>): Promise<void> {
  const db = getDb();
  const payload: Record<string, unknown> = {
    ...input,
    updatedAt: serverTimestamp(),
  };
  if (input.meetingDate) payload.meetingDate = toTimestamp(input.meetingDate);
  if (input.nextMeetingDate !== undefined) {
    payload.nextMeetingDate = input.nextMeetingDate ? toTimestamp(input.nextMeetingDate) : null;
  }
  delete (payload as Record<string, unknown>).createdAt;
  await updateDoc(doc(db, COLLECTION, id), payload);
}

export async function deleteMeeting(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTION, id));
}

export function formatMeetingDate(ts: TimestampType | Date | string): string {
  if (typeof ts === "string") return new Date(ts).toLocaleDateString("ko-KR");
  const d = ts instanceof Date ? ts : ts.toDate();
  return d.toLocaleDateString("ko-KR");
}
