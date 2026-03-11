"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActor } from "@/components/actor-provider";
import { apiFetch } from "@/lib/client-api";
import { createMeeting } from "@/lib/meetings";
import { MOCK_TEAM_MEMBERS } from "@/lib/mockTeamMembers";
import type { Employee } from "@/lib/types";
import type { MeetingFormData } from "@/types/meeting";
import { MeetingForm } from "@/components/meetings/MeetingForm";

export default function NewMeetingPage() {
  const { actor } = useActor();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);

  const managerId = actor?.id || "";
  const managerName = actor?.name || "";

  useEffect(() => {
    apiFetch<{ items: Employee[] }>("/api/members")
      .then((res) => setEmployees(res.items?.length ? res.items : MOCK_TEAM_MEMBERS))
      .catch(() => setEmployees(MOCK_TEAM_MEMBERS));
  }, []);

  const handleSubmit = async (input: MeetingFormData) => {
    const id = await createMeeting(input);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("meeting-toast", "면담 기록이 저장되었습니다.");
    }
    router.push(`/meetings/${id}`);
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
