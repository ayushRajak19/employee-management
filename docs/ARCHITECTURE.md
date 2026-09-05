# MobiusBloom Employee architecture

## Boundaries

This repository is an independent Node.js application for `employee.whalexy.com`. Express owns `/api/v1/*` and serves the compiled React SPA in production. It has no runtime or filesystem dependency on the existing Laravel application.

## Packages

- `client`: React/Vite application, feature-oriented pages, query cache, validated forms and route guards.
- `server`: Express API, MongoDB models, controllers, services, validators, security middleware and jobs.
- `shared`: stable role, permission and API-contract constants shared across both runtimes.

Business rules belong in services. Routes compose validation, authentication and permission middleware before controllers. Growing histories (audit, task activity, performance snapshots, notifications and verification history) use separate collections rather than unbounded employee documents.

All business models are tenant-scoped through a central fail-closed Mongoose model wrapper. Authentication establishes an AsyncLocalStorage tenant context from the signed session token, and model middleware injects `tenantId` into all supported query and write paths. Platform tenant administration is separately protected by a configured email allowlist plus the Super Admin role. See [MULTI_TENANCY.md](./MULTI_TENANCY.md) for the migration and operations runbook.

## Model map

| Domain | Collections | Key references and indexes |
|---|---|---|
| Identity | User, Role, Permission, RefreshSession | unique email; role; hashed refresh token; expiry TTL |
| Organization | Employee, Department, Team, Designation | unique employeeId; department/team/manager indexes |
| Capability | Skill, EmployeeSkill, SkillVerification, Assessment, AssessmentResult | skill/employee compound indexes; immutable verification history |
| Work | Project, Task, TaskActivity | project, assignee, status and deadline indexes; append-only activity |
| Outcomes | Goal, KPI, EmployeeKPI, PerformanceReview, PerformanceSnapshot | employee/period indexes; historical snapshots |
| Growth | Training, EmployeeTraining | employee/status and skill indexes |
| Governance | Document, Notification, AuditLog | owner/entity indexes; audit entries append-only |

Phase 1 implements identity plus the employee shell. Later models follow the same base conventions: timestamps, soft-delete fields for business entities, explicit field allowlists, references for growing data and compound indexes matching list queries.

## API routing

`/api/v1/auth` is public only for login and refresh. There is intentionally no registration route. Authenticated modules are `/employees`, `/departments`, `/teams`, `/designations`, `/skills`, `/tasks`, `/projects`, `/goals`, `/kpis`, `/performance`, `/training`, `/documents`, `/notifications`, `/reports`, `/audit`, and `/settings`. Each resource enforces permission middleware server-side.

## Frontend page map

Public: Login. Forced flow: Change Password, then Onboarding. Authenticated shell: Dashboard plus People, Skills, Work, Performance, Development, Organization and Administration sections. Phase 1 exposes the dashboard shell and disabled roadmap navigation so unfinished modules never masquerade as completed features.

## Delivery phases

1. Foundation: workspace, database, JWT cookie authentication, refresh rotation, Super Admin seed, RBAC, application shell and dashboard.
2. Organization: departments, teams, designations, employees, account creation, profile and onboarding.
3. Capability: skill master, claims, evidence, verification, assessments, role matrix, heatmap and gaps.
4. Work: projects, tasks, board, transitions, blockers, review, activity history and task metrics.
5. Outcomes: goals, KPIs, deterministic performance engine, reviews and snapshots.
6. Development: learning history, training, matching, workload, strengths and development areas.
7. Governance: private documents, notifications, reports, audit explorer and settings.
8. Production: security review, accessibility/responsive QA, optimization and Hostinger deployment.
