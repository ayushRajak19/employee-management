import { AuditLog } from "../models/AuditLog.js";
export const writeAudit = async (entry: Parameters<typeof AuditLog.create>[0]): Promise<void> => { await AuditLog.create(entry); };
