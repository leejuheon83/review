import { NextResponse } from "next/server";
import { db, ensureDbReady } from "@/lib/db";
import { forbidden, getActorFromRequest, unauthorized } from "@/lib/auth";
import { buildMeetingExportRows } from "@/lib/hr-export";

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(req: Request) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  if (actor.role !== "HR") return forbidden("HR만 접근 가능합니다.");

  const params = new URL(req.url).searchParams;
  const teamId = params.get("teamId") || "all";
  const managerId = params.get("managerId") || "all";
  const employeeId = params.get("employeeId") || "all";
  const from = params.get("from");
  const to = params.get("to");
  const format = (params.get("format") || "csv").toLowerCase();
  const target = (params.get("target") || "logs").toLowerCase();

  if (target === "meetings") {
    const rows = buildMeetingExportRows(db, {
      teamId,
      managerId,
      employeeId,
      from,
      to,
    });

    if (format === "xls") {
      const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>`;
      const workbookOpen =
        `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ` +
        `xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">` +
        `<Worksheet ss:Name="one-on-one-meetings"><Table>`;
      const headerRow =
        `<Row>` +
        `<Cell><Data ss:Type="String">employee</Data></Cell>` +
        `<Cell><Data ss:Type="String">meetingDate</Data></Cell>` +
        `<Cell><Data ss:Type="String">manager</Data></Cell>` +
        `<Cell><Data ss:Type="String">type</Data></Cell>` +
        `<Cell><Data ss:Type="String">goalSummary</Data></Cell>` +
        `<Cell><Data ss:Type="String">discussionNotes</Data></Cell>` +
        `<Cell><Data ss:Type="String">managerComment</Data></Cell>` +
        `<Cell><Data ss:Type="String">supportNeeded</Data></Cell>` +
        `<Cell><Data ss:Type="String">actionItems</Data></Cell>` +
        `<Cell><Data ss:Type="String">nextMeetingDate</Data></Cell>` +
        `<Cell><Data ss:Type="String">aiSummary</Data></Cell>` +
        `<Cell><Data ss:Type="String">createdAt</Data></Cell>` +
        `</Row>`;
      const bodyRows = rows
        .map(
          (r) =>
            `<Row>` +
            `<Cell><Data ss:Type="String">${escapeXml(r.employee)}</Data></Cell>` +
            `<Cell><Data ss:Type="String">${escapeXml(r.meetingDate)}</Data></Cell>` +
            `<Cell><Data ss:Type="String">${escapeXml(r.manager)}</Data></Cell>` +
            `<Cell><Data ss:Type="String">${escapeXml(r.type)}</Data></Cell>` +
            `<Cell><Data ss:Type="String">${escapeXml(r.goalSummary)}</Data></Cell>` +
            `<Cell><Data ss:Type="String">${escapeXml(r.discussionNotes)}</Data></Cell>` +
            `<Cell><Data ss:Type="String">${escapeXml(r.managerComment)}</Data></Cell>` +
            `<Cell><Data ss:Type="String">${escapeXml(r.supportNeeded)}</Data></Cell>` +
            `<Cell><Data ss:Type="String">${escapeXml(r.actionItems)}</Data></Cell>` +
            `<Cell><Data ss:Type="String">${escapeXml(r.nextMeetingDate)}</Data></Cell>` +
            `<Cell><Data ss:Type="String">${escapeXml(r.aiSummary)}</Data></Cell>` +
            `<Cell><Data ss:Type="String">${escapeXml(r.createdAt)}</Data></Cell>` +
            `</Row>`,
        )
        .join("");
      const workbookClose = `</Table></Worksheet></Workbook>`;
      const xls = [xmlHeader, workbookOpen, headerRow, bodyRows, workbookClose].join("");

      return new NextResponse(xls, {
        headers: {
          "Content-Type": "application/vnd.ms-excel; charset=utf-8",
          "Content-Disposition": "attachment; filename=one-on-one-meetings-by-employee.xls",
        },
      });
    }

    const header =
      "employee,meetingDate,manager,type,goalSummary,discussionNotes,managerComment,supportNeeded,actionItems,nextMeetingDate,aiSummary,createdAt";
    const csvRows = rows.map((r) =>
      [
        r.employee,
        r.meetingDate,
        r.manager,
        r.type,
        escapeCsv(r.goalSummary),
        escapeCsv(r.discussionNotes),
        escapeCsv(r.managerComment),
        escapeCsv(r.supportNeeded),
        escapeCsv(r.actionItems),
        r.nextMeetingDate,
        escapeCsv(r.aiSummary),
        r.createdAt,
      ].join(","),
    );
    const csv = [header, ...csvRows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=one-on-one-meetings-by-employee.csv",
      },
    });
  }

  const rows = db.logs.filter((l) => {
    const manager = db.users.find((u) => u.id === l.managerId);
    const employee = db.employees.find((e) => e.id === l.employeeId);
    if (!manager || !employee) return false;
    if (teamId !== "all" && employee.teamId !== teamId) return false;
    if (managerId !== "all" && manager.id !== managerId) return false;
    if (employeeId !== "all" && employee.id !== employeeId) return false;

    const ts = new Date(l.createdAt).getTime();
    if (from && ts < new Date(from).getTime()) return false;
    if (to && ts > new Date(to).getTime()) return false;
    return true;
  });

  const normalizedRows = rows.map((l) => {
    const manager = db.users.find((u) => u.id === l.managerId)?.name || "";
    const employee = db.employees.find((e) => e.id === l.employeeId)?.name || "";
    return {
      date: l.createdAt,
      manager,
      employee,
      type: l.type,
      memo: l.memo,
      tags: l.tags.join("|"),
    };
  });

  if (format === "xls") {
    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>`;
    const workbookOpen =
      `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ` +
      `xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">` +
      `<Worksheet ss:Name="coaching-logs"><Table>`;
    const headerRow =
      `<Row>` +
      `<Cell><Data ss:Type="String">date</Data></Cell>` +
      `<Cell><Data ss:Type="String">manager</Data></Cell>` +
      `<Cell><Data ss:Type="String">employee</Data></Cell>` +
      `<Cell><Data ss:Type="String">type</Data></Cell>` +
      `<Cell><Data ss:Type="String">memo</Data></Cell>` +
      `<Cell><Data ss:Type="String">tags</Data></Cell>` +
      `</Row>`;
    const bodyRows = normalizedRows
      .map(
        (r) =>
          `<Row>` +
          `<Cell><Data ss:Type="String">${escapeXml(r.date)}</Data></Cell>` +
          `<Cell><Data ss:Type="String">${escapeXml(r.manager)}</Data></Cell>` +
          `<Cell><Data ss:Type="String">${escapeXml(r.employee)}</Data></Cell>` +
          `<Cell><Data ss:Type="String">${escapeXml(r.type)}</Data></Cell>` +
          `<Cell><Data ss:Type="String">${escapeXml(r.memo)}</Data></Cell>` +
          `<Cell><Data ss:Type="String">${escapeXml(r.tags)}</Data></Cell>` +
          `</Row>`,
      )
      .join("");
    const workbookClose = `</Table></Worksheet></Workbook>`;
    const xls = [xmlHeader, workbookOpen, headerRow, bodyRows, workbookClose].join("");

    return new NextResponse(xls, {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": "attachment; filename=coaching-logs.xls",
      },
    });
  }

  const header = "date,manager,employee,type,memo,tags";
  const csvRows = normalizedRows.map((r) =>
    [r.date, r.manager, r.employee, r.type, escapeCsv(r.memo), escapeCsv(r.tags)].join(","),
  );
  const csv = [header, ...csvRows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=coaching-logs.csv",
    },
  });
}
