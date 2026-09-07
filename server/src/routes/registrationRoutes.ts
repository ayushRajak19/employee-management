import { Router } from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { z } from "zod";
import { env } from "../config/env.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { createTenantSchema } from "../validators/tenantValidators.js";
import { createTenant } from "../services/tenantService.js";
import { Tenant } from "../models/Tenant.js";

const details = createTenantSchema.shape.body.omit({ temporaryPassword: true, plan: true });
const finish = z.object({ token: z.string().min(20).max(4096), password: createTenantSchema.shape.body.shape.temporaryPassword });
export const registrationRouter = Router();
registrationRouter.use(rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false, message: { success: false, message: "Too many registration attempts. Please try again in an hour." } }));
registrationRouter.post("/request", validate(z.object({ body: details })), asyncHandler(async (request, response) => {
  const input = details.parse(request.body);
  const host = process.env.MAIL_HOST || env.SMTP_HOST;
  const user = process.env.MAIL_USERNAME || env.SMTP_USER;
  const pass = process.env.MAIL_PASSWORD || env.SMTP_PASSWORD;
  if (!host || !user || !pass) throw new AppError("Organization registration email is not configured yet. Please contact support.", 503);
  if (await Tenant.exists({ slug: input.slug })) throw new AppError("That organization ID is already in use", 409);
  const token = jwt.sign({ ...input, purpose: "organization-registration" }, env.JWT_ACCESS_SECRET, { expiresIn: "30m", audience: "organization-registration", issuer: "mobius-ems" });
  const url = new URL("/register", env.CLIENT_URL);
  url.hash = new URLSearchParams({ token }).toString();
  const port = Number(process.env.MAIL_PORT || env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({ host, port, secure: port === 465, requireTLS: port !== 465, auth: { user, pass }, connectionTimeout: 10000, socketTimeout: 20000 });
  try {
    await transport.sendMail({ from: { name: process.env.MAIL_FROM_NAME || "MobiusEMS", address: process.env.MAIL_FROM_ADDRESS || user }, to: input.adminEmail, subject: "Verify your MobiusEMS organization registration", text: `Verify your email to create ${input.name} on MobiusEMS.\n\n${url.toString()}\n\nThis link expires in 30 minutes. If you did not request it, ignore this email.` });
  } catch { throw new AppError("We could not send the verification email. Please try again later.", 503); }
  finally { transport.close(); }
  response.json({ success: true, message: "Check your email for the verification link." });
}));
registrationRouter.post("/complete", validate(z.object({ body: finish })), asyncHandler(async (request, response) => {
  const input = finish.parse(request.body);
  let verified;
  try {
    const payload = jwt.verify(input.token, env.JWT_ACCESS_SECRET, { algorithms: ["HS256"], audience: "organization-registration", issuer: "mobius-ems" });
    if (typeof payload === "string" || payload.purpose !== "organization-registration") throw new Error();
    verified = details.parse(payload);
  } catch { throw new AppError("Verification link is invalid or expired. Please register again.", 400); }
  const tenant = await createTenant({ ...verified, plan: "STANDARD", temporaryPassword: input.password });
  response.status(201).json({ success: true, message: "Organization created. Sign in with your organization ID and password.", data: { slug: tenant!.slug } });
}));
