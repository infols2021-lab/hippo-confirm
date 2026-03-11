import { COLUMN_INDEX, READ_RANGE_END, type ConfirmSheetName } from "@/lib/confirm/constants";
import type { ConfirmRecord } from "@/lib/confirm/types";
import { getSheetsClient, getSpreadsheetId } from "./sheets";

function getCell(row: unknown[], oneBasedColumnIndex: number) {
  const value = row[oneBasedColumnIndex - 1];
  return String(value ?? "").trim();
}

function parseVersion(raw: string) {
  const normalized = raw.replace(",", ".").trim();
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

export async function findRecordByApplicationNumber(
  sheetName: ConfirmSheetName,
  applicationNumber: string
): Promise<ConfirmRecord | null> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const range = `${sheetName}!A2:${READ_RANGE_END}`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    majorDimension: "ROWS",
  });

  const rows = res.data.values ?? [];
  const target = applicationNumber.trim();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (getCell(row, COLUMN_INDEX.APPLICATION_NUMBER) !== target) {
      continue;
    }

    return {
      sheetName,
      rowNumber: i + 2,
      applicationNumber: getCell(row, COLUMN_INDEX.APPLICATION_NUMBER),
      studentName: getCell(row, COLUMN_INDEX.STUDENT_NAME),
      birthDate: getCell(row, COLUMN_INDEX.BIRTH_DATE),
      englishSchool: getCell(row, COLUMN_INDEX.ENGLISH_SCHOOL),
      age: getCell(row, COLUMN_INDEX.AGE),
      category: getCell(row, COLUMN_INDEX.CATEGORY),
      format: getCell(row, COLUMN_INDEX.FORMAT),

      confirmStatus: getCell(row, COLUMN_INDEX.CONFIRM_STATUS),
      confirmSentAt: getCell(row, COLUMN_INDEX.CONFIRM_SENT_AT),
      confirmAnsweredAt: getCell(row, COLUMN_INDEX.CONFIRM_ANSWERED_AT),
      confirmTokenVersion: parseVersion(getCell(row, COLUMN_INDEX.CONFIRM_TOKEN_VERSION)),
      confirmResponse: getCell(row, COLUMN_INDEX.CONFIRM_RESPONSE),
    };
  }

  return null;
}