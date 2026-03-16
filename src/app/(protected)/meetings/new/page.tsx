"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActor } from "@/components/actor-provider";
import { apiFetch } from "@/lib/client-api";
import { createMeeting } from "@/lib/meetings";
import { MOCK_TEAM_MEMBERS } from "@/lib/mockTeamMembers";
import type { Employee, User } from "@/lib/types";
import type { MeetingFormData } from "@/types/meeting";
import { MeetingForm } from "@/components/meetings/MeetingForm";

export default function NewMeetingPage() {
  const { actor } = useActor();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const managerId = actor?.id || "";
  const managerName = actor?.name || "";

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const membersRes = await apiFetch<{ items: Employee[] }>("/api/members");
        if (cancelled) return;
        setEmployees(membersRes.items?.length ? membersRes.items : MOCK_TEAM_MEMBERS);
      } catch {
        if (!cancelled) setEmployees(MOCK_TEAM_MEMBERS);
      }

      if (actor?.role === "HR") {
        try {
          const managersRes = await apiFetch<{ items: User[] }>("/api/users");
          if (!cancelled) setManagers(managersRes.items ?? []);
        } catch {
          if (!cancelled) setManagers([]);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [actor?.role]);

  const handleSubmit = async (input: MeetingFormData) => {
    setSubmitError(null);
    try {
      let payload = input;
      if (actor?.role === "HR") {
        const employee = employees.find((e) => e.id === input.employeeId);
        if (!employee) {
          setSubmitError("선택한 팀원을 찾을 수 없습니다.");
          return;
        }
        const manager = managers.find((m) => m.id === employee.managerId);
        payload = {
          ...input,
          managerId: employee.managerId,
          managerName: manager?.name || "담당 팀장",
        };
      }
      await createMeeting(payload);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("meeting-toast", "면담 기록이 저장되었습니다.");
      }
      router.push("/meetings");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "저장에 실패했습니다.");
    }
  };

  const handleCancel = () => router.push("/meetings");

  if (!managerId) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-slate-600">
        로그인 후 면담 기록을 작성할 수 있습니다.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">면담 기록 작성</h1>
      {submitError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submitError}
        </div>
      )}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <MeetingForm
          employees={employees}
          managerId={managerId}
          managerName={managerName}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
