import { createHash, randomUUID } from "node:crypto";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export interface RefreshPayload extends JwtPayload { sub: string; family: string; type: "refresh" }
export const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");
export const createAccessToken = (userId: string): string => jwt.sign({ type: "access" }, env.JWT_ACCESS_SECRET, { subject: userId, expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"] });
export const createRefreshToken = (userId: string, family: string = randomUUID()): { token: string; family: string; expiresAt: Date } => {
  const token = jwt.sign({ type: "refresh", family }, env.JWT_REFRESH_SECRET, { subject: userId, jwtid: randomUUID(), expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"] });
  const decoded = jwt.decode(token) as JwtPayload;
  return { token, family, expiresAt: new Date((decoded.exp ?? 0) * 1000) };
};
export const verifyAccessToken = (token: string): JwtPayload => jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
export const verifyRefreshToken = (token: string): RefreshPayload => jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
