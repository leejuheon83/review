import type { Employee, FeedbackLog, MemberNote, Summary, Team, User } from "@/lib/types";

export const seedTeams: Team[] = [
  { id: "team_mgmt", name: "경영지원팀" },
  { id: "team_sales_1", name: "영업1팀" },
  { id: "team_sales_2", name: "영업2팀" },
  { id: "team_sales_3", name: "영업3팀" },
  { id: "team_sales_4", name: "영업4팀" },
  { id: "team_sales_5", name: "영업5팀" },
  { id: "team_sales_6", name: "영업6팀" },
  { id: "team_ad_plan", name: "광고기획팀" },
  { id: "team_public_network", name: "공공/네트워크팀" },
  { id: "team_bid", name: "사업입찰팀" },
];

export const seedUsers: User[] = [
  { id: "admin", name: "관리자", role: "HR", password: "admin" },
  { id: "mgr_120032", name: "이주현", role: "MANAGER", teamId: "team_mgmt", password: "120032" },
  { id: "mgr_110038", name: "김상윤", role: "MANAGER", teamId: "team_sales_1", password: "110038" },
  { id: "mgr_110022", name: "박건도", role: "MANAGER", teamId: "team_sales_2", password: "110022" },
  { id: "mgr_150002", name: "박진수", role: "MANAGER", teamId: "team_sales_3", password: "150002" },
  { id: "mgr_120019", name: "고영곤", role: "MANAGER", teamId: "team_sales_4", password: "120019" },
  { id: "mgr_240003", name: "김주동", role: "MANAGER", teamId: "team_sales_5", password: "240003" },
  { id: "mgr_130003", name: "이혜영", role: "MANAGER", teamId: "team_sales_6", password: "130003" },
  { id: "mgr_120023", name: "박우영", role: "MANAGER", teamId: "team_ad_plan", password: "120023" },
  { id: "mgr_120003", name: "박설웅", role: "MANAGER", teamId: "team_public_network", password: "120003" },
  { id: "mgr_120044", name: "유태종", role: "MANAGER", teamId: "team_bid", password: "120044" },
];

export const seedEmployees: Employee[] = [
  { id: "emp_110007", name: "채희성", role: "", teamId: "team_mgmt", managerId: "mgr_120032", active: true },
  { id: "emp_110010", name: "곽대현", role: "", teamId: "team_mgmt", managerId: "mgr_120032", active: true },
  { id: "emp_130007", name: "김지석", role: "", teamId: "team_mgmt", managerId: "mgr_120032", active: true },
  { id: "emp_160002", name: "김동혁", role: "", teamId: "team_mgmt", managerId: "mgr_120032", active: true },
  { id: "emp_200018", name: "이도우", role: "", teamId: "team_mgmt", managerId: "mgr_120032", active: true },
  { id: "emp_130013", name: "정은실", role: "", teamId: "team_mgmt", managerId: "mgr_120032", active: true },
  { id: "emp_140002", name: "박민경", role: "", teamId: "team_mgmt", managerId: "mgr_120032", active: true },
  { id: "emp_140006", name: "신민규", role: "", teamId: "team_mgmt", managerId: "mgr_120032", active: true },
  { id: "emp_200012", name: "신상범", role: "", teamId: "team_mgmt", managerId: "mgr_120032", active: true },
  { id: "emp_250001", name: "이현우", role: "", teamId: "team_mgmt", managerId: "mgr_120032", active: true },

  { id: "emp_140009", name: "안창규", role: "", teamId: "team_sales_1", managerId: "mgr_110038", active: true },
  { id: "emp_120017", name: "김병관", role: "", teamId: "team_sales_1", managerId: "mgr_110038", active: true },
  { id: "emp_180007", name: "이병구", role: "", teamId: "team_sales_1", managerId: "mgr_110038", active: true },
  { id: "emp_230002", name: "김재영", role: "", teamId: "team_sales_1", managerId: "mgr_110038", active: true },
  { id: "emp_240001", name: "최성우", role: "", teamId: "team_sales_1", managerId: "mgr_110038", active: true },

  { id: "emp_250002", name: "도대권", role: "", teamId: "team_sales_2", managerId: "mgr_110022", active: true },
  { id: "emp_160004", name: "박동빈", role: "", teamId: "team_sales_2", managerId: "mgr_110022", active: true },
  { id: "emp_170007", name: "김도훈", role: "", teamId: "team_sales_2", managerId: "mgr_110022", active: true },
  { id: "emp_240007", name: "장준영", role: "", teamId: "team_sales_2", managerId: "mgr_110022", active: true },

  { id: "emp_150011", name: "고지현", role: "", teamId: "team_sales_3", managerId: "mgr_150002", active: true },
  { id: "emp_110046", name: "최훈", role: "", teamId: "team_sales_3", managerId: "mgr_150002", active: true },
  { id: "emp_120039", name: "이승재", role: "", teamId: "team_sales_3", managerId: "mgr_150002", active: true },
  { id: "emp_130011", name: "이해선", role: "", teamId: "team_sales_3", managerId: "mgr_150002", active: true },
  { id: "emp_170002", name: "이세영", role: "", teamId: "team_sales_3", managerId: "mgr_150002", active: true },
  { id: "emp_210015", name: "허준", role: "", teamId: "team_sales_3", managerId: "mgr_150002", active: true },
  { id: "emp_240002", name: "한혜정", role: "", teamId: "team_sales_3", managerId: "mgr_150002", active: true },

  { id: "emp_120036", name: "김어진", role: "", teamId: "team_sales_4", managerId: "mgr_120019", active: true },
  { id: "emp_170009", name: "양종식", role: "", teamId: "team_sales_4", managerId: "mgr_120019", active: true },
  { id: "emp_240005", name: "정광진", role: "", teamId: "team_sales_4", managerId: "mgr_120019", active: true },
  { id: "emp_170003", name: "박상현", role: "", teamId: "team_sales_4", managerId: "mgr_120019", active: true },
  { id: "emp_240006", name: "박민석", role: "", teamId: "team_sales_4", managerId: "mgr_120019", active: true },

  { id: "emp_240004", name: "정현수", role: "", teamId: "team_sales_5", managerId: "mgr_240003", active: true },
  { id: "emp_130010", name: "엄용진", role: "", teamId: "team_sales_5", managerId: "mgr_240003", active: true },
  { id: "emp_200014", name: "최상현", role: "", teamId: "team_sales_5", managerId: "mgr_240003", active: true },
  { id: "emp_220005", name: "김기훈", role: "", teamId: "team_sales_5", managerId: "mgr_240003", active: true },

  { id: "emp_130005", name: "김호진", role: "", teamId: "team_sales_6", managerId: "mgr_130003", active: true },
  { id: "emp_160003", name: "김현아", role: "", teamId: "team_sales_6", managerId: "mgr_130003", active: true },
  { id: "emp_150009", name: "최형경", role: "", teamId: "team_sales_6", managerId: "mgr_130003", active: true },
  { id: "emp_170006", name: "이슬기", role: "", teamId: "team_sales_6", managerId: "mgr_130003", active: true },
  { id: "emp_210014", name: "조우진", role: "", teamId: "team_sales_6", managerId: "mgr_130003", active: true },
  { id: "emp_250003", name: "서지윤", role: "", teamId: "team_sales_6", managerId: "mgr_130003", active: true },

  { id: "emp_110035", name: "이상훈", role: "", teamId: "team_ad_plan", managerId: "mgr_120023", active: true },
  { id: "emp_120005", name: "신용철", role: "", teamId: "team_ad_plan", managerId: "mgr_120023", active: true },
  { id: "emp_120018", name: "박종의", role: "", teamId: "team_ad_plan", managerId: "mgr_120023", active: true },
  { id: "emp_110011", name: "박민상", role: "", teamId: "team_ad_plan", managerId: "mgr_120023", active: true },
  { id: "emp_110039", name: "안형민", role: "", teamId: "team_ad_plan", managerId: "mgr_120023", active: true },
  { id: "emp_210016", name: "박예나", role: "", teamId: "team_ad_plan", managerId: "mgr_120023", active: true },
  { id: "emp_140004", name: "송현영", role: "", teamId: "team_ad_plan", managerId: "mgr_120023", active: true },
  { id: "emp_240008", name: "정재원", role: "", teamId: "team_ad_plan", managerId: "mgr_120023", active: true },
  { id: "emp_210013", name: "이연우", role: "", teamId: "team_ad_plan", managerId: "mgr_120023", active: true },
  { id: "emp_250007", name: "나연재", role: "", teamId: "team_ad_plan", managerId: "mgr_120023", active: true },
  { id: "emp_220006", name: "송은경", role: "", teamId: "team_ad_plan", managerId: "mgr_120023", active: true },

  { id: "emp_140012", name: "임진", role: "", teamId: "team_public_network", managerId: "mgr_120003", active: true },
  { id: "emp_130001", name: "권기혁", role: "", teamId: "team_public_network", managerId: "mgr_120003", active: true },
  { id: "emp_120040", name: "최선하", role: "", teamId: "team_public_network", managerId: "mgr_120003", active: true },
  { id: "emp_130002", name: "이석희", role: "", teamId: "team_public_network", managerId: "mgr_120003", active: true },
  { id: "emp_120014", name: "전기범", role: "", teamId: "team_public_network", managerId: "mgr_120003", active: true },
  { id: "emp_120042", name: "유영수", role: "", teamId: "team_public_network", managerId: "mgr_120003", active: true },
  { id: "emp_120041", name: "김홍근", role: "", teamId: "team_public_network", managerId: "mgr_120003", active: true },
  { id: "emp_120029", name: "김진만", role: "", teamId: "team_public_network", managerId: "mgr_120003", active: true },
  { id: "emp_250005", name: "차진우", role: "", teamId: "team_public_network", managerId: "mgr_120003", active: true },

  { id: "emp_190002", name: "김정희", role: "", teamId: "team_bid", managerId: "mgr_120044", active: true },
  { id: "emp_220004", name: "윤기삼", role: "", teamId: "team_bid", managerId: "mgr_120044", active: true },
  { id: "emp_250006", name: "김현호", role: "", teamId: "team_bid", managerId: "mgr_120044", active: true },
  { id: "emp_250004", name: "서지훈", role: "", teamId: "team_bid", managerId: "mgr_120044", active: true },
];

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export const seedLogs: FeedbackLog[] = [];

export const seedNotes: MemberNote[] = [
  ...seedUsers.slice(0, 6).map((manager, idx) => {
    const firstMember = seedEmployees.find((e) => e.managerId === manager.id);
    return {
      id: `note_${firstMember?.id || idx}`,
      ownerUid: manager.id,
      memberId: firstMember?.id || seedEmployees[idx].id,
      nextAction: "다음 1:1에서 이번 주 실행 항목 1개를 점검하기",
      updatedAt: daysAgo(idx + 1),
    };
  }),
];

export const seedSummaries: Summary[] = [];
