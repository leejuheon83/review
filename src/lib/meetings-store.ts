import { db, mutateDbWithTransaction } from "@/lib/db";
import type { MeetingRecord, MeetingType } from "@/lib/types";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function prependMeeting(records: MeetingRecord[], record: MeetingRecord): MeetingRecord[] {
  if (records.some((item) => item.id === record.id)) return records;
  return [record, ...records];
}

export function patchMeetingInList(
  records: MeetingRecord[],
  id: string,
  patch: Partial<MeetingRecord>,
): MeetingRecord[] {
  const idx = records.findIndex((item) => item.id === id);
  if (idx < 0) return records;
  const next = [...records];
  next[idx] = { ...next[idx], ...patch };
  return next;
}

export function removeMeetingFromList(records: MeetingRecord[], id: string): MeetingRecord[] {
  return records.filter((item) => item.id !== id);
}

function sortByMeetingDateDesc(items: MeetingRecord[]): MeetingRecord[] {
  return [...items].sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime());
}

function applyFilters(
  items: MeetingRecord[],
  params?: { managerId?: string; type?: MeetingType },
): MeetingRecord[] {
  let result = items;
  if (params?.managerId) result = result.filter((item) => item.managerId === params.managerId);
  if (params?.type) result = result.filter((item) => item.meetingType === params.type);
  return result;
}

export function mergeMeetingLists(primary: MeetingRecord[], secondary: MeetingRecord[]): MeetingRecord[] {
  const byId = new Map<string, MeetingRecord>();
  for (const item of primary) byId.set(item.id, item);
  for (const item of secondary) byId.set(item.id, item);
  return [...byId.values()];
}

export async function listMeetings(params?: {
  managerId?: string;
  type?: MeetingType;
}): Promise<MeetingRecord[]> {
  const source = Array.isArray(db.meetings) ? db.meetings : [];
  return sortByMeetingDateDesc(applyFilters(source, params));
}

export async function getMeetingById(id: string): Promise<MeetingRecord | null> {
  const source = Array.isArray(db.meetings) ? db.meetings : [];
  return source.find((item) => item.id === id) ?? null;
}

export async function createMeeting(record: MeetingRecord): Promise<void> {
  await mutateDbWithTransaction((state) => {
    const source = Array.isArray(state.meetings) ? state.meetings : [];
    return { ...state, meetings: prependMeeting(source, clone(record)) };
  });
}

export async function patchMeeting(
  id: string,
  patch: Partial<MeetingRecord>,
): Promise<MeetingRecord | null> {
  const current = await getMeetingById(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  await mutateDbWithTransaction((state) => {
    const source = Array.isArray(state.meetings) ? state.meetings : [];
    return { ...state, meetings: patchMeetingInList(source, id, patch) };
  });
  return next;
}

export async function deleteMeeting(id: string): Promise<boolean> {
  const current = await getMeetingById(id);
  if (!current) return false;
  await mutateDbWithTransaction((state) => {
    const source = Array.isArray(state.meetings) ? state.meetings : [];
    return { ...state, meetings: removeMeetingFromList(source, id) };
  });
  return true;
}
