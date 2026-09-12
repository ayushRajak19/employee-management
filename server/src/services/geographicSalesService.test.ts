import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCapacityBottlenecks,
  determineWhiteSpaceRecommendation,
  rollupHierarchyMetrics,
  type HierarchyNodeRecord,
  type NodeDataRecord,
} from "./geographicSalesService.js";

test("Hierarchy Aggregation Test: Country (India) -> State (Maharashtra) -> District (Pune) rollups", () => {
  const indiaId = "geo_india";
  const maharashtraId = "geo_maharashtra";
  const puneId = "geo_pune";

  const nodes: HierarchyNodeRecord[] = [
    {
      _id: indiaId,
      name: "India",
      code: "IN",
      type: "COUNTRY",
      parent: "global",
      ancestors: ["global"],
      depth: 1,
      location: { type: "Point", coordinates: [78.9629, 20.5937] },
    },
    {
      _id: maharashtraId,
      name: "Maharashtra",
      code: "IN-MH",
      type: "STATE",
      parent: indiaId,
      ancestors: ["global", indiaId],
      depth: 2,
      location: { type: "Point", coordinates: [75.7139, 19.7515] },
    },
    {
      _id: puneId,
      name: "Pune",
      code: "IN-MH-PUN",
      type: "DISTRICT",
      parent: maharashtraId,
      ancestors: ["global", indiaId, maharashtraId],
      depth: 3,
      location: { type: "Point", coordinates: [73.8567, 18.5204] },
    },
  ];

  // Add leads (120) and won revenue (6,000,000) under Pune
  const nodeDataMap: Record<string, NodeDataRecord> = {
    [puneId]: {
      leadCount: 120,
      convertedLeadCount: 18,
      actualRevenue: 6_000_000,
      salesQuantity: 120,
      salesTransactionCount: 4,
      pipelineValue: 2_500_000,
      assignedTarget: 5_000_000,
      customerCount: 15,
      activeHeadcount: 2,
      channelPartnerCount: 1,
      averageDealValue: 333_333,
      configuredCapacityPerRep: 50,
    },
  };

  // 1. Query Maharashtra: verify it aggregates Pune's data
  const mhResult = rollupHierarchyMetrics(nodes, nodeDataMap, maharashtraId);
  assert.equal(mhResult.node._id, maharashtraId);
  assert.equal(mhResult.node.leadCount, 120, "Maharashtra must aggregate Pune's lead count");
  assert.equal(mhResult.node.actualRevenue, 6_000_000, "Maharashtra must aggregate Pune's revenue");
  assert.equal(mhResult.node.salesQuantity, 120, "Maharashtra must aggregate Pune's sold quantity");
  assert.equal(mhResult.node.salesTransactionCount, 4);
  assert.equal(mhResult.node.pipelineValue, 2_500_000);
  assert.equal(mhResult.node.customerCount, 15);
  assert.equal(mhResult.node.activeHeadcount, 2);
  assert.equal(mhResult.node.channelPartnerCount, 1);
  assert.equal(mhResult.children.length, 1, "Maharashtra's immediate child should be Pune");
  assert.equal(mhResult.children[0]!._id, puneId);
  assert.equal(mhResult.children[0]!.actualRevenue, 6_000_000);

  // 2. Query India: verify it aggregates Maharashtra's data (which includes Pune)
  const indiaResult = rollupHierarchyMetrics(nodes, nodeDataMap, indiaId);
  assert.equal(indiaResult.node._id, indiaId);
  assert.equal(indiaResult.node.leadCount, 120, "India must aggregate Pune's lead count via Maharashtra");
  assert.equal(indiaResult.node.actualRevenue, 6_000_000, "India must aggregate Pune's revenue via Maharashtra");
  assert.equal(indiaResult.node.salesQuantity, 120, "India must aggregate quantity through every hierarchy level");
  assert.equal(indiaResult.node.pipelineValue, 2_500_000);
  assert.equal(indiaResult.children.length, 1, "India's immediate child should be Maharashtra");
  assert.equal(indiaResult.children[0]!._id, maharashtraId);
  assert.equal(indiaResult.children[0]!.actualRevenue, 6_000_000);
  assert.equal(indiaResult.children[0]!.leadCount, 120);
});

test("global rollup never returns the stored GLOBAL root as its own child", () => {
  const result = rollupHierarchyMetrics([
    { _id: "world", name: "World", code: "WORLD", type: "GLOBAL", ancestors: [], depth: 0 },
    { _id: "india", name: "India", code: "IN", type: "COUNTRY", parent: "world", ancestors: ["world"], depth: 1 },
  ], {}, "global");
  assert.deepEqual(result.children.map((node) => node.name), ["India"]);
});

test("Capacity Bottleneck & Opportunity Lost Test: 1000 leads, 1 rep, 100 capacity, ₹50k deal, 10% conversion", () => {
  const result = calculateCapacityBottlenecks(1000, 1, 100, 50000, 10);

  // 1,000 / 100 = 10 reps needed. 1 active rep -> gap is 9
  assert.equal(result.requiredHeadcount, 10);
  assert.equal(result.activeHeadcount, 1);
  assert.equal(result.headcountGap, 9, "headcountGap must equal 9");
  assert.equal(result.isCapacityBottleneck, true, "isCapacityBottleneck must be true");

  // estimatedOpportunityLost === 9 * 100 * 50000 * 0.10 = ₹45,00,000
  const expectedLost = 9 * 100 * 50000 * 0.10;
  assert.equal(result.estimatedOpportunityLost, 4_500_000, "estimatedOpportunityLost must equal ₹45,00,000");
  assert.equal(result.estimatedOpportunityLost, expectedLost);
  assert.equal(result.capacityStatus, "CRITICAL");
});

test("White-Space Recommendation Test: Node with leads > 50 and activeHeadcount == 0 returns APPOINT_CHANNEL_PARTNER", () => {
  const rec = determineWhiteSpaceRecommendation({
    leadCount: 75,
    activeHeadcount: 0,
    channelPartnerCount: 0,
  });

  assert.ok(
    rec.includes("APPOINT_CHANNEL_PARTNER"),
    `Expected recommendation to include APPOINT_CHANNEL_PARTNER, got ${rec}`
  );
  assert.equal(rec, "HIGH_EXPANSION_OPPORTUNITY: APPOINT_CHANNEL_PARTNER");
});

test("Decision Engine: High lead volume with active reps and high conversion recommends HIRE_SALES_REP", () => {
  const rec = determineWhiteSpaceRecommendation({
    leadCount: 300,
    activeHeadcount: 2, // 150 leads per rep
    channelPartnerCount: 1,
    conversionRate: 16,
    healthyConversionRate: 12,
  });

  assert.ok(rec.includes("HIRE_SALES_REP"));
  assert.equal(rec, "CAPACITY_BOTTLENECK: HIRE_SALES_REP");
});

test("Decision Engine: Low lead volume with high reps recommends REALIGN_TERRITORY", () => {
  const rec = determineWhiteSpaceRecommendation({
    leadCount: 10,
    activeHeadcount: 3,
    channelPartnerCount: 1,
    conversionRate: 10,
  });

  assert.ok(rec.includes("REALIGN_TERRITORY"));
  assert.equal(rec, "OVER_CAPACITY: REALIGN_TERRITORY");
});

test("Capacity status bands reflect healthy, approaching, and critical thresholds", () => {
  // Healthy: 30 leads, 1 rep (capacity 50) -> 60% utilization
  const healthy = calculateCapacityBottlenecks(30, 1, 50, 40000, 10);
  assert.equal(healthy.capacityStatus, "HEALTHY");
  assert.equal(healthy.isCapacityBottleneck, false);
  assert.equal(healthy.headcountGap, 0);

  // Approaching: 45 leads, 1 rep (capacity 50) -> 90% utilization
  const approaching = calculateCapacityBottlenecks(45, 1, 50, 40000, 10);
  assert.equal(approaching.capacityStatus, "APPROACHING");
  assert.equal(approaching.isCapacityBottleneck, false);
  assert.equal(approaching.headcountGap, 0);

  // Critical: 60 leads, 1 rep (capacity 50) -> 120% utilization, gap 1
  const critical = calculateCapacityBottlenecks(60, 1, 50, 40000, 10);
  assert.equal(critical.capacityStatus, "CRITICAL");
  assert.equal(critical.isCapacityBottleneck, true);
  assert.equal(critical.headcountGap, 1);
});
