import { Router, type RequestHandler } from "express";
import * as controller from "../controllers/salesController.js";
import { authenticate, requireAnyPermission, requirePermission } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  assignmentSchema,
  createChannelPartnerSchema,
  createCustomerSchema,
  createGeoSchema,
  createLeadSchema,
  createOpportunitySchema,
  createRevenueSchema,
  createTargetSchema,
  createTerritorySchema,
  employeeAnalyticsSchema,
  geoIdSchema,
  salesIdSchema,
  territoryIdSchema,
  updateChannelPartnerSchema,
  updateCustomerSchema,
  updateGeoSchema,
  updateLeadSchema,
  updateOpportunitySchema,
  updateRevenueSchema,
  updateTargetSchema,
  updateTerritorySchema,
  configurationSchema,
} from "../validators/salesValidators.js";
import type { SalesEntityName } from "../services/salesDataService.js";

export const salesRouter = Router();
salesRouter.use(authenticate);

const salesView = requireAnyPermission("sales.view.self", "sales.view.team", "sales.view.all");
const salesAnalytics = requireAnyPermission("sales.analytics.self", "sales.analytics.team", "sales.analytics.all");
const salesMap = requireAnyPermission("sales.map.self", "sales.map.team", "sales.map.all");
const asEntity = (name: SalesEntityName): RequestHandler => (request, _response, next) => { request.params.entity = name; next(); };

salesRouter.get("/me/analytics", salesAnalytics, asyncHandler(controller.selfAnalytics));
salesRouter.get("/team/analytics", requireAnyPermission("sales.analytics.team", "sales.analytics.all"), asyncHandler(controller.teamAnalytics));
salesRouter.get("/analytics/overview", salesAnalytics, asyncHandler(controller.overviewAnalytics));
salesRouter.get("/employees", salesView, asyncHandler(controller.salesEmployees));
salesRouter.get("/employees/:employeeId/analytics", salesAnalytics, validate(employeeAnalyticsSchema), asyncHandler(controller.employeeAnalytics));

salesRouter.get("/geography/tree", salesMap, asyncHandler(controller.geographyTree));
salesRouter.post("/geography", requireAnyPermission("sales.configuration.manage", "sales.geography.create.self"), validate(createGeoSchema), asyncHandler(controller.createGeography));
salesRouter.get("/geography/:geoId", salesMap, validate(geoIdSchema), asyncHandler(controller.geographyDetail));
salesRouter.get("/geography/:geoId/children", salesMap, validate(geoIdSchema), asyncHandler(controller.geographyChildren));
salesRouter.get("/geography/:geoId/analytics", salesMap, validate(geoIdSchema), asyncHandler(controller.geographyAnalytics));
salesRouter.get("/geography/:geoId/trends", salesMap, validate(geoIdSchema), asyncHandler(controller.geographyAnalytics));
salesRouter.patch("/geography/:geoId", requirePermission("sales.configuration.manage"), validate(updateGeoSchema), asyncHandler(controller.updateGeography));

salesRouter.get("/territories", requirePermission("sales.territory.view"), asyncHandler(controller.listTerritories));
salesRouter.post("/territories", requireAnyPermission("sales.territory.manage", "sales.territory.create.self"), validate(createTerritorySchema), asyncHandler(controller.createTerritory));
salesRouter.post("/territories/assignments", requireAnyPermission("sales.territory.manage", "sales.territory.create.self"), validate(assignmentSchema), asyncHandler(controller.assignTerritory));
salesRouter.get("/territories/:territoryId", requirePermission("sales.territory.view"), validate(territoryIdSchema), asyncHandler(controller.territoryDetail));
salesRouter.patch("/territories/:territoryId", requirePermission("sales.territory.manage"), validate(updateTerritorySchema), asyncHandler(controller.updateTerritory));
salesRouter.get("/territories/:territoryId/analytics", salesAnalytics, validate(territoryIdSchema), asyncHandler(controller.territoryAnalytics));
salesRouter.get("/territories/:territoryId/employees", salesView, validate(territoryIdSchema), asyncHandler(controller.territoryEmployees));
for (const name of ["leads", "customers", "opportunities"] as const) {
  salesRouter.get(`/territories/:territoryId/${name === "opportunities" ? "pipeline" : name}`, salesView, validate(territoryIdSchema), asEntity(name), asyncHandler(controller.listTerritoryData));
}
salesRouter.get("/territories/:territoryId/capacity", salesAnalytics, validate(territoryIdSchema), asyncHandler(controller.territoryAnalytics));
salesRouter.get("/territories/:territoryId/opportunity", salesAnalytics, validate(territoryIdSchema), asyncHandler(controller.territoryAnalytics));

const dataRoutes = [
  { path: "leads", entity: "leads", view: salesView, manage: requireAnyPermission("sales.lead.manage.self", "sales.lead.manage.team", "sales.lead.manage.all"), create: createLeadSchema, update: updateLeadSchema },
  { path: "customers", entity: "customers", view: requirePermission("sales.customer.view"), manage: requirePermission("sales.configuration.manage"), create: createCustomerSchema, update: updateCustomerSchema },
  { path: "pipeline", entity: "opportunities", view: requirePermission("sales.pipeline.view"), manage: requirePermission("sales.pipeline.manage"), create: createOpportunitySchema, update: updateOpportunitySchema },
  { path: "targets", entity: "targets", view: requirePermission("sales.target.view"), manage: requirePermission("sales.target.manage"), create: createTargetSchema, update: updateTargetSchema },
  { path: "revenue", entity: "revenue", view: requirePermission("sales.revenue.view"), manage: requirePermission("sales.revenue.manage"), create: createRevenueSchema, update: updateRevenueSchema },
  { path: "channel-partners", entity: "channelPartners", view: requirePermission("sales.channel_partner.view"), manage: requireAnyPermission("sales.channel_partner.manage", "sales.channel_partner.manage.self"), create: createChannelPartnerSchema, update: updateChannelPartnerSchema },
] as const;
for (const route of dataRoutes) {
  salesRouter.get(`/${route.path}`, route.view, asEntity(route.entity), asyncHandler(controller.listData));
  salesRouter.post(`/${route.path}`, route.manage, validate(route.create), asEntity(route.entity), asyncHandler(controller.createData));
  salesRouter.patch(`/${route.path}/:id`, route.manage, validate(route.update), validate(salesIdSchema), asEntity(route.entity), asyncHandler(controller.updateData));
}

salesRouter.get("/configuration", requirePermission("sales.configuration.manage"), asyncHandler(controller.getConfiguration));
salesRouter.put("/configuration", requirePermission("sales.configuration.manage"), validate(configurationSchema), asyncHandler(controller.updateConfiguration));

export const employeeMapRouter = Router();
employeeMapRouter.use(authenticate);
employeeMapRouter.get("/", requireAnyPermission("employee_map.self", "employee_map.team", "employee_map.all"), asyncHandler(controller.employeeMap));
