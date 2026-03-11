import type { ConfirmSheetName } from "./constants";

export type ConfirmAction = "confirmed" | "rejected";

export type ConfirmRecord = {
  sheetName: ConfirmSheetName;
  rowNumber: number;
  applicationNumber: string;
  studentName: string;
  birthDate: string;
  englishSchool: string;
  age: string;
  category: string;
  format: string;

  confirmStatus: string;
  confirmSentAt: string;
  confirmAnsweredAt: string;
  confirmTokenVersion: number;
  confirmResponse: string;
};

export type ConfirmTokenPayload = {
  sheetName: ConfirmSheetName;
  applicationNumber: string;
  version: number;
};