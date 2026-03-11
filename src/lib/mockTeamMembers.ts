import type { Employee } from "@/lib/types";

export const MOCK_TEAM_MEMBERS: Employee[] = [
  { id: "emp_mock_1", name: "김지석", role: "개발", teamId: "team_alpha", managerId: "m1", active: true },
  { id: "emp_mock_2", name: "이수진", role: "디자인", teamId: "team_alpha", managerId: "m1", active: true },
  { id: "emp_mock_3", name: "박민수", role: "기획", teamId: "team_alpha", managerId: "m1", active: true },
  { id: "emp_mock_4", name: "최영희", role: "마케팅", teamId: "team_alpha", managerId: "m1", active: true },
  { id: "emp_mock_5", name: "정대현", role: "운영", teamId: "team_alpha", managerId: "m1", active: true },
];
