type EmployeeProfileCardProps = {
  name: string;
  team: string;
  lastMeeting?: string;
  monthlyFeedbackCount: number;
  totalFeedbackCount: number;
};

export default function EmployeeProfileCard({
  name,
  team,
  lastMeeting,
  monthlyFeedbackCount,
  totalFeedbackCount,
}: EmployeeProfileCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-base font-semibold text-slate-900">{name}</div>
      <div className="text-xs text-slate-500">{team}</div>

      <div className="mt-3 space-y-2.5 text-sm">
        <div>
          <div className="text-slate-400">최근 피드백</div>
          <div className="font-medium text-slate-800">{lastMeeting ?? "기록 없음"}</div>
        </div>

        <div>
          <div className="text-slate-400">이번달 피드백</div>
          <div className="font-medium text-slate-800">{monthlyFeedbackCount}회</div>
        </div>

        <div>
          <div className="text-slate-400">누적 피드백</div>
          <div className="font-medium text-slate-800">{totalFeedbackCount}회</div>
        </div>
      </div>
    </div>
  );
}
