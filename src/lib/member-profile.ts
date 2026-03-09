type MemberPatchBody = {
  name?: string;
  role?: string;
};

type MemberPatchResult = {
  updates: {
    name?: string;
    role?: string;
  };
  error?: string;
};

export function buildMemberProfilePatch(body: MemberPatchBody): MemberPatchResult {
  const updates: MemberPatchResult["updates"] = {};

  if (Object.prototype.hasOwnProperty.call(body, "name")) {
    const trimmedName = (body.name || "").trim();
    if (!trimmedName) {
      return { updates: {}, error: "이름은 공백으로 저장할 수 없습니다." };
    }
    updates.name = trimmedName;
  }

  if (Object.prototype.hasOwnProperty.call(body, "role")) {
    const trimmedRole = (body.role || "").trim();
    updates.role = trimmedRole || "미지정";
  }

  if (Object.keys(updates).length === 0) {
    return { updates: {}, error: "수정할 항목이 없습니다." };
  }

  return { updates };
}
