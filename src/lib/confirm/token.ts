import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { SHEET_NAMES } from "./constants";
import type { ConfirmTokenPayload } from "./types";

const tokenPayloadSchema = z.object({
  sheetName: z.enum(SHEET_NAMES),
  applicationNumber: z.string().min(1),
  version: z.coerce.number().int().positive(),
});

function getSecret() {
  const secret = process.env.CONFIRM_TOKEN_SECRET;
  if (!secret) {
    throw new Error("CONFIRM_TOKEN_SECRET is missing");
  }
  return new TextEncoder().encode(secret);
}

export async function signConfirmToken(payload: ConfirmTokenPayload) {
  const secret = getSecret();
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresAt = nowSeconds + 60 * 60 * 24 * 30; // 30 дней

  return await new SignJWT({
    sheetName: payload.sheetName,
    applicationNumber: payload.applicationNumber,
    version: payload.version,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(nowSeconds)
    .setExpirationTime(expiresAt)
    .setSubject(`confirm:${payload.sheetName}:${payload.applicationNumber}`)
    .sign(secret);
}

export async function verifyConfirmToken(token: string): Promise<ConfirmTokenPayload> {
  const secret = getSecret();
  const { payload } = await jwtVerify(token, secret);

  const parsed = tokenPayloadSchema.safeParse({
    sheetName: payload.sheetName,
    applicationNumber: payload.applicationNumber,
    version: payload.version,
  });

  if (!parsed.success) {
    throw new Error("Invalid token payload");
  }

  return parsed.data;
}