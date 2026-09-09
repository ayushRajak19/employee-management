import type { SessionUser } from "@mobius-ems/shared";
import { GEO_NODE_TYPES, GeoNode, type GeoNodeDocument, type GeoNodeType } from "../models/GeoNode.js";
import { AppError } from "../utils/AppError.js";
import { writeAudit } from "./auditService.js";
import { assertSalesGeoScope, resolveSalesScope } from "./salesScopeService.js";

const parentType: Partial<Record<GeoNodeType, GeoNodeType>> = {
  COUNTRY: "GLOBAL",
  STATE: "COUNTRY",
  DISTRICT: "STATE",
  CITY: "DISTRICT",
  AREA: "CITY",
  PINCODE: "AREA",
};
type GeoInput = Pick<GeoNodeDocument, "name" | "code" | "type"> & {
  parent?: string;
  location?: GeoNodeDocument["location"];
  boundary?: GeoNodeDocument["boundary"];
};

export const expectedGeoParentType = (type: GeoNodeType) => parentType[type];

const hierarchy = async (type: GeoNodeType, parentId?: string, excludeId?: string) => {
  const expected = parentType[type];
  if (!expected) {
    if (parentId) throw new AppError("Global geography cannot have a parent", 422, "INVALID_GEO_HIERARCHY");
    return { ancestors: [], depth: 0 };
  }
  if (!parentId) throw new AppError(`${type} requires a ${expected} parent`, 422, "INVALID_GEO_HIERARCHY");
  if (parentId === excludeId) throw new AppError("Geography cannot be its own parent", 422, "CIRCULAR_GEO_HIERARCHY");
  const parent = await GeoNode.findOne({ _id: parentId, isActive: true });
  if (!parent) throw new AppError("Parent geography not found", 404);
  if (parent.type !== expected) throw new AppError(`${type} must be below ${expected}`, 422, "INVALID_GEO_HIERARCHY");
  if (excludeId && parent.ancestors.some((id) => id.toString() === excludeId)) {
    throw new AppError("Circular geography hierarchy is not allowed", 422, "CIRCULAR_GEO_HIERARCHY");
  }
  return { ancestors: [...parent.ancestors, parent._id], depth: parent.depth + 1 };
};

export const createGeoNode = async (viewer: SessionUser, input: GeoInput) => {
  const scope = await resolveSalesScope(viewer);
  if (input.parent) assertSalesGeoScope(scope, input.parent);
  const item = await GeoNode.create({ ...input, createdBy: viewer.id, ...(await hierarchy(input.type, input.parent)), isActive: true });
  await writeAudit({ user: viewer.id, action: "SALES_GEOGRAPHY_CREATED", entityType: "GeoNode", entityId: item.id, newValue: input });
  return item;
};

export const updateGeoNode = async (viewer: SessionUser, id: string, input: Partial<GeoInput>) => {
  const node = await GeoNode.findOne({ _id: id, isActive: true });
  if (!node) throw new AppError("Geography not found", 404);
  const previous = node.toObject();
  const type = input.type ?? node.type;
  const parent = input.parent === undefined ? node.parent?.toString() : input.parent;
  const tree = await hierarchy(type, parent, id);
  Object.assign(node, input, tree);
  await node.save();
  const descendants = await GeoNode.find({ ancestors: node._id });
  for (const descendant of descendants) {
    const position = descendant.ancestors.findIndex((ancestor) => ancestor.equals(node._id));
    descendant.ancestors = [...tree.ancestors, node._id, ...descendant.ancestors.slice(position + 1)];
    descendant.depth = descendant.ancestors.length;
    await descendant.save();
  }
  await writeAudit({ user: viewer.id, action: "SALES_GEOGRAPHY_UPDATED", entityType: "GeoNode", entityId: node.id, oldValue: previous, newValue: input });
  return node;
};

export const geographyTree = async (viewer: SessionUser) => {
  const scope = await resolveSalesScope(viewer);
  const nodes = await GeoNode.find({ _id: { $in: scope.allowedGeoIds }, isActive: true }).sort({ depth: 1, name: 1 }).lean();
  return nodes.map((node) => ({
    ...node,
    children: nodes.filter((candidate) => candidate.parent?.toString() === node._id.toString()).map((candidate) => candidate._id),
  }));
};

export const getGeoNode = async (viewer: SessionUser, id: string) => {
  const scope = await resolveSalesScope(viewer);
  assertSalesGeoScope(scope, id);
  const item = await GeoNode.findOne({ _id: id, isActive: true }).populate("parent", "name code type").lean();
  if (!item) throw new AppError("Geography not found", 404);
  return item;
};

export const geoChildren = async (viewer: SessionUser, id: string) => {
  const scope = await resolveSalesScope(viewer);
  assertSalesGeoScope(scope, id);
  return GeoNode.find({ parent: id, _id: { $in: scope.allowedGeoIds }, isActive: true }).sort("name").lean();
};

export const descendantGeoIds = (id: string) => GeoNode.find({ $or: [{ _id: id }, { ancestors: id }], isActive: true }).distinct("_id");
export const geoTypeOrder = GEO_NODE_TYPES;
