# MongoDB schema blueprint

All business entities use timestamps and an immutable `tenantId`. Employee, Department, Team, Designation, Skill, Project and Task use `isActive`, `archivedAt` or `deletedAt` rather than destructive deletion. API services accept explicit field allowlists to prevent mass assignment. Business uniqueness and query indexes lead with `tenantId`; TTL indexes remain single-field.

## Identity and organization

- **User**: name, unique normalized email, hidden passwordHash, role ref, employee ref, active flag, forcePasswordChange, passwordChangedAt, lastLoginAt.
- **Role**: unique name, description, permission keys, system flag. Role documents make future custom roles possible without changing authorization middleware.
- **Permission**: unique permission key and description.
- **RefreshSession**: user, SHA-256 token hash, token family, expiry TTL, revocation and replacement hashes, request metadata.
- **Employee**: unique employeeId; personal/employment fields; user, department, team, designation and manager refs; joining date; employment type; location; status; completion percentage; soft-delete fields.
- **Department**: unique code/name, head ref, active and soft-delete fields.
- **Team**: department ref, unique department/name pair, lead ref and active fields.
- **Designation**: department/team scope, name/level, required-skill refs and minimum ratings.

## Capability

- **Skill**: unique normalized name, category, description and active fields.
- **EmployeeSkill**: unique employee/skill pair, self rating, experience, last used, description and current verification summary.
- **SkillVerification**: employeeSkill, status, verified rating, verifier, method, justification, evidence refs, dates. Each decision is a new immutable record.
- **Assessment / AssessmentResult**: skill, difficulty, scoring/time rules; assignment, attempt, score and result.

## Work and outcomes

- **Project**: unique code, department, manager, members, dates, status, priority and progress.
- **Task**: unique taskId, project/department/assignee/reviewer refs, priority, complexity, estimates, dates, status, quality, blockers, archive fields and reopen count.
- **TaskActivity**: task, action, old/new values, actor and timestamp; append-only.
- **Goal**: employee, period, weight, dates, progress, status and manager comment.
- **KPI / EmployeeKPI**: configurable definition by role/department, target/unit/weight/period; employee actuals and evaluation history.
- **PerformanceReview**: employee, reviewer, review type/period, categorized ratings, comments, response and final rating.
- **PerformanceSnapshot**: employee, period, total/classification, component inputs, configured weights and explanations. Snapshots are never recomputed in place.

## Growth and governance

- **Training / EmployeeTraining**: course metadata and skill ref; employee assignment, status, result and private certificate ref.
- **Document**: owner, category, storage provider/key, MIME type, size, uploader and authorization metadata. No public object URL is stored.
- **Notification**: recipient, type, title/body, entity reference, read state and delivery channels.
- **AuditLog**: actor, action, entity, old/new value and request metadata. Application code exposes no update/delete route.
- **VoiceCommand**: actor/role, transcript, language, duration, interpreted intent, confidence, editable structured draft, lifecycle status and resulting task reference. Raw audio is deleted after local transcription.

Primary query indexes include unique email/employeeId/code, employee/period, employee/skill, department/team, task assignee/status/deadline, project/status, notification recipient/read/createdAt and audit entity/id/createdAt.
