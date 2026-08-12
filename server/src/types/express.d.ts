import type { SessionUser } from "@mobiusbloom/shared";
declare global { namespace Express { interface Request { user?: SessionUser } } }
export {};
