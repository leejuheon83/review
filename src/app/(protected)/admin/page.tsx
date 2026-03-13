"use client";

import { useEffect, useState } from "react";
import { useActor } from "@/components/actor-provider";
import { apiFetch } from "@/lib/client-api";
import type { Employee, Team, User } from "@/lib/types";

type Tab = "teams" | "managers" | "members";

export default function AdminPage() {
  const { actor } = useActor();
  const [tab, setTab] = useState<Tab>("teams");
  const [teams, setTeams] = useState<Team[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [members, setMembers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [modal, setModal] = useState<"team" | "manager" | "member" | null>(null);
  const [editing, setEditing] = useState<Team | User | Employee | null>(null);

  const refresh = async () => {
    if (actor?.role !== "HR") return;
    setLoading(true);
    try {
      const [teamsRes, managersRes, membersRes] = await Promise.all([
        apiFetch<{ items: Team[] }>("/api/teams"),
        apiFetch<{ items: User[] }>("/api/users"),
        apiFetch<{ items: Employee[] }>("/api/members"),
      ]);
      setTeams(teamsRes.items);
      setManagers(managersRes.items);
      setMembers(membersRes.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [actor?.role]);

  if (actor?.role !== "HR") {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-slate-600">
        관리자만 접근할 수 있습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">관리자 - 부서/팀장/팀원 관리</h1>
      {msg && <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{msg}</p>}

      <div className="flex gap-2">
        {(["teams", "managers", "members"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {t === "teams" ? "부서" : t === "managers" ? "팀장" : "팀원"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-8 text-center text-slate-500">불러오는 중...</p>
      ) : tab === "teams" ? (
        <TeamsSection
          teams={teams}
          onRefresh={refresh}
          onMsg={setMsg}
          onEdit={(t) => {
            setEditing(t);
            setModal("team");
          }}
          onAdd={() => {
            setEditing(null);
            setModal("team");
          }}
        />
      ) : tab === "managers" ? (
        <ManagersSection
          teams={teams}
          managers={managers}
          onRefresh={refresh}
          onMsg={setMsg}
          onEdit={(m) => {
            setEditing(m);
            setModal("manager");
          }}
          onAdd={() => {
            setEditing(null);
            setModal("manager");
          }}
        />
      ) : (
        <MembersSection
          teams={teams}
          managers={managers}
          members={members}
          onRefresh={refresh}
          onMsg={setMsg}
          onEdit={(m) => {
            setEditing(m);
            setModal("member");
          }}
          onAdd={() => {
            setEditing(null);
            setModal("member");
          }}
        />
      )}

      {modal === "team" && (
        <TeamModal
          team={editing as Team | null}
          onClose={() => {
            setModal(null);
            setEditing(null);
          }}
          onSaved={() => {
            setModal(null);
            setEditing(null);
            setMsg("저장되었습니다.");
            void refresh();
          }}
        />
      )}
      {modal === "manager" && (
        <ManagerModal
          teams={teams}
          manager={editing as User | null}
          onClose={() => {
            setModal(null);
            setEditing(null);
          }}
          onSaved={() => {
            setModal(null);
            setEditing(null);
            setMsg("저장되었습니다.");
            void refresh();
          }}
        />
      )}
      {modal === "member" && (
        <MemberModal
          teams={teams}
          managers={managers}
          member={editing as Employee | null}
          onClose={() => {
            setModal(null);
            setEditing(null);
          }}
          onSaved={() => {
            setModal(null);
            setEditing(null);
            setMsg("저장되었습니다.");
            void refresh();
          }}
        />
      )}
    </div>
  );
}

function TeamsSection({
  teams,
  onRefresh,
  onMsg,
  onEdit,
  onAdd,
}: {
  teams: Team[];
  onRefresh: () => void;
  onMsg: (s: string) => void;
  onEdit: (t: Team) => void;
  onAdd: () => void;
}) {
  const handleDelete = async (id: string) => {
    if (!confirm("이 부서를 삭제하시겠습니까?")) return;
    try {
      await apiFetch(`/api/teams/${id}`, { method: "DELETE" });
      onMsg("삭제되었습니다.");
      onRefresh();
    } catch (e) {
      onMsg(e instanceof Error ? e.message : "삭제 실패");
    }
  };

  return (
    <section className="rounded-xl border bg-white p-5">
      <div className="mb-4 flex justify-between">
        <h2 className="text-lg font-semibold text-slate-900">부서 목록</h2>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-lg bg-[#0070C9] px-4 py-2 text-sm font-semibold text-white"
        >
          + 부서 추가
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="border-b bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-3 py-2">부서명</th>
            <th className="px-3 py-2 w-24">관리</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="px-3 py-2 font-medium">{t.name}</td>
              <td className="px-3 py-2">
                <button type="button" onClick={() => onEdit(t)} className="mr-2 text-[#0070C9] hover:underline">
                  수정
                </button>
                <button type="button" onClick={() => void handleDelete(t.id)} className="text-rose-600 hover:underline">
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ManagersSection({
  teams,
  managers,
  onRefresh,
  onMsg,
  onEdit,
  onAdd,
}: {
  teams: Team[];
  managers: User[];
  onRefresh: () => void;
  onMsg: (s: string) => void;
  onEdit: (m: User) => void;
  onAdd: () => void;
}) {
  const handleDelete = async (id: string) => {
    if (!confirm("이 팀장을 삭제하시겠습니까?")) return;
    try {
      await apiFetch(`/api/users/${id}`, { method: "DELETE" });
      onMsg("삭제되었습니다.");
      onRefresh();
    } catch (e) {
      onMsg(e instanceof Error ? e.message : "삭제 실패");
    }
  };

  return (
    <section className="rounded-xl border bg-white p-5">
      <div className="mb-4 flex justify-between">
        <h2 className="text-lg font-semibold text-slate-900">팀장 목록</h2>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-lg bg-[#0070C9] px-4 py-2 text-sm font-semibold text-white"
        >
          + 팀장 추가
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="border-b bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-3 py-2">이름</th>
            <th className="px-3 py-2">부서</th>
            <th className="px-3 py-2 w-24">관리</th>
          </tr>
        </thead>
        <tbody>
          {managers.map((m) => (
            <tr key={m.id} className="border-b">
              <td className="px-3 py-2 font-medium">{m.name}</td>
              <td className="px-3 py-2">{teams.find((t) => t.id === m.teamId)?.name || "-"}</td>
              <td className="px-3 py-2">
                <button type="button" onClick={() => onEdit(m)} className="mr-2 text-[#0070C9] hover:underline">
                  수정
                </button>
                <button type="button" onClick={() => void handleDelete(m.id)} className="text-rose-600 hover:underline">
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function MembersSection({
  teams,
  managers,
  members,
  onRefresh,
  onMsg,
  onEdit,
  onAdd,
}: {
  teams: Team[];
  managers: User[];
  members: Employee[];
  onRefresh: () => void;
  onMsg: (s: string) => void;
  onEdit: (m: Employee) => void;
  onAdd: () => void;
}) {
  const handleDelete = async (id: string) => {
    if (!confirm("이 팀원을 삭제하시겠습니까?")) return;
    try {
      await apiFetch(`/api/members/${id}`, { method: "DELETE" });
      onMsg("삭제되었습니다.");
      onRefresh();
    } catch (e) {
      onMsg(e instanceof Error ? e.message : "삭제 실패");
    }
  };

  return (
    <section className="rounded-xl border bg-white p-5">
      <div className="mb-4 flex justify-between">
        <h2 className="text-lg font-semibold text-slate-900">팀원 목록 (전체)</h2>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-lg bg-[#0070C9] px-4 py-2 text-sm font-semibold text-white"
        >
          + 팀원 추가
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="border-b bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-3 py-2">이름</th>
            <th className="px-3 py-2">부서</th>
            <th className="px-3 py-2">팀장</th>
            <th className="px-3 py-2">직무</th>
            <th className="px-3 py-2 w-24">관리</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="border-b">
              <td className="px-3 py-2 font-medium">{m.name}</td>
              <td className="px-3 py-2">{teams.find((t) => t.id === m.teamId)?.name || "-"}</td>
              <td className="px-3 py-2">{managers.find((u) => u.id === m.managerId)?.name || "-"}</td>
              <td className="px-3 py-2">{m.role || "-"}</td>
              <td className="px-3 py-2">
                <button type="button" onClick={() => onEdit(m)} className="mr-2 text-[#0070C9] hover:underline">
                  수정
                </button>
                <button type="button" onClick={() => void handleDelete(m.id)} className="text-rose-600 hover:underline">
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function TeamModal({
  team,
  onClose,
  onSaved,
}: {
  team: Team | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(team?.name || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      if (team) {
        await apiFetch(`/api/teams/${team.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name: name.trim() }),
        });
      } else {
        await apiFetch("/api/teams", {
          method: "POST",
          body: JSON.stringify({ name: name.trim() }),
        });
      }
      onSaved();
    } catch (e) {
      alert(e instanceof Error ? e.message : "저장 실패");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl bg-white p-6">
        <h3 className="text-lg font-semibold">{team ? "부서 수정" : "부서 추가"}</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="부서명"
          className="mt-3 w-full rounded-lg border px-3 py-2"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg bg-slate-100 px-4 py-2">
            취소
          </button>
          <button type="submit" className="rounded-lg bg-[#0070C9] px-4 py-2 text-white">
            저장
          </button>
        </div>
      </form>
    </div>
  );
}

function ManagerModal({
  teams,
  manager,
  onClose,
  onSaved,
}: {
  teams: Team[];
  manager: User | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(manager?.name || "");
  const [teamId, setTeamId] = useState(manager?.teamId || "");
  const [employeeNo, setEmployeeNo] = useState(
    manager?.id ? manager.id.replace("mgr_", "") : "",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !teamId) return;
    try {
      if (manager) {
        await apiFetch(`/api/users/${manager.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name: name.trim(), teamId }),
        });
      } else {
        if (!employeeNo.trim()) {
          alert("사번은 필수입니다.");
          return;
        }
        await apiFetch("/api/users", {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            teamId,
            employeeNo: employeeNo.trim(),
          }),
        });
      }
      onSaved();
    } catch (e) {
      alert(e instanceof Error ? e.message : "저장 실패");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl bg-white p-6">
        <h3 className="text-lg font-semibold">{manager ? "팀장 수정" : "팀장 추가"}</h3>
        <div className="mt-3 space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="이름"
            className="w-full rounded-lg border px-3 py-2"
          />
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            required
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="">부서 선택</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {!manager && (
            <input
              value={employeeNo}
              onChange={(e) => setEmployeeNo(e.target.value)}
              required
              placeholder="사번"
              className="w-full rounded-lg border px-3 py-2"
            />
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg bg-slate-100 px-4 py-2">
            취소
          </button>
          <button type="submit" className="rounded-lg bg-[#0070C9] px-4 py-2 text-white">
            저장
          </button>
        </div>
      </form>
    </div>
  );
}

function MemberModal({
  teams,
  managers,
  member,
  onClose,
  onSaved,
}: {
  teams: Team[];
  managers: User[];
  member: Employee | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(member?.name || "");
  const [role, setRole] = useState(member?.role || "");
  const [teamId, setTeamId] = useState(member?.teamId || "");
  const [managerId, setManagerId] = useState(member?.managerId || "");

  const managersInTeam = managers.filter((m) => !teamId || m.teamId === teamId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      if (member) {
        const body: { name: string; role: string; teamId?: string; managerId?: string } = {
          name: name.trim(),
          role: role.trim(),
        };
        if (teamId && managerId) {
          body.teamId = teamId;
          body.managerId = managerId;
        }
        await apiFetch(`/api/members/${member.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        if (!teamId || !managerId) {
          alert("부서와 팀장을 선택하세요.");
          return;
        }
        await apiFetch("/api/members", {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            role: role.trim(),
            teamId,
            managerId,
          }),
        });
      }
      onSaved();
    } catch (e) {
      alert(e instanceof Error ? e.message : "저장 실패");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl bg-white p-6">
        <h3 className="text-lg font-semibold">{member ? "팀원 수정" : "팀원 추가"}</h3>
        <div className="mt-3 space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="이름"
            className="w-full rounded-lg border px-3 py-2"
          />
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="직무"
            className="w-full rounded-lg border px-3 py-2"
          />
          <select
            value={teamId}
            onChange={(e) => {
              setTeamId(e.target.value);
              setManagerId("");
            }}
            required
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="">부서 선택</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            required
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="">팀장 선택</option>
            {managersInTeam.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg bg-slate-100 px-4 py-2">
            취소
          </button>
          <button type="submit" className="rounded-lg bg-[#0070C9] px-4 py-2 text-white">
            저장
          </button>
        </div>
      </form>
    </div>
  );
}
