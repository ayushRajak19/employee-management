import type { Request, Response } from "express";
import * as analytics from "../services/salesAnalyticsService.js";
import * as configuration from "../services/salesConfigurationService.js";
import * as data from "../services/salesDataService.js";
import { employeeMap as getEmployeeMap } from "../services/employeeMapService.js";
import * as geography from "../services/geoService.js";
import * as territories from "../services/salesTerritoryService.js";
import * as targetPerformance from "../services/targetPerformanceService.js";
import * as reminderService from "../services/targetReminderService.js";
import { SalesTarget, type SalesTargetDocument } from "../models/SalesTarget.js";
import type { Types } from "mongoose";
import { AppError } from "../utils/AppError.js";

const send = (response: Response, message: string, value: unknown, status = 200) => {
  response.status(status).json({ success: true, message, data: value });
};
export const countrySales = async (request: Request, response: Response) => send(response, "Country sales retrieved", await data.countrySales(request.user!));

export const selfAnalytics = async (request: Request, response: Response) => send(response, "Sales analytics retrieved", await analytics.selfAnalytics(request.user!));
export const teamAnalytics = async (request: Request, response: Response) => send(response, "Team sales analytics retrieved", await analytics.overviewAnalytics(request.user!));
export const overviewAnalytics = async (request: Request, response: Response) => send(response, "Sales overview retrieved", await analytics.overviewAnalytics(request.user!));
export const employeeAnalytics = async (request: Request, response: Response) => send(response, "Employee sales analytics retrieved", await analytics.employeeAnalytics(request.user!, String(request.params.employeeId)));
export const salesEmployees = async (request: Request, response: Response) => send(response, "Sales employees retrieved", { items: await analytics.listSalesEmployees(request.user!) });

export const geographyTree = async (request: Request, response: Response) => send(response, "Sales geography retrieved", { items: await geography.geographyTree(request.user!) });
export const geographyDetail = async (request: Request, response: Response) => send(response, "Geography retrieved", { item: await geography.getGeoNode(request.user!, String(request.params.geoId)) });
export const geographyChildren = async (request: Request, response: Response) => send(response, "Geography children retrieved", { items: await geography.geoChildren(request.user!, String(request.params.geoId)) });
export const geographyAnalytics = async (request: Request, response: Response) => send(response, "Geographic sales analytics retrieved", await analytics.geoAnalytics(request.user!, String(request.params.geoId)));
export const createGeography = async (request: Request, response: Response) => send(response, "Geography created", { item: await geography.createGeoNode(request.user!, request.body) }, 201);
export const updateGeography = async (request: Request, response: Response) => send(response, "Geography updated", { item: await geography.updateGeoNode(request.user!, String(request.params.geoId), request.body) });

export const listTerritories = async (request: Request, response: Response) => send(response, "Sales territories retrieved", { items: await territories.listTerritories(request.user!) });
export const territoryDetail = async (request: Request, response: Response) => send(response, "Sales territory retrieved", { item: await territories.getTerritory(request.user!, String(request.params.territoryId)) });
export const territoryAnalytics = async (request: Request, response: Response) => send(response, "Territory analytics retrieved", await analytics.territoryAnalytics(request.user!, String(request.params.territoryId)));
export const territoryEmployees = async (request: Request, response: Response) => send(response, "Territory employees retrieved", { items: await territories.territoryEmployees(request.user!, String(request.params.territoryId)) });
export const createTerritory = async (request: Request, response: Response) => send(response, "Sales territory created", { item: await territories.createTerritory(request.user!, request.body) }, 201);
export const updateTerritory = async (request: Request, response: Response) => send(response, "Sales territory updated", { item: await territories.updateTerritory(request.user!, String(request.params.territoryId), request.body) });
export const assignTerritory = async (request: Request, response: Response) => send(response, "Employee assigned to territory", { item: await territories.assignEmployee(request.user!, request.body) }, 201);

const entity = (request: Request) => request.params.entity as data.SalesEntityName;
export const listData = async (request: Request, response: Response) => send(response, "Sales records retrieved", { items: await data.listSalesData(request.user!, entity(request)) });
export const listTerritoryData = async (request: Request, response: Response) => send(response, "Territory sales records retrieved", { items: await data.listTerritorySalesData(request.user!, entity(request), String(request.params.territoryId)) });
export const createData = async (request: Request, response: Response) => send(response, "Sales record created", { item: await data.createSalesData(request.user!, entity(request), request.body) }, 201);
export const updateData = async (request: Request, response: Response) => send(response, "Sales record updated", { item: await data.updateSalesData(request.user!, entity(request), String(request.params.id), request.body) });
export const listActivities = async (request: Request, response: Response) => send(response, "Activities retrieved", { items: await data.listActivities(request.user!, entity(request), String(request.params.id)) });
export const createActivity = async (request: Request, response: Response) => send(response, "Activity created", { item: await data.createActivity(request.user!, entity(request), String(request.params.id), request.body) }, 201);

export const getConfiguration = async (_request: Request, response: Response) => send(response, "Sales configuration retrieved", { configuration: await configuration.getSalesConfiguration() });
export const updateConfiguration = async (request: Request, response: Response) => send(response, "Sales configuration updated", { configuration: await configuration.updateSalesConfiguration(request.user!, request.body) });
export const employeeMap = async (request: Request, response: Response) => send(response, "Employee map retrieved", await getEmployeeMap(request.user!));
export const myTargetPerformance = async (request: Request, response: Response) => send(response, "Target performance retrieved", { items: await targetPerformance.targetPerformance(request.user!) });
export const teamTargetPerformance = async (request: Request, response: Response) => send(response, "Team target performance retrieved", { items: await targetPerformance.targetPerformance(request.user!, true) });
export const commitTarget = async (request: Request, response: Response) => send(response, "Commitment submitted", { item: await targetPerformance.commitToTarget(request.user!, String(request.params.targetId), request.body) }, 201);
export const targetVersions = async (request: Request, response: Response) => send(response, "Target versions retrieved", { items: await data.listTargetVersions(request.user!, String(request.params.targetId)) });
export const targetReminders = async (request: Request, response: Response) => send(response, "Target reminder history retrieved", await reminderService.getTargetReminderStatus(String(request.params.targetId)));
export const triggerTargetReminder = async (request: Request, response: Response) => {
  const target = await SalesTarget.findById(request.params.targetId);
  if (!target) throw new AppError("Target not found", 404);
  const result = await reminderService.processReminderForTarget(target as unknown as SalesTargetDocument & { _id: Types.ObjectId });
  send(response, result.reason, result);
};
export const runReminderCycle = async (_request: Request, response: Response) => {
  await reminderService.runTargetReminderCycle();
  send(response, "Target reminder cycle executed", { success: true });
};
export const simulateCompensation = async (request: Request, response: Response) => send(response, "Compensation simulation completed", targetPerformance.simulateCompensationRule(request.body.ruleConfig, request.body.testScenarios, request.body.targetAmount));
export const closeCompensationPeriod = async (request: Request, response: Response) => send(response, "Compensation period closed and payouts locked", await targetPerformance.closeCompensationPeriod(request.user!, request.body));
export const myPayouts = async (request: Request, response: Response) => send(response, "Payout history retrieved", await targetPerformance.myPayouts(request.user!));
export const periodPayouts = async (request: Request, response: Response) => send(response, "Period payouts retrieved", { items: await targetPerformance.payoutsForPeriod(request.user!, String(request.params.periodId)) });
