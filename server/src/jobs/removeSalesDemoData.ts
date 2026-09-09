import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { ChannelPartner } from "../models/ChannelPartner.js";
import { Employee } from "../models/Employee.js";
import { EmployeeTerritoryAssignment } from "../models/EmployeeTerritoryAssignment.js";
import { GeoNode } from "../models/GeoNode.js";
import { SalesCustomer } from "../models/SalesCustomer.js";
import { SalesLead } from "../models/SalesLead.js";
import { SalesOpportunity } from "../models/SalesOpportunity.js";
import { SalesRevenueTransaction } from "../models/SalesRevenueTransaction.js";
import { SalesTarget } from "../models/SalesTarget.js";
import { SalesTerritory } from "../models/SalesTerritory.js";
import { runWithTenant } from "../tenancy/tenantContext.js";

const demoGeoCodes = ["IN", "IN-CG", "IN-CG-RPR", "IN-CG-DUR", "IN-CG-BSP"];
const demoTerritoryCodes = ["CG-SALES", "IN-CG-RPR-SALES", "IN-CG-DUR-SALES", "IN-CG-BSP-SALES"];
const demoCustomerName = /^Demo customer [1-3]$/i;
const demoLeadName = /^Demo lead [1-3]$/i;
const demoOpportunityName = /^Demo opportunity [1-3]$/i;

const run = async (): Promise<void> => {
  const { defaultTenantId } = await connectDatabase();
  try {
    await runWithTenant(defaultTenantId, async () => {
      const demoGeographies = await GeoNode.find({
        code: { $in: demoGeoCodes },
        createdBy: { $exists: false },
      }).select("_id code").lean();
      const geoIds = demoGeographies.map((item) => item._id);
      const demoTerritories = await SalesTerritory.find({
        code: { $in: demoTerritoryCodes },
        ownerEmployee: { $exists: false },
        effectiveFrom: new Date("2026-01-01"),
      }).select("_id code").lean();
      const territoryIds = demoTerritories.map((item) => item._id);

      const [leads, customers, opportunities, revenue, partners, targets, assignments] = await Promise.all([
        SalesLead.find({ $or: [{ source: "DEMO_SEED" }, { name: demoLeadName, territory: { $in: territoryIds } }] }).select("_id").lean(),
        SalesCustomer.find({ name: demoCustomerName, territory: { $in: territoryIds } }).select("_id").lean(),
        SalesOpportunity.find({ name: demoOpportunityName, territory: { $in: territoryIds } }).select("_id").lean(),
        SalesRevenueTransaction.find({ $or: [{ source: "DEMO_SEED" }, { reference: /^DEMO-/, territory: { $in: territoryIds } }] }).select("_id").lean(),
        ChannelPartner.find({ code: "DEMO-CG-DIST", territory: { $in: territoryIds } }).select("_id").lean(),
        SalesTarget.find({
          territory: { $in: territoryIds },
          periodType: "MONTHLY",
          revenueTarget: { $in: [500_000, 1_000_000, 1_500_000] },
          leadTarget: 30,
          conversionTarget: 15,
          customerAcquisitionTarget: 5,
        }).select("_id").lean(),
        EmployeeTerritoryAssignment.find({
          territory: { $in: territoryIds },
          effectiveFrom: new Date("2026-01-01"),
          leadCapacityPerMonth: 300,
          primary: true,
        }).select("_id employee").lean(),
      ]);

      const assignedEmployeeIds = assignments.map((item) => item.employee);
      const seededEmployeeLocations = geoIds.length && assignedEmployeeIds.length
        ? await Employee.countDocuments({ _id: { $in: assignedEmployeeIds }, "workLocation.geoNode": { $in: geoIds } })
        : 0;
      const preview = {
        leads: leads.length,
        customers: customers.length,
        opportunities: opportunities.length,
        revenue: revenue.length,
        channelPartners: partners.length,
        targets: targets.length,
        assignments: assignments.length,
        employeeLocations: seededEmployeeLocations,
        territories: demoTerritories.map((item) => item.code),
        geographies: demoGeographies.map((item) => item.code),
      };
      console.log("Sales demo cleanup preview", preview);
      if (process.env.CLEANUP_SALES_DEMO_CONFIRM !== "REMOVE_SALES_DEMO_DATA") {
        console.log("Preview only. Set CLEANUP_SALES_DEMO_CONFIRM=REMOVE_SALES_DEMO_DATA to delete these records.");
        return;
      }

      await Promise.all([
        SalesLead.deleteMany({ _id: { $in: leads.map((item) => item._id) } }),
        SalesOpportunity.deleteMany({ _id: { $in: opportunities.map((item) => item._id) } }),
        SalesRevenueTransaction.deleteMany({ _id: { $in: revenue.map((item) => item._id) } }),
        ChannelPartner.deleteMany({ _id: { $in: partners.map((item) => item._id) } }),
        SalesTarget.deleteMany({ _id: { $in: targets.map((item) => item._id) } }),
        EmployeeTerritoryAssignment.deleteMany({ _id: { $in: assignments.map((item) => item._id) } }),
      ]);
      await SalesCustomer.deleteMany({ _id: { $in: customers.map((item) => item._id) } });
      if (seededEmployeeLocations) {
        await Employee.updateMany(
          { _id: { $in: assignedEmployeeIds }, "workLocation.geoNode": { $in: geoIds } },
          { $unset: { workLocation: 1 } },
        );
      }

      const territoryReferences = territoryIds.length ? {
        leads: Boolean(await SalesLead.exists({ territory: { $in: territoryIds } })),
        customers: Boolean(await SalesCustomer.exists({ territory: { $in: territoryIds } })),
        opportunities: Boolean(await SalesOpportunity.exists({ territory: { $in: territoryIds } })),
        revenue: Boolean(await SalesRevenueTransaction.exists({ territory: { $in: territoryIds } })),
        targets: Boolean(await SalesTarget.exists({ territory: { $in: territoryIds } })),
        channelPartners: Boolean(await ChannelPartner.exists({ territory: { $in: territoryIds } })),
        assignments: Boolean(await EmployeeTerritoryAssignment.exists({ territory: { $in: territoryIds } })),
        childTerritories: Boolean(await SalesTerritory.exists({ _id: { $nin: territoryIds }, $or: [{ parentTerritory: { $in: territoryIds } }, { ancestors: { $in: territoryIds } }] })),
      } : {};
      const retainedTerritoryReferences = Object.entries(territoryReferences).filter(([, item]) => item).map(([name]) => name);
      const removedTerritories = territoryIds.length > 0 && retainedTerritoryReferences.length === 0;
      if (removedTerritories) await SalesTerritory.deleteMany({ _id: { $in: territoryIds } });

      const geographyReferences = geoIds.length ? {
        childGeographies: Boolean(await GeoNode.exists({ _id: { $nin: geoIds }, $or: [{ parent: { $in: geoIds } }, { ancestors: { $in: geoIds } }] })),
        employeeLocations: Boolean(await Employee.exists({ "workLocation.geoNode": { $in: geoIds } })),
        leads: Boolean(await SalesLead.exists({ geoNode: { $in: geoIds } })),
        customers: Boolean(await SalesCustomer.exists({ geoNode: { $in: geoIds } })),
        opportunities: Boolean(await SalesOpportunity.exists({ geoNode: { $in: geoIds } })),
        revenue: Boolean(await SalesRevenueTransaction.exists({ geoNode: { $in: geoIds } })),
        channelPartners: Boolean(await ChannelPartner.exists({ geoNode: { $in: geoIds } })),
        territories: Boolean(await SalesTerritory.exists({ "coverageRules.geoNodeIds": { $in: geoIds } })),
      } : {};
      const retainedGeographyReferences = Object.entries(geographyReferences).filter(([, item]) => item).map(([name]) => name);
      const removedGeographies = geoIds.length > 0 && retainedGeographyReferences.length === 0;
      if (removedGeographies) await GeoNode.deleteMany({ _id: { $in: geoIds } });

      console.log("Sales demo data removed", {
        ...preview,
        territoriesRemoved: removedTerritories ? territoryIds.length : 0,
        geographiesRemoved: removedGeographies ? geoIds.length : 0,
        retainedTerritoryReferences,
        retainedGeographyReferences,
      });
    });
  } finally {
    await disconnectDatabase();
  }
};

void run().catch((error: unknown) => {
  console.error("Sales demo cleanup failed", error);
  process.exit(1);
});
