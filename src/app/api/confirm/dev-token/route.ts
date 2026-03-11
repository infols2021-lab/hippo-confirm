import { NextResponse } from "next/server";
import { z } from "zod";
import { SHEET_NAMES } from "@/lib/confirm/constants";
import { signConfirmToken } from "@/lib/confirm/token";
import { findRecordByApplicationNumber } from "@/lib/google/sheets-read";
import { markConfirmLinkSent } from "@/lib/google/sheets-write";

const querySchema = z.object({
  sheetName: z.enum(SHEET_NAMES),
  applicationNumber: z.string().min(1),
});

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(request: Request) {
  try {
    if (process.env.NODE_ENV !== "development") {
      return jsonError("Not available outside development", 404);
    }

    const { searchParams } = new URL(request.url);

    const parsed = querySchema.safeParse({
      sheetName: searchParams.get("sheetName"),
      applicationNumber: searchParams.get("applicationNumber"),
    });

    if (!parsed.success) {
      return jsonError("Invalid sheetName or applicationNumber", 400);
    }

    const record = await findRecordByApplicationNumber(
      parsed.data.sheetName,
      parsed.data.applicationNumber
    );

    if (!record) {
      return jsonError("Record not found", 404);
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return NextResponse.json({
      ok: true,
      token,
      url: `${baseUrl}/confirm/${token}`,
      rowNumber: record.rowNumber,
      nextVersion,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(message, 500);
  }
}