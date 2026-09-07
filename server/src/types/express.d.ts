import type { SessionUser } from "@mobius-ems/shared";
declare global { namespace Express { interface Request { user?: SessionUser } } }
export {};

