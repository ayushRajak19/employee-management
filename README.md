# MobiusBloom Employee

MobiusBloom Employee is an independent workforce capability, delivery, growth, and performance-intelligence platform for `employee.whalexy.com`. It does not share code or runtime infrastructure with the Laravel application at `whalexy.com`.

## What is included

- Secure, invitation-only accounts, forced password change, resumable onboarding, rotating refresh sessions, and database-backed RBAC
- Dynamic organization structure, employee lifecycle administration, Employee 360 profiles, and career timelines
- Skill claims, private evidence, independent verification, assessments, role gaps, and organization heatmaps
- Projects, task Kanban, validated transitions, blocker tracking, time/quality/rework metrics, and immutable activity history
- Goals, configurable KPIs, structured reviews, explainable weighted performance snapshots, and historical trends
- Training, skill growth, workload classification, project-staffing recommendations, recognition, and leave workflows
- Private document storage, in-app notifications, global search, reports, access audit, role settings, and live role-scoped dashboards
- Deterministic V1 performance logic. The future AI boundary is recommendation-only and explicitly excludes promotion, termination, salary, and disciplinary decisions.

## Technology

React, TypeScript, Vite, Tailwind CSS, shadcn-style primitives, TanStack Query, React Hook Form, Zod, Recharts, Lucide, Express, Mongoose, MongoDB Atlas, JWT, bcrypt, Cloudinary authenticated assets, Helmet, restricted CORS, origin checks, and rate limiting.

## Structure

```text
client/src/                 React application, features, routes and UI
server/src/                Versioned REST API and business services
  config/ controllers/ jobs/ middleware/ models/ routes/ services/ validators/
shared/src/                Shared roles, permissions and response types
docs/                      Architecture and database reference
.env.example               Safe configuration template
```

## Local installation

Requirements: Node.js 20+, npm 10+, and MongoDB 7+ (local or Atlas).

1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URI`, two different random JWT secrets of at least 32 characters, and the initial Super Admin values.
3. Run `npm install`.
4. Run `npm run seed` to create permissions, system roles, and the Super Admin.
6. Run `npm run dev` and open `http://localhost:5173`.


## Commands

- `npm run dev`, `npm run dev:client`, `npm run dev:server`
- `npm run build`, `npm start`
- `npm run typecheck`, `npm run lint`
- `npm run seed`

## MongoDB Atlas

Create a dedicated least-privilege database user, allow only development and Hostinger egress addresses, require TLS, and use the SRV connection string as `MONGODB_URI`. Models use references for growing history collections and indexes for employee IDs, email, organization scope, skills, task status/deadlines, projects, and timestamps.

## Private documents

Configure the Cloudinary variables to enable uploads. Files are stored as authenticated resources with randomized keys; the database stores only metadata and storage keys. Download links are signed after backend scope checks. MIME type and size are validated before upload. Never place employee files under `client/public` or another predictable public folder.

## Production deployment on Hostinger

1. Create a separate Hostinger Node.js Web App and map `employee.whalexy.com` to it. Do not place this project in Laravel's `public_html`.
2. Select Node.js 20 or newer. Install with `npm install` and build with `npm run build`.
3. Set the start command to `npm start`.
4. Add all production environment values in Hostinger. Use `NODE_ENV=production`, `CLIENT_URL=https://employee.whalexy.com`, and `COOKIE_DOMAIN=employee.whalexy.com`.
5. Point the subdomain DNS record using the value Hostinger supplies and enable HTTPS.

Express serves `client/dist`, retains `/api/v1/*` for REST endpoints, and applies SPA fallback for client routes.

## Security notes

Access and refresh tokens use HttpOnly cookies; production cookies are Secure and SameSite Strict. Refresh tokens rotate and reuse invalidates the session family. Mutations require an allowed origin. Backend middleware enforces every permission and business services enforce employee/manager scope. Passwords use bcrypt and are never returned except the one-time generated temporary credential. Sensitive actions are audit logged. Production errors do not expose stacks.

Before launch, rotate seed credentials, use high-entropy secrets, configure Atlas and storage backups, test restoration, restrict Hostinger environment access, and run `npm run typecheck`, `npm run lint`, and `npm run build` in CI.

See [architecture](docs/ARCHITECTURE.md) and [schema reference](docs/SCHEMA.md).
