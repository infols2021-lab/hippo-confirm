import { NextResponse } from "next/server";
import { z } from "zod";
import { findRecordByApplicationNumber } from "@/lib/google/sheets-read";
import { verifyConfirmToken } from "@/lib/confirm/token";

const querySchema = z.object({
  token: z.string().min(10),
});

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = querySchema.safeParse({
      token: searchParams.get("token"),
    });

    if (!parsed.success) {
      return jsonError("Missing or invalid token", 400);
    }

    const payload = await verifyConfirmToken(parsed.data.token);

    const record = await findRecordByApplicationNumber(
      payload.sheetName,
      payload.applicationNumber
    );

    if (!record) {
      return jsonError("Record not found", 404);
    }

    if (record.confirmTokenVersion !== payload.version) {
      return jsonError("This confirmation link is outdated", 409);
    }

    return NextResponse.json({
      ok: true,
      record: {
        sheetName: record.sheetName,
        applicationNumber: record.applicationNumber,
        studentName: record.studentName,
        birthDate: record.birthDate,
        englishSchool: record.englishSchool,
        age: record.age,
        category: record.category,
        format: record.format,
        confirmStatus: record.confirmStatus,
        confirmResponse: record.confirmResponse,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(message, 500);
  }
}