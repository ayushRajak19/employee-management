# MobiusEMS Enterprise Database Schema Blueprint

All business entities strictly inherit standard timestamps (`createdAt`, `updatedAt`) and an immutable `tenantId`. Destructive deletions are prohibited across business entities; entities utilize soft-deletion flags (`isActive`, `archivedAt`, or `deletedAt`). All API mutations enforce explicit field allowlisting through Zod schemas to eliminate mass-assignment vulnerabilities.

Indexes are designed with `tenantId` as the leading compound key (`{ tenantId: 1, ... }`), ensuring database-enforced isolation, uniqueness, and optimized index scanning across tenants.

---

## 1. Identity, Session & Platform Administration

- **User**: Name, unique normalized email, hidden `passwordHash` (bcrypt), role reference, employee reference, `isActive`, `forcePasswordChange`, `passwordChangedAt`, `lastLoginAt`.
- **Role**: Unique name (`SUPER_ADMIN`, `HR_ADMIN`, `DEPARTMENT_HEAD`, `MANAGER`, `EMPLOYEE`), human-readable description, system flag (`isSystem`), and permission key array.
- **Permission**: Catalog of granular permission keys (`employee.view`, `task.create`, `sales.analytics.all`, etc.) and scope descriptions.
- **RefreshSession**: User reference, SHA-256 token hash, token family ID, replacement token hash, expiry TTL, revoked flag, client IP, and user-agent metadata.
- **Tenant**: Tenant name, unique slug, contact email, subscription status (`ACTIVE`, `SUSPENDED`, `TRIAL`), provisioned date, and settings.
- **SystemMigration**: Migration key, completed timestamp, schema version, execution logs, and rollback checksum.

---

## 2. Organization & Employee Lifecycle

- **Employee**: Unique `employeeId`; personal details (first name, last name, phone, personal email, DOB); employment details (department, team, designation, reporting manager, joining date, employment type, status `ACTIVE`/`PROBATION`/`NOTICE`/`TERMINATED`); profile completion percentage; work location coordinates and GeoNode reference; soft-delete attributes.
- **Department**: Unique department code, department name, department head reference, active flag, and soft-delete timestamp.
- **Team**: Department reference, team name, team lead reference, active status. Compound unique constraint: `{ tenantId: 1, department: 1, name: 1 }`.
- **Designation**: Department reference, optional team reference, title, level code, minimum required skill ratings, and competency profile.
- **EmployeeTimeline**: Employee reference, event type (`PROMOTION`, `TRANSFER`, `ROLE_CHANGE`, `SALARY_REVISION`, `ONBOARDING`), effective date, old value, new value, notes, and authorized actor.

---

## 3. Capability, Skills & Assessment

- **Skill**: Standardized skill name, category (`TECHNICAL`, `LEADERSHIP`, `OPERATIONAL`, `DOMAIN`), description, and status.
- **EmployeeSkill**: Employee reference, skill reference, self-reported proficiency level (1-5), years of experience, last used date, self-assessment notes, and current verified status. Compound unique: `{ tenantId: 1, employee: 1, skill: 1 }`.
- **SkillVerification**: Immutable audit trail of verification actions. EmployeeSkill reference, verifier reference, verification status (`VERIFIED`, `REJECTED`, `EXPIRED`), verified proficiency level, verification method (`PEER_REVIEW`, `ASSESSMENT`, `MANAGER_AUDIT`), justification, and evidence document references.
- **Assessment**: Assessment title, associated skill reference, difficulty level (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`), time limit in minutes, passing percentage, question catalog, and scoring rules.
- **AssessmentResult**: Assessment reference, employee reference, score achieved, percentage, status (`PASSED`, `FAILED`), completed timestamp, and answer breakdown.
- **RoleSkillAssessment**: Designation/role reference, required skills matrix, benchmark proficiency thresholds, and gap evaluation parameters.

---

## 4. Work Delivery & Tasks

- **Project**: Unique project code, title, description, owning department, project manager reference, team member references, start date, target completion date, status (`PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `CANCELLED`), priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), and budget/actual metrics.
- **Task**: Unique `taskId`; references to project, department, assignee, and reviewer; title, detailed description, priority, complexity (`EASY`, `MEDIUM`, `HARD`, `VERY_HARD`), estimated hours, actual hours, deadline, status (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`, `BLOCKED`, `CANCELLED`); quality score; reopen count; blocker details (reason category, description, resolved timestamp); archive flags.
- **TaskActivity**: Append-only activity log. Task reference, actor reference, event action type (`CREATED`, `STATUS_CHANGED`, `REASSIGNED`, `BLOCKED`, `HOURS_LOGGED`), old state, new state, comments, and timestamp.
- **VoiceCommand**: Captured voice instruction record. Actor reference, transcript, audio duration, detected language, recognized intent (`CREATE_TASK`, `UPDATE_STATUS`), structured draft payload, confirmation status (`DRAFT`, `CONFIRMED`, `DISCARDED`), resulting task reference, and execution latency.
- **WeeklyUpdate**: Employee reference, reporting week date key, highlights, completed tasks, planned tasks for next cycle, blockers encountered, and manager review notes.

---

## 5. Performance & Outcomes

- **Goal**: Employee reference, cycle period, title, description, target value, current value, unit, weight percentage, status (`NOT_STARTED`, `IN_PROGRESS`, `ACHIEVED`, `MISSED`), and manager feedback.
- **KPI**: Master KPI definition. Title, metric code, measurement unit, evaluation frequency (`MONTHLY`, `QUARTERLY`, `ANNUAL`), calculation criteria, target benchmarks, and assigned roles/departments.
- **EmployeeKPI**: Employee reference, master KPI reference, target threshold, actual achieved value, evaluation period, weighted score, and status.
- **PerformanceTemplate**: Evaluation template definition. Sections, competency criteria, weight distributions across goals, KPIs, and competencies.
- **PerformanceReview**: Employee reference, reviewer reference, review cycle, template reference, categorized scores, self-evaluation comments, reviewer feedback, final composite score, and employee acknowledgement signature.
- **PerformanceSnapshot**: Immutable historical performance record. Employee reference, period key, total score, grade bracket (`EXCEEDING`, `MEETING`, `NEEDS_IMPROVEMENT`, `UNSATISFACTORY`), frozen component inputs, configured weight snapshot, and algorithmic explanation.

---

## 6. Contribution Intelligence

- **ContributionReview**: Employee reference, review period, deliverables completed, self-assessment score, peer/manager evaluation, and qualitative contribution notes.
- **ContributionSnapshot**: Immutable scoring snapshot. Aggregated work delivery volume, rework penalty index, attendance consistency weight, peer collaboration factor, normalized contribution score, and percentile ranking.

---

## 7. Attendance & Office Geofencing

- **Attendance**: Employee reference, department reference, date key (`YYYY-MM-DD` in Asia/Kolkata), check-in timestamp, check-in coordinates (lat, lon, accuracy, distance from office), check-out timestamp, check-out coordinates, total worked minutes, daily status (`PRESENT`, `LATE`, `HALF_DAY`), and active flag.
- **AttendanceOffice**: Key (`PRIMARY`), office name, latitude, longitude, permitted radius in meters (default 300m), max acceptable GPS accuracy in meters (default 200m), configured by user reference, and configuration timestamp.

---

## 8. Growth & People Operations

- **Training**: Course title, category, description, learning provider, duration hours, associated skill reference, and syllabus details.
- **EmployeeTraining**: Training reference, employee reference, enrollment date, completion date, score, status (`ENROLLED`, `IN_PROGRESS`, `COMPLETED`, `DROPPED`), and certificate document reference.
- **Recognition**: Recipient employee, nominator employee, recognition core value/badge, public message, and award date.
- **OneToOne**: Manager reference, employee reference, scheduled date, agenda items, discussion notes, private manager notes, action items, and completion status.
- **Applicant**: Job requisition reference, full name, email, phone, resume document reference, source, stage (`APPLIED`, `SCREENED`, `INTERVIEW`, `OFFERED`, `HIRED`, `REJECTED`), and candidate notes.
- **ResumeScreening**: Applicant reference, parsed resume text, extracted skills, experience years, education summary, AI assistive score, match breakdown, and human review state.
- **JobDescription**: Job title, department, employment type, location, experience requirements, responsibilities, technical requirements, and active requisition status.
- **LeaveRequest**: Employee reference, leave type (`ANNUAL`, `SICK`, `CASUAL`, `UNPAID`), start date, end date, total days, reason, status (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`), and approving manager.

---

## 9. Sales Intelligence & Geographic Information System (GIS)

- **GeoNode**: Canonical administrative geography hierarchy. Name, standard code, geographic type (`GLOBAL`, `COUNTRY`, `STATE`, `DISTRICT`, `CITY`, `AREA`, `PINCODE`), parent reference, ancestor path array, hierarchy depth, coordinates (`Point`), and optional boundary Polygon.
- **SalesTerritory**: Commercial sales boundary. Territory name, code, description, effective start/end dates, territory owner (Sales Manager/Agent), and array of covered `GeoNode` references.
- **EmployeeTerritoryAssignment**: Employee reference, territory reference, assigned role, primary territory flag, effective start/end date, allocated sales capacity, and active status.
- **SalesLead**: Lead company name, primary contact name, email, phone, territory reference, canonical GeoNode reference, lead source, assigned sales employee, stage (`NEW`, `CONTACTED`, `QUALIFIED`, `CONVERTED`, `LOST`), loss reason, and converted customer reference.
- **SalesCustomer**: Customer company name, contact info, assigned sales owner, territory, geography, lifetime realized revenue, account status (`ACTIVE`, `INACTIVE`), and original lead reference.
- **SalesOpportunity**: Customer reference, opportunity title, deal size value, currency (e.g. INR), probability percentage, current stage (`PROSPECTING`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST`), expected close date, sales owner, territory, and loss reason.
- **SalesTarget**: Sales employee or territory reference, target period (`MONTHLY`, `QUARTERLY`, `ANNUAL`), revenue target quota, lead target count, deal target count, and manager approval.
- **EmployeeTargetCommitment**: Sales employee reference, target reference, committed target revenue, commitment notes, and employee signature.
- **SalesRevenueTransaction**: Revenue amount, currency, realized date, opportunity reference, customer reference, territory reference, booking sales employee, invoice reference, and automated booking flag.
- **ChannelPartner**: Partner organization name, partner type (`DISTRIBUTOR`, `DEALER`, `RESELLER`, `SERVICE_PARTNER`), territory reference, GeoNode reference, primary contact, assigned account manager, and partnership agreement dates.
- **SalesConfiguration**: Tenant-level sales parameters: default lead capacity per agent, response SLA thresholds, opportunity scoring weight coefficients, and conversion rate baseline.
- **GeoSalesMetricSnapshot**: Periodic pre-aggregated GIS metrics: GeoNode reference, period key, total revenue, active pipeline, lead count, agent headcount, coverage score, and opportunity band.

---

## 10. Governance, Compliance & Automation

- **Document**: Document title, category (`CONTRACT`, `RESUME`, `CERTIFICATE`, `POLICY`, `PAYSLIP`), Cloudinary storage key/publicId, MIME type, file size bytes, owner employee reference, uploader user reference, and confidentiality classification.
- **Notification**: Recipient user reference, notification type (`TASK_ASSIGNED`, `ATTENDANCE_ALERT`, `REVIEW_PENDING`, `SYSTEM`), title, body text, target entity type, target entity ID, read status, and delivery timestamp.
- **AuditLog**: Immutable compliance log. Actor user reference, action verb, entity type, entity ID, old value JSON snapshot, new value JSON snapshot, client IP address, and browser user-agent. Application provides zero mutation or deletion routes.
- **EmailWorkflow**: Workflow title, trigger type (`ONBOARDING`, `ABANDONED_LEAD`, `PERFORMANCE_ALERT`), step array (delays, email templates, conditions), and active toggle.
- **EmailEnrollment**: Workflow reference, target recipient email, enrolled entity, current step index, next execution date, and status (`ACTIVE`, `COMPLETED`, `PAUSED`, `CANCELLED`).
- **EmailDelivery**: Enrollment/workflow reference, recipient email, template used, delivery status (`PENDING`, `SENT`, `DELIVERED`, `BOUNCED`, `OPENED`, `CLICKED`), Brevo message ID, and delivery error logs.
- **AiContentCache**: Cache key (SHA-256 of prompt/context), prompt type (`MOOD_BREAK`, `SUMMARY`), cached text payload, expiration TTL, and usage hit count.
- **AiEmployeeSummary**: Employee reference, generated summary period, advisory text, provider name, model version, and generation timestamp.
- **DailyTodo**: Private personal to-do checklist. User reference, item title, completed flag, due date, and order index. Strictly excluded from all performance and contribution scoring queries.
- **VendorContact**: Organization vendor details, contact name, service category, phone, email, and contract terms.

---

## 11. Core Indexing Invariants

1. **Multi-Tenant Compound Uniqueness**:
   - `User`: `{ tenantId: 1, email: 1 }` (unique)
   - `Employee`: `{ tenantId: 1, employeeId: 1 }` (unique)
   - `Department`: `{ tenantId: 1, code: 1 }` (unique)
   - `Project`: `{ tenantId: 1, code: 1 }` (unique)
   - `Task`: `{ tenantId: 1, taskId: 1 }` (unique)
   - `Attendance`: `{ tenantId: 1, employee: 1, dateKey: 1 }` (unique)
2. **High-Velocity Operational Query Indexes**:
   - `Task`: `{ tenantId: 1, assignee: 1, status: 1, deadline: 1 }`
   - `Attendance`: `{ tenantId: 1, dateKey: 1, department: 1 }`
   - `SalesLead`: `{ tenantId: 1, territory: 1, stage: 1, assignedEmployee: 1 }`
   - `SalesOpportunity`: `{ tenantId: 1, salesOwner: 1, stage: 1, expectedCloseDate: 1 }`
   - `AuditLog`: `{ tenantId: 1, entityType: 1, entityId: 1, createdAt: -1 }`
   - `Notification`: `{ tenantId: 1, recipient: 1, isRead: 1, createdAt: -1 }`
3. **TTL Cleanups**:
   - `RefreshSession`: `{ expiresAt: 1 }` (expireAfterSeconds: 0)
   - `AiContentCache`: `{ expiresAt: 1 }` (expireAfterSeconds: 0)
