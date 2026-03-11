import {
  COLUMN_LETTER,
  CONFIRM_RESPONSE_VALUE,
  CONFIRM_STATUS_TEXT,
  type ConfirmSheetName,
} from "@/lib/confirm/constants";
import type { ConfirmAction } from "@/lib/confirm/types";
import { getSheetsClient, getSpreadsheetId } from "./sheets";

function nowIso() {
  return new Date().toISOString();
}

export async function markConfirmLinkSent(params: {
  sheetName: ConfirmSheetName;
  rowNumber: number;
  version: number;
}) {
  const { sheetName, rowNumber, version } = params;

  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: [
        {
          range: `${sheetName}!${COLUMN_LETTER.CONFIRM_STATUS}${rowNumber}`,
          values: [[CONFIRM_STATUS_TEXT.PENDING]],
        },
        {
          range: `${sheetName}!${COLUMN_LETTER.CONFIRM_SENT_AT}${rowNumber}`,
          values: [[nowIso()]],
        },
        {
          range: `${sheetName}!${COLUMN_LETTER.CONFIRM_ANSWERED_AT}${rowNumber}`,
          values: [[""]],
        },
        {
          range: `${sheetName}!${COLUMN_LETTER.CONFIRM_TOKEN_VERSION}${rowNumber}`,
          values: [[String(version)]],
        },
        {
          range: `${sheetName}!${COLUMN_LETTER.CONFIRM_RESPONSE}${rowNumber}`,
          values: [[CONFIRM_RESPONSE_VALUE.PENDING]],
        },
      ],
    },
  });
}

export async function submitConfirmResponse(params: {
  sheetName: ConfirmSheetName;
  rowNumber: number;
  action: ConfirmAction;
}) {
  const { sheetName, rowNumber, action } = params;

  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const statusText =
    action === "confirmed"
      ? CONFIRM_STATUS_TEXT.CONFIRMED
      : CONFIRM_STATUS_TEXT.REJECTED;

  const responseValue =
    action === "confirmed"
      ? CONFIRM_RESPONSE_VALUE.CONFIRMED
      : CONFIRM_RESPONSE_VALUE.REJECTED;

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: [
        {
          range: `${sheetName}!${COLUMN_LETTER.CONFIRM_STATUS}${rowNumber}`,
          values: [[statusText]],
        },
        {
          range: `${sheetName}!${COLUMN_LETTER.CONFIRM_ANSWERED_AT}${rowNumber}`,
          values: [[nowIso()]],
        },
        {
          range: `${sheetName}!${COLUMN_LETTER.CONFIRM_RESPONSE}${rowNumber}`,
          values: [[responseValue]],
        },
      ],
    },
  });
}