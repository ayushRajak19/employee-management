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

  if (await Tenant.exists({ slug: input.slug })) {
    throw new AppError("That organization ID is already in use", 409);
  }

  const token = jwt.sign(
    { ...input, purpose: "organization-registration" },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "30m", audience: "organization-registration", issuer: "mobius-ems" }
  );

  const url = new URL("/register", env.CLIENT_URL);
  url.hash = new URLSearchParams({ token }).toString();

  const host = process.env.MAIL_HOST || env.SMTP_HOST;
  const user = process.env.MAIL_USERNAME || env.SMTP_USER;
  const pass = process.env.MAIL_PASSWORD || env.SMTP_PASSWORD;
  const smtpConfigured = Boolean(host && user && pass);
  const brevoConfigured = Boolean(env.EMAIL_AUTOMATION_ENABLED && env.BREVO_API_KEY && env.BREVO_SENDER_EMAIL);

  const emailSubject = "Verify your MobiusEMS organization registration";
  const emailText = `Verify your email to create ${input.name} on MobiusEMS.\n\n${url.toString()}\n\nThis link expires in 30 minutes. If you did not request it, ignore this email.`;
  const emailHtml = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
    <h2 style="color:#0f172a">Verify your MobiusEMS organization</h2>
    <p style="color:#334155;font-size:15px;line-height:1.5">You requested to create <strong>${input.name}</strong> (${input.slug}) on MobiusEMS.</p>
    <div style="margin:28px 0">
      <a href="${url.toString()}" style="background-color:#0284c7;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;display:inline-block">Complete Registration</a>
    </div>
    <p style="color:#64748b;font-size:13px">Or copy this link into your browser:<br><a href="${url.toString()}" style="color:#0284c7;word-break:break-all">${url.toString()}</a></p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
    <p style="color:#94a3b8;font-size:12px">This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
  </div>`;

  // 1. Try SMTP if configured
  if (smtpConfigured) {
    const port = Number(process.env.MAIL_PORT || env.SMTP_PORT || 587);
    const isSecure = port === 465;
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      requireTLS: !isSecure,
      auth: { user, pass },
      connectionTimeout: 10000,
      socketTimeout: 20000,
    });

    try {
      await transport.sendMail({
        from: {
          name: process.env.MAIL_FROM_NAME || env.BREVO_SENDER_NAME || "MobiusEMS",
          address: process.env.MAIL_FROM_ADDRESS || user,
        },
        to: input.adminEmail,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      });

      response.json({
        success: true,
        emailSent: true,
        message: "Check your email for the verification link. It expires in 30 minutes.",
      });
      return;
    } catch (err) {
      console.error("Failed to send SMTP verification email:", err);
      // Fallback to direct token if email delivery failed
      response.json({
        success: true,
        emailSent: false,
        token,
        verificationUrl: url.toString(),
        message: "Verification email could not be sent. You can complete registration directly below.",
      });
      return;
    } finally {
      transport.close();
    }
  }

  // 2. Try Brevo API if configured
  if (brevoConfigured) {
    try {
      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": env.BREVO_API_KEY!,
        },
        body: JSON.stringify({
          sender: { name: env.BREVO_SENDER_NAME, email: env.BREVO_SENDER_EMAIL },
          to: [{ email: input.adminEmail, name: input.adminName }],
          subject: emailSubject,
          textContent: emailText,
          htmlContent: emailHtml,
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (brevoRes.ok) {
        response.json({
          success: true,
          emailSent: true,
          message: "Check your email for the verification link. It expires in 30 minutes.",
        });
        return;
      }

      console.error("Brevo registration email error:", await brevoRes.text());
      response.json({
        success: true,
        emailSent: false,
        token,
        verificationUrl: url.toString(),
        message: "Verification email could not be sent. You can complete registration directly below.",
      });
      return;
    } catch (err) {
      console.error("Brevo dispatch error:", err);
      response.json({
        success: true,
        emailSent: false,
        token,
        verificationUrl: url.toString(),
        message: "Verification email could not be sent. You can complete registration directly below.",
      });
      return;
    }
  }

  // 3. Fallback when neither SMTP nor Brevo is configured on host
  response.json({
    success: true,
    emailSent: false,
    token,
    verificationUrl: url.toString(),
    message: "Email service is not configured on this server. Please choose your administrator password to finish registration directly.",
  });
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
