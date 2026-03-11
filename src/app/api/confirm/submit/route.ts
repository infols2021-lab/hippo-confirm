import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyConfirmToken } from "@/lib/confirm/token";
import { findRecordByApplicationNumber } from "@/lib/google/sheets-read";
import { submitConfirmResponse } from "@/lib/google/sheets-write";

const bodySchema = z.object({
  token: z.string().min(10),
  action: z.enum(["confirmed", "rejected"]),
});

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid request body", 400);
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

    if (record.confirmResponse === "confirmed") {
      return jsonError("Данные уже подтверждены", 409);
    }

    if (record.confirmResponse === "rejected") {
      return jsonError("Уже отмечено, что данные неверны", 409);
    }

    await submitConfirmResponse({
      sheetName: record.sheetName,
      rowNumber: record.rowNumber,
      action: parsed.data.action,
    });

    return NextResponse.json({
      ok: true,
      message:
        parsed.data.action === "confirmed"
          ? "Данные успешно подтверждены"
          : "Отмечено, что данные неверны",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(message, 500);
  }
}