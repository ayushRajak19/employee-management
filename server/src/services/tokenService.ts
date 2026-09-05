import { createHash, randomUUID } from "node:crypto";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AccessPayload extends JwtPayload { sub: string; tenantId?: string; type: "access" }
export interface RefreshPayload extends JwtPayload { sub: string; tenantId?: string; family: string; type: "refresh" }
export const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");
export const createAccessToken = (userId: string, tenantId: string): string => jwt.sign({ type: "access", tenantId }, env.JWT_ACCESS_SECRET, { subject: userId, expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"] });
export const createRefreshToken = (userId: string, tenantId: string, family: string = randomUUID()): { token: string; family: string; expiresAt: Date } => {
  const token = jwt.sign({ type: "refresh", family, tenantId }, env.JWT_REFRESH_SECRET, { subject: userId, jwtid: randomUUID(), expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"] });
  const decoded = jwt.decode(token) as JwtPayload;
  return { token, family, expiresAt: new Date((decoded.exp ?? 0) * 1000) };
};
export const verifyAccessToken = (token: string): AccessPayload => jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
export const verifyRefreshToken = (token: string): RefreshPayload => jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
