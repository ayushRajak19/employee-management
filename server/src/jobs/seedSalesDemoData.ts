import { ChannelPartner } from "../models/ChannelPartner.js";
import { Department } from "../models/Department.js";
import { Employee } from "../models/Employee.js";
import { EmployeeTerritoryAssignment } from "../models/EmployeeTerritoryAssignment.js";
import { GeoNode } from "../models/GeoNode.js";
import { SalesConfiguration } from "../models/SalesConfiguration.js";
import { SalesCustomer } from "../models/SalesCustomer.js";
import { SalesLead } from "../models/SalesLead.js";
import { SalesOpportunity } from "../models/SalesOpportunity.js";
import { SalesRevenueTransaction } from "../models/SalesRevenueTransaction.js";
import { SalesTarget } from "../models/SalesTarget.js";
import { SalesTerritory } from "../models/SalesTerritory.js";

export const seedSalesDemoData = async (): Promise<void> => {
  const world = await GeoNode.findOneAndUpdate({ code: "WORLD" }, { $setOnInsert: { name: "World", type: "GLOBAL", ancestors: [], depth: 0, isActive: true } }, { upsert: true, new: true });
  const india = await GeoNode.findOneAndUpdate({ code: "IN" }, { $setOnInsert: { name: "India", type: "COUNTRY", parent: world._id, ancestors: [world._id], depth: 1, isActive: true, location: { type: "Point", coordinates: [78.9629, 20.5937] } } }, { upsert: true, new: true });
  const state = await GeoNode.findOneAndUpdate({ code: "IN-CG" }, { $setOnInsert: { name: "Chhattisgarh", type: "STATE", parent: india._id, ancestors: [world._id, india._id], depth: 2, isActive: true, location: { type: "Point", coordinates: [81.8661, 21.2787] } } }, { upsert: true, new: true });
  const cityData = [
    ["Raipur", "IN-CG-RPR", 81.6296, 21.2514],
    ["Durg", "IN-CG-DUR", 81.2849, 21.1904],
    ["Bilaspur", "IN-CG-BSP", 82.1409, 22.0797],
  ] as const;
  const cities = [];
  for (const [name, code, longitude, latitude] of cityData) {
    cities.push(await GeoNode.findOneAndUpdate({ code }, { $setOnInsert: { name, type: "DISTRICT", parent: state._id, ancestors: [world._id, india._id, state._id], depth: 3, isActive: true, location: { type: "Point", coordinates: [longitude, latitude] } } }, { upsert: true, new: true }));
  }
  const rootTerritory = await SalesTerritory.findOneAndUpdate({ code: "CG-SALES" }, { $setOnInsert: { name: "Chhattisgarh Sales", ancestors: [], status: "ACTIVE", effectiveFrom: new Date("2026-01-01"), coverageRules: { geoNodeIds: [state._id] } } }, { upsert: true, new: true });
  const childTerritories = [];
  for (const city of cities) {
    childTerritories.push(await SalesTerritory.findOneAndUpdate({ code: `${city.code}-SALES` }, { $setOnInsert: { name: city.name, parentTerritory: rootTerritory._id, ancestors: [rootTerritory._id], status: "ACTIVE", effectiveFrom: new Date("2026-01-01"), coverageRules: { geoNodeIds: [city._id] } } }, { upsert: true, new: true }));
  }
  await SalesConfiguration.findOneAndUpdate({ key: "DEFAULT" }, { $setOnInsert: { defaultLeadCapacityPerEmployee: 300, responseSlaMinutes: 240, healthyConversionRate: 15, opportunityWeights: { demand: 20, coverageGap: 25, customerWhiteSpace: 15, pipelinePotential: 15, growth: 10, conversionPotential: 15 } } }, { upsert: true });
  const department = await Department.findOne({ capabilities: "SALES_MODULE", isActive: true });
  if (!department) return;
  const employees = await Employee.find({ department: department._id, isActive: true }).limit(3);
  const periodStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 0, 23, 59, 59));
  for (const [index, employee] of employees.entries()) {
    const territory = childTerritories[index % childTerritories.length]!;
    const city = cities[index % cities.length]!;
    await Employee.updateOne({ _id: employee._id, "workLocation.geoNode": { $exists: false } }, { $set: { workLocation: { geoNode: city._id, coordinates: city.location } } });
    await EmployeeTerritoryAssignment.findOneAndUpdate({ employee: employee._id, territory: territory._id, effectiveFrom: new Date("2026-01-01") }, { $setOnInsert: { assignmentRole: index === 0 ? "MANAGER" : "MEMBER", primary: true, leadCapacityPerMonth: 300, isActive: true } }, { upsert: true });
    const customer = await SalesCustomer.findOneAndUpdate({ name: `Demo customer ${index + 1}`, ownerEmployee: employee._id }, { $setOnInsert: { territory: territory._id, geoNode: city._id, status: "ACTIVE", customerType: "SMB", lifetimeRevenue: 150000 * (index + 1), currency: "INR" } }, { upsert: true, new: true });
    await SalesLead.findOneAndUpdate({ name: `Demo lead ${index + 1}`, ownerEmployee: employee._id }, { $setOnInsert: { territory: territory._id, geoNode: city._id, status: index === 0 ? "CONVERTED" : "QUALIFIED", source: "DEMO_SEED", estimatedValue: 250000 * (index + 1), currency: "INR", firstResponseAt: new Date(), ...(index === 0 ? { convertedAt: new Date(), customer: customer._id } : {}) } }, { upsert: true });
    await SalesOpportunity.findOneAndUpdate({ name: `Demo opportunity ${index + 1}`, ownerEmployee: employee._id }, { $setOnInsert: { customer: customer._id, territory: territory._id, geoNode: city._id, stage: "Proposal", estimatedValue: 400000 * (index + 1), currency: "INR", probability: 60, expectedCloseDate: periodEnd, status: "OPEN" } }, { upsert: true });
    await SalesTarget.findOneAndUpdate({ employee: employee._id, periodStart }, { $setOnInsert: { territory: territory._id, periodType: "MONTHLY", periodEnd, revenueTarget: 500000 * (index + 1), currency: "INR", leadTarget: 30, conversionTarget: 15, customerAcquisitionTarget: 5, status: "ACTIVE" } }, { upsert: true });
    await SalesRevenueTransaction.findOneAndUpdate({ employee: employee._id, reference: `DEMO-${periodStart.toISOString().slice(0, 7)}` }, { $setOnInsert: { customer: customer._id, territory: territory._id, geoNode: city._id, amount: 150000 * (index + 1), currency: "INR", transactionDate: new Date(), source: "DEMO_SEED" } }, { upsert: true });
  }
  if (employees[0]) await ChannelPartner.findOneAndUpdate({ code: "DEMO-CG-DIST" }, { $setOnInsert: { name: "Demo Chhattisgarh Distributor", type: "DISTRIBUTOR", territory: rootTerritory._id, ownerEmployee: employees[0]._id, geoNode: state._id, status: "ACTIVE", effectiveFrom: new Date("2026-01-01") } }, { upsert: true });
};
