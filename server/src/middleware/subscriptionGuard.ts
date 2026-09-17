import type { RequestHandler } from "express";
import type { PlanFeatures } from "@mobius-ems/shared";
import { AppError } from "../utils/AppError.js";

const readableFeatureNames: Record<keyof PlanFeatures, string> = {
  aiEnabled: "AI Workspace & Assistance",
  salesModuleEnabled: "Sales Intelligence & CRM",
  emailAutomationEnabled: "Email Marketing & Automation",
  voiceTasksEnabled: "Voice Task Capture",
  advancedAnalyticsEnabled: "Advanced Analytics & Heatmaps",
  customRolesEnabled: "Custom Roles & Permissions",
};

/**
 * Ensures the tenant has an active subscription.
 * Blocks mutating actions (POST, PUT, PATCH, DELETE) when subscription is EXPIRED or CANCELLED.
 */
export const requireActiveSubscription: RequestHandler = (request, _response, next) => {
  if (!request.user) return next();

  const status = request.user.subscriptionStatus;
  if (status === "EXPIRED" || status === "CANCELLED") {
    // Read operations (GET, HEAD, OPTIONS) are allowed so users can access their records
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
    if (isMutation) {
      return next(
        new AppError(
          "Your organization's subscription has expired. Administrative mutations are restricted until the subscription is renewed.",
          402,
          "SUBSCRIPTION_EXPIRED"
        )
      );
    }
  }

  next();
};

/**
 * Feature gate middleware that enforces whether the tenant's current subscription plan includes the required module.
 */
export const requireFeature = (featureKey: keyof PlanFeatures): RequestHandler => (request, _response, next) => {
  if (!request.user) {
    return next(new AppError("Authentication required", 401, "UNAUTHENTICATED"));
  }

  const features = request.user.features;
  const isEnabled = Boolean(features && features[featureKey]);

  if (!isEnabled) {
    const label = readableFeatureNames[featureKey] ?? featureKey;
    return next(
      new AppError(
        `The ${label} module is not included in your organization's current subscription plan (${request.user.plan ?? "STANDARD"}). Please upgrade your plan to access this feature.`,
        403,
        "FEATURE_NOT_IN_PLAN"
      )
    );
  }

  next();
};
