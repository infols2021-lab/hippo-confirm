export const SHEET_KEY_TO_NAME = {
  bel: "Белгородская",
  vor: "Воронежская",
  my: "Моя",
} as const;

export type ConfirmSheetKey = keyof typeof SHEET_KEY_TO_NAME;
export type ConfirmSheetName = (typeof SHEET_KEY_TO_NAME)[ConfirmSheetKey];

export const SHEET_KEYS = Object.keys(SHEET_KEY_TO_NAME) as ConfirmSheetKey[];
export const SHEET_NAMES = Object.values(SHEET_KEY_TO_NAME) as ConfirmSheetName[];

export const COLUMN_INDEX = {
  APPLICATION_NUMBER: 2, // B
  STUDENT_NAME: 4, // D
  BIRTH_DATE: 5, // E
  PARENT_EMAIL: 11, // K
  ENGLISH_SCHOOL: 12, // L
  AGE: 18, // R
  CATEGORY: 19, // S
  FORMAT: 28, // AB

  CONFIRM_STATUS: 44, // AR
  CONFIRM_SENT_AT: 45, // AS
  CONFIRM_ANSWERED_AT: 46, // AT
  CONFIRM_TOKEN_VERSION: 47, // AU
  CONFIRM_RESPONSE: 48, // AV
} as const;

export const COLUMN_LETTER = {
  CONFIRM_STATUS: "AR",
  CONFIRM_SENT_AT: "AS",
  CONFIRM_ANSWERED_AT: "AT",
  CONFIRM_TOKEN_VERSION: "AU",
  CONFIRM_RESPONSE: "AV",
} as const;

export const READ_RANGE_END = "AV";

export const CONFIRM_STATUS_TEXT = {
  PENDING: "ожидает ответа",
  CONFIRMED: "подтверждено",
  REJECTED: "данные неверны",
} as const;

export const CONFIRM_RESPONSE_VALUE = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  REJECTED: "rejected",
} as const;