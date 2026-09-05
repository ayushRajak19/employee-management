import { AsyncLocalStorage } from "node:async_hooks";
import { Types } from "mongoose";

interface TenantContext {
  tenantId?: string;
  system: boolean;
}

const storage = new AsyncLocalStorage<TenantContext>();

export class TenantContextError extends Error {
  constructor(message = "Tenant context is required for this database operation") {
    super(message);
    this.name = "TenantContextError";
  }
}

export const runWithTenant = <T>(tenantId: string | Types.ObjectId, callback: () => T): T =>
  storage.run({ tenantId: tenantId.toString(), system: false }, callback);

export const runAsSystem = <T>(callback: () => T): T => storage.run({ system: true }, callback);

export const currentTenantId = (): Types.ObjectId | undefined => {
  const value = storage.getStore()?.tenantId;
  return value ? new Types.ObjectId(value) : undefined;
};

export const isSystemContext = (): boolean => storage.getStore()?.system === true;

export const requireTenantId = (): Types.ObjectId => {
  const tenantId = currentTenantId();
  if (!tenantId) throw new TenantContextError();
  return tenantId;
};

