export type UserRole = "MANAGER" | "HR";

export type User = {
  id: string;
  name: string;
  role: UserRole;
  teamId?: string;
  password?: string;
};

export type Team = {
  id: string;
  name: string;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  teamId: string;
  managerId: string;
  active: boolean;
};

export type FeedbackType = "praise" | "growth" | "improve" | "coaching" | "other";

export type FeedbackLog = {
  id: string;
  employeeId: string;
  managerId: string;
  type: FeedbackType;
  memo: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MemberNote = {
  id: string;
  ownerUid: string;
  memberId: string;
  nextAction: string;
  updatedAt: string;
};

export type SummaryScopeType = "EMPLOYEE" | "TEAM";

export type SummaryFilters = {
  startDate: string;
  endDate: string;
  type?: FeedbackType | "all";
  tags?: string[];
};

export type Summary = {
  id: string;
  scopeType: SummaryScopeType;
  scopeId: string;
  filters: SummaryFilters;
  sourceLogIds: string[];
  sourceFingerprint?: string;
  summaryText: string;
  modelVersion: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type LeadershipAssessment = {
  id: string;
  ownerUid: string;
  monthKey: string;
  scores: Record<string, number>;
  totalScore: number;
  memo: string;
  createdAt: string;
};
