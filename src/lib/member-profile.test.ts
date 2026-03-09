import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildMemberProfilePatch } from "@/lib/member-profile";

describe("buildMemberProfilePatch", () => {
  it("trims and returns name and role updates", () => {
    const result = buildMemberProfilePatch({
      name: "  홍길동  ",
      role: "  디자이너  ",
    });

    assert.equal(result.error, undefined);
    assert.deepEqual(result.updates, {
      name: "홍길동",
      role: "디자이너",
    });
  });

  it("returns fallback role when role is blank", () => {
    const result = buildMemberProfilePatch({
      role: "   ",
    });

    assert.equal(result.error, undefined);
    assert.deepEqual(result.updates, {
      role: "미지정",
    });
  });

  it("returns error when name is provided but blank", () => {
    const result = buildMemberProfilePatch({
      name: "   ",
    });

    assert.equal(result.error, "이름은 공백으로 저장할 수 없습니다.");
  });

  it("returns error when there are no updatable fields", () => {
    const result = buildMemberProfilePatch({});

    assert.equal(result.error, "수정할 항목이 없습니다.");
  });
});
