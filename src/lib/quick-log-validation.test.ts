import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateQuickLogInput } from "@/lib/quick-log-validation";

describe("validateQuickLogInput", () => {
  it("requires employee selection", () => {
    const error = validateQuickLogInput({
      employeeId: "",
      type: "coaching",
      memo: "유효한 메모입니다.",
    });
    assert.equal(error, "팀원을 선택해 주세요.");
  });

  it("requires feedback type selection", () => {
    const error = validateQuickLogInput({
      employeeId: "emp_1",
      type: "",
      memo: "유효한 메모입니다.",
    });
    assert.equal(error, "피드백 유형을 선택해 주세요.");
  });

  it("validates memo length range", () => {
    assert.equal(
      validateQuickLogInput({ employeeId: "emp_1", type: "coaching", memo: "짧음" }),
      "메모는 5~200자로 입력해 주세요.",
    );
    assert.equal(
      validateQuickLogInput({
        employeeId: "emp_1",
        type: "coaching",
        memo: "a".repeat(201),
      }),
      "메모는 5~200자로 입력해 주세요.",
    );
  });

  it("returns null for valid input", () => {
    const error = validateQuickLogInput({
      employeeId: "emp_1",
      type: "coaching",
      memo: "오늘 회의 진행이 매우 좋았습니다.",
    });
    assert.equal(error, null);
  });
});
