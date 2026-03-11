import { NextResponse } from "next/server";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import {
  SHEET_KEY_TO_NAME,
  SHEET_KEYS,
  type ConfirmSheetKey,
} from "@/lib/confirm/constants";
import { findRecordByApplicationNumber } from "@/lib/google/sheets-read";
import { markConfirmLinkSent } from "@/lib/google/sheets-write";
import { signConfirmToken } from "@/lib/confirm/token";

const bodySchema = z.object({
  sheetKey: z.enum(SHEET_KEYS as [ConfirmSheetKey, ...ConfirmSheetKey[]]),
  applicationNumber: z.string().min(1),
});

function jsonError(message: string, status = 400, extra?: unknown) {
  return NextResponse.json(
    { ok: false, error: message, extra: extra ?? null },
    { status }
  );
}

function secureEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function getIssueSecret() {
  const secret = process.env.CONFIRM_ISSUE_SECRET;
  if (!secret) {
    throw new Error("CONFIRM_ISSUE_SECRET is missing");
  }
  return secret;
}

export async function POST(request: Request) {
  try {
    const headerSecret = request.headers.get("x-confirm-issue-secret") || "";
    const envSecret = getIssueSecret();

    if (!secureEqual(headerSecret, envSecret)) {
      return jsonError("Unauthorized", 401);
    }

    const rawBody = await request.json();
    const parsed = bodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return jsonError("Invalid request body", 400, parsed.error.flatten());
    }

    const sheetName = SHEET_KEY_TO_NAME[parsed.data.sheetKey];

    const record = await findRecordByApplicationNumber(
      sheetName,
      parsed.data.applicationNumber
    );

    if (!record) {
      return jsonError("Record not found", 404, {
        sheetKey: parsed.data.sheetKey,
        sheetName,
        applicationNumber: parsed.data.applicationNumber,
      });
    }

    const nextVersion = (record.confirmTokenVersion || 0) + 1;

    await markConfirmLinkSent({
      sheetName: record.sheetName,
      rowNumber: record.rowNumber,
      version: nextVersion,
    });

    const token = await signConfirmToken({
      sheetName: record.sheetName,
      applicationNumber: record.applicationNumber,
      version: nextVersion,
    });

    const baseUrl = (
      process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    ).replace(/\/$/, "");

    return NextResponse.json({
      ok: true,
      token,
      url: `${baseUrl}/confirm/${token}`,
      version: nextVersion,
      rowNumber: record.rowNumber,
      sheetKey: parsed.data.sheetKey,
      sheetName: record.sheetName,
      applicationNumber: record.applicationNumber,
      studentName: record.studentName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(message, 500);
  }
}