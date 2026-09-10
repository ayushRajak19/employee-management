"""
MobiusEMS Client Feature Documentation Generator
Compiles comprehensive, human-written feature documentation into:
1. docs/MobiusEMS_Product_Feature_Documentation.md
2. deliverables/MobiusEMS_Feature_Documentation_Client.docx
3. deliverables/MobiusEMS_Feature_Documentation_Client.html
4. deliverables/MobiusEMS_Feature_Documentation_Client.pdf
"""
import os
import sys
import subprocess
from pypdf import PdfReader
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

WORKSPACE = r"c:\Users\rainb\Desktop\employee-management"
DOCS_DIR = os.path.join(WORKSPACE, "docs")
DELIV_DIR = os.path.join(WORKSPACE, "deliverables")

# Palette
COLOR_PRIMARY = "#0f172a"      # Slate 900
COLOR_SECONDARY = "#1e3a8a"    # Blue 900
COLOR_ACCENT = "#2563eb"       # Blue 600
COLOR_TEXT = "#334155"         # Slate 700
COLOR_LIGHT_BG = "#f8fafc"     # Slate 50
COLOR_BORDER = "#cbd5e1"       # Slate 300
COLOR_MUTED = "#64748b"        # Slate 500

def get_markdown_content():
    return '''# MobiusEMS: Enterprise Product Feature Guide & Capabilities Overview
**A Unified Operating Platform for Workforce Intelligence, Daily Delivery, and Commercial Operations**  
*Mobius Bloom Venture Pvt Ltd*  
*Product Release: v2.0-PROD | Primary Deployment: `https://employee.whalexy.com`*  
*Document Audience: Prospective Enterprise Clients, CXOs, HR Directors, Operations Leads, Commercial Sales Leadership*

---

## 1. Executive Summary & Platform Purpose

### The Problem: Escaping the "5-Tool Trap"
In most growing businesses, everyday operations are fragmented across a patchwork of disconnected single-purpose tools:
1. **Biometric or Hardware Time Clocks**: Expensive to install, prone to hardware failures, and useless for field sales, remote teams, or multi-branch offices.
2. **Project Task Boards (Trello, Asana, Jira)**: Great for logging tasks, but completely isolated from HR records, attendance, and employee compensation.
3. **Spreadsheet-Driven Appraisals**: Annual reviews conducted on spreadsheets months after work was done, suffering from severe recency bias, personal favoritism, and missing historical evidence.
4. **Standalone CRM Tools**: Heavy, expensive sales software disconnected from employee capacity, leaves, and realized revenue ledgers.
5. **Scattered Personnel Folders**: Resumes in inbox attachments, policy documents in shared drives, and zero centralized visibility.

The result is familiar: managers spend hours manually chasing status updates, HR re-enters the same data across multiple platforms, and executive leadership lacks a single, verified picture of team delivery and commercial pipeline.

### The MobiusEMS Solution
**MobiusEMS** replaces this tool sprawl with a single, role-aware operational workspace. It connects daily work execution, verified geofenced attendance, skill capabilities, objective performance evidence, talent acquisition, and commercial sales territories into one coherent system.

When an engineer finishes a sprint task, it directly reinforces their weekly deliverable log. When a sales executive closes an opportunity in their assigned territory, the deal automatically registers against their quota and books realized revenue into the financial ledger. When a manager sits down for a quarterly review, they do not have to guess or rely on memory—all raw data, project velocity, KPI metrics, and attendance records are right in front of them.

---

## 2. Our Core Design Philosophy

Before diving into individual features, three foundational principles govern how MobiusEMS was engineered:

### Principle 1: Deterministic Math Over Black-Box AI
We believe software should calculate facts, not hallucinate them. All performance scores, KPI calculations, attendance determinations, sales capacity forecasts, and contribution percentiles are computed using pure mathematical formulas. 

Large Language Models (LLMs) are used strictly as an **advisory layer**—drafting narrative summaries, highlighting missing documentation, and answering questions against approved company handbooks. The platform enforces an explicit architectural lock: **AI is strictly barred from making or modifying promotion, compensation, disciplinary, or termination decisions.**

### Principle 2: Respectful Accountability Over Invasive Surveillance
MobiusEMS rejects invasive employee surveillance software. There are no background keyloggers, no secret screen grabbers, and no 24/7 mobile GPS stalking. 

Accountability is measured where it matters:
- **Physical presence at the start and end of shifts** through browser-based geofencing within a 300-meter radius of company offices.
- **Verifiable work delivery** through completed tasks, blocker resolutions, peer-reviewed deliverables, and commercial sales results.

### Principle 3: Built-In Data Privacy & Local Zero-Retention Voice
Speech-to-task transcription is powered by local speech-to-text models (`faster-whisper`) running directly on the application server. Spoken voice commands are transcribed into structured draft tasks on the host machine, and **the ephemeral audio file is shredded immediately** after processing. 

Your employees' voice recordings are never sent to third-party cloud APIs, never retained on disk, and incur zero per-minute external transcription fees.

---

## 3. Platform Capabilities & Feature Matrix

The platform is organized into eleven interconnected operational modules:

| Module | Core Functionality | Primary Beneficiaries |
|:---|:---|:---|
| **1. Workforce & Org Setup** | Dynamic organization hierarchy, designations, Employee 360 profiles, career history, and resumable onboarding. | HR, Department Heads, All Employees |
| **2. Smart Attendance** | Mobile browser geofenced check-in (300m radius), 11:30 AM cutoff, 4h half-day calculation, and leave management. | Employees, Managers, HR Operations |
| **3. Project & Task Delivery** | Visual Kanban boards, blocker escalation, cycle time, rework metrics, and immutable activity history. | Project Managers, Delivery Teams |
| **4. Local Voice-to-Task** | Zero-retention multilingual speech capture (11 Indian languages + English), Hinglish NLP parser, and editable draft preview. | Field Staff, Engineers, Busy Managers |
| **5. Capability & Skills Matrix** | Verified vs self-reported skills, role gap analysis, departmental heatmaps, and built-in timed quiz assessments. | HR, Practice Leads, Employees |
| **6. Objective Performance** | Cascading goals, measurable KPIs, 360 reviews, deterministic math scoring, and frozen immutable snapshots. | Executives, Managers, People Ops |
| **7. Contribution Intelligence** | Weekly deliverable check-ins, velocity metrics, contribution percentiles, and evidence-coverage indicators. | Team Leads, Department Heads |
| **8. Commercial Sales & GIS** | 7-tier geographic hierarchy, territory quota capacity, lead SLA tracking, deal pipelines, and automated revenue ledger. | Sales Reps, Sales Heads, Finance |
| **9. Talent & Recruitment** | Standardized JD library, candidate pipelines, automated PDF resume screening, and advisory qualification scoring. | Recruiting Teams, Hiring Managers |
| **10. People Growth & 1-on-1s** | Structured 1-on-1 agendas, internal training course catalog, peer core-value recognition, and private daily to-dos. | People Managers, Employees |
| **11. Governance & Security** | Fail-closed multi-tenancy, HttpOnly rotating sessions, authenticated private document storage, and tamper-evident audit logs. | IT, Security, Compliance Officers |

---

## 4. Module Deep-Dive

### Module 1: Unified Workforce & Organizational Structure
The foundation of MobiusEMS is a flexible organizational graph that mirrors how modern companies actually operate.

- **Dynamic Organization Hierarchy**: Configure Departments, Teams, and Designations with defined reporting lines and approval paths. Modify structures as your company scales without database migrations or vendor consulting fees.
- **Employee 360 Longitudinal Profiles**: Each profile is a comprehensive, living record connecting employment details, emergency contacts, active projects, skill verifications, historical performance reviews, leave balances, 1-on-1 notes, and career timeline milestones.
- **Frictionless, Resumable Onboarding**: New hires are provisioned via secure invitation links. The system generates temporary credentials, forces a mandatory password change upon first login, and walks the employee through a resumable profile setup wizard.
- **Role-Based Access Control (RBAC)**: Five distinct roles (`SUPER_ADMIN`, `HR_ADMIN`, `DEPARTMENT_HEAD`, `MANAGER`, and `EMPLOYEE`) ensure users only see and edit records permitted within their operational scope.

---

### Module 2: Smart Geofenced Attendance & Leave Management
Traditional biometric hardware is expensive, breaks down constantly, and creates long queues at office entrances. MobiusEMS replaces physical machines with secure, browser-based geofencing.

- **Zero-Hardware Browser Check-In**: Employees open the application on their mobile phone or laptop browser and tap "Check In". The system validates their physical location using the device's native browser geolocation API.
- **Haversine Spherical Geofencing (300m Radius)**: Validates that the check-in occurs within a 300-meter radius of the configured office or facility coordinates.
- **GPS Anti-Spoofing Protection**: Check-in attempts with GPS accuracy fuzzier than 200 meters are rejected to prevent mock-location apps and location-spoofing emulators.
- **Predictable Business Rules**:
  - **11:30 AM Cutoff**: Morning check-ins completed after 11:30 AM IST are automatically categorized as `LATE`.
  - **4-Hour Minimum**: Shifts totaling under 240 minutes of elapsed time upon checkout are automatically demoted to `HALF_DAY`.
  - **Clean 5-State Taxonomy**: Daily status is classified into `PRESENT`, `LATE`, `HALF_DAY`, `ON_LEAVE`, or `ABSENT`.
- **Attendance Register & Regularization**: Managers and HR have real-time department register views. Employees can submit regularization requests with notes for managerial approval when field travel or unexpected transit delays occur.
- **Integrated Leave Management**: Custom leave quotas (Privilege Leave, Casual Leave, Sick Leave), multi-step approval workflows, and live team calendar synchronization.

---

### Module 3: Project Delivery & Visual Task Execution
Keep projects on schedule and surface delivery bottlenecks before deadlines are missed.

- **Project Portfolio Management**: Maintain project codes, budgets, target completion dates, assigned team rosters, and client stakeholder references.
- **Interactive Kanban State Machine**: Tasks move through structured stages: `Todo` &rarr; `In Progress` &rarr; `In Review` &rarr; `Done`. The system enforces transition validations (e.g., tasks cannot move to review without logged hours or deliverables).
- **Explicit Blocker Escalation**: Team members can flag a task as blocked and document the exact impediment (e.g., waiting for client API access or design assets). Blockers are immediately highlighted on manager dashboards to clear bottlenecks.
- **Cycle Time & Rework Tracking**: The platform tracks planned hours, actual hours, cycle time, and rework loops. If a task bounces back from review multiple times, the rework count flags a potential requirement misunderstanding or training need.
- **Append-Only Activity Audit**: Every status shift, priority update, assignee handoff, and discussion comment is recorded in an immutable historical activity log.

---

### Module 4: Local Zero-Retention Voice-to-Task Capture
Field workers, busy executives, and technical leads frequently skip logging tasks because typing detailed descriptions on mobile keyboards is tedious. MobiusEMS introduces speech-driven task capture built specifically for Indian and multilingual enterprise environments.

- **Local `faster-whisper` Engine**: Speech recognition runs directly on your application server using optimized local models. There are no recurring per-minute charges from cloud speech providers.
- **Guaranteed Audio Shredding (Zero Retention)**: The browser records speech in standard WebM format and uploads it over a secure HTTPS session. The server writes the audio to an ephemeral temporary file, transcribes it, and immediately shreds the raw audio file in a strict code `finally` block. Voice recordings are never stored on disk or in the cloud.
- **11 Indian Regional Languages + English**: Full support for English, Hindi (हिन्दी), Bengali (বাংলা), Tamil (தமிழ்), Telugu (తెలుగు), Marathi (मराठी), Gujarati (ગુજરાતી), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), Punjabi (ਪੰਜਾਬੀ), and Urdu (اردو).
- **Intelligent Multilingual NLP Parser**:
  - **Prospective vs. Retrospective Intent**: Distinguishes between future task creation ("need to fix database index tomorrow" &rarr; `CREATE_TASK`) and retrospective work logging ("finished client onboarding slides in 2 hours" &rarr; `UPDATE_STATUS` with logged actual hours).
  - **Spoken Number Conversion**: Automatically translates multilingual spoken numbers ("two hours", "दो घंटे") into numeric float values for time tracking.
  - **Hinglish Compound Splitting**: Correctly splits compound spoken instructions into distinct assignments (e.g., "Ayush ko frontend do aur Priya ko backend do").
- **Human-in-the-Loop Confirmation**: Transcripts are never directly committed. The system presents an editable preview card where the user can adjust the title, assigned owner, estimated hours, or priority before saving.

---

### Module 5: Capability, Skills Matrix & Timed Assessments
Gain clear visibility into your organization's technical and operational capabilities.

- **Standardized Skills Catalog**: A centralized inventory of core technical, operational, and domain competencies organized by category.
- **Verified vs. Self-Reported Ratings**: Employees can self-rate their skills (1 to 5 stars) and submit evidence (project repositories, certificates). Ratings remain designated as "Self-Reported" until validated by a manager or designated technical verifier.
- **Departmental Skill Heatmaps**: Visual matrices showing competency depth across teams, instantly revealing single-point-of-failure vulnerabilities and knowledge silos.
- **Role Benchmarks & Gap Analysis**: Each designation defines required skills and minimum competency thresholds. The system compares employee profiles against their role benchmarks to highlight specific skill gaps.
- **Built-In Timed Assessments**: Create multiple-choice skill evaluations with randomized question pools, configurable time limits, difficulty ratings, and automated pass/fail scoring.

---

### Module 6: Objective Performance Management & Snapshots
Eliminate annual review anxiety, recency bias, and subjective favoritism with transparent, continuous performance measurement.

- **Cascading Goals & Quantifiable KPIs**: Departmental and individual goals aligned with company objectives, complete with target deadlines, progress milestones, and percentage weightings.
- **Structured 360 Performance Reviews**: Multi-competency evaluation templates covering core technical skills, teamwork, communication, and leadership, with clear evaluation rubrics.
- **Deterministic Mathematical Scoring**: Composite performance scores are calculated using transparent mathematical formulas:
  
  $$\text{Final Score} = (\text{Goals Achievement} \times W_g) + (\text{KPI Performance} \times W_k) + (\text{Review Competencies} \times W_r)$$
  
  Final scores map into non-negotiable performance bands:
  - **Exceeding Expectations**: $\ge 90\%$
  - **Meeting Expectations**: $75\% - 89.9\%$
  - **Needs Improvement**: $60\% - 74.9\%$
  - **Unsatisfactory**: $< 60\%$
- **Immutable Historical Snapshots**: Once a review cycle closes, the entire evaluation—including raw inputs, reviewer comments, calculation weights, and final scores—is frozen into a cryptographic snapshot record that cannot be retroactively altered.

---

### Module 7: Continuous Contribution Intelligence
Performance should not be judged solely on annual impressions; it should reflect steady, verifiable delivery.

- **Weekly Progress Check-Ins**: Employees submit structured weekly updates detailing completed deliverables, priorities for the upcoming week, and active blockers.
- **Deliverable Velocity Over Face Time**: Measures tangible output and deliverable completion over rolling 30-day and 90-day windows, shifting culture away from mere hours spent sitting at a desk.
- **Algorithmic Contribution Percentiles**: Computes an objective percentile ranking across peer groups based on output volume, deliverable completion rate, and rework frequency.
- **Evidence-Coverage Guardrail**: The platform explicitly separates missing paperwork from poor delivery. If an employee is missing updates, the system flags an "Information Gap" rather than artificially lowering their performance score.

---

### Module 8: Commercial Sales Intelligence & Geographic Management (GIS)
Most companies are forced to purchase an expensive external CRM that has no connection to employee attendance, workload, or organizational hierarchy. MobiusEMS includes a built-in commercial engine designed for field sales, distributed territories, and revenue operations.

- **7-Tier Geographic Hierarchy (GIS)**: Model markets down to the local level:
  
  $$\text{Global} \longrightarrow \text{Country} \longrightarrow \text{State} \longrightarrow \text{District} \longrightarrow \text{City} \longrightarrow \text{Area} \longrightarrow \text{Pincode}$$
  
- **Interactive Geospatial Maps**: Visual maps showing customer concentration, lead volume, sales rep coverage, and revenue distribution across states and districts.
- **Territory Ownership & Headcount Capacity**: Define geographic territories, assign sales managers and field representatives, and set maximum lead capacity thresholds per rep to prevent lead neglect.
- **Lead Management & SLA Tracking**: Capture prospects, log contact interactions, and enforce follow-up SLAs. The system automatically calculates **Estimated Lost Revenue** when leads sit unattended past agreed response windows.
- **Visual Opportunity Pipeline**: Track commercial deals across defined stages: `Prospecting` &rarr; `Qualification` &rarr; `Proposal` &rarr; `Negotiation` &rarr; `Closed Won` / `Closed Lost`. View total pipeline value and probability-weighted expected revenue.
- **Quotas, Commitments & Revenue Ledger**: Set monthly, quarterly, and annual targets for territories and reps. Reps digitally sign their target commitments. Closed-won deals automatically book realized revenue transactions into the ledger for financial reconciliation.
- **Channel Partner Network**: Track authorized distributors, dealers, and value-added resellers, including contract terms, territory coverage, and partner-attributed revenue.
- **3-Tier Scoped Commercial Access**:
  - `SELF`: Field sales representatives only see their own assigned leads, opportunities, and quota commitments.
  - `TEAM`: Regional sales managers see their assigned territory and all direct/indirect reporting reps.
  - `ALL`: Executive leadership and HR view company-wide sales performance and revenue metrics.

---

### Module 9: Talent Acquisition & Recruitment Pipeline
Streamline hiring from job opening to first day of work within the same platform.

- **Job Description (JD) Library**: Maintain standardized job requisition templates with documented roles, responsibilities, and required skill profiles.
- **Visual Recruiting Pipeline**: Track candidates through defined stages: `Sourced` &rarr; `Screened` &rarr; `Interviewing` &rarr; `Offer Extended` &rarr; `Hired`.
- **Automated Resume Screening**: Upload PDF or DOCX candidate resumes. The screening engine parses the text, extracts claimed skills, education history, and years of experience, and compares them against the job description.
- **Transparent Match Evidence**: Generates an advisory match score detailing exactly which requirements were fulfilled and which are missing, giving human recruiters a fast first-pass summary without replacing interview evaluations.

---

### Module 10: People Operations, Growth & Culture
Support employee development, retention, and team culture.

- **Structured 1-on-1 Workspace**: Dedicated 1-on-1 agendas, discussion notes, follow-up action items, and private manager notes for coaching conversations.
- **Internal Training Catalog**: A catalog of internal and external courses, skill tags, training providers, and tracked completion certificates. Completed courses automatically update the employee's skill profile.
- **Core-Value Peer Recognitions**: A company-wide recognition board where team members and managers publicly celebrate colleagues who demonstrate organizational core values.
- **Private Daily To-Dos**: A personal, distraction-free checklist for employees to organize their day. To-do lists are strictly private and completely excluded from performance metrics.

---

### Module 11: Enterprise Governance, Security & Compliance
MobiusEMS is engineered with enterprise security and strict regulatory compliance as core architectural requirements.

- **Fail-Closed Multi-Tenancy**: Data isolation is enforced at the database driver abstraction layer using Node.js `AsyncLocalStorage` and Mongoose model wrappers. Every database query, aggregation, and write is automatically scoped to the authenticated tenant. Cross-tenant access is structurally impossible (complete IDOR immunity).
- **Hardened Session Management**: Authentication utilizes stateless JWT access tokens (15-minute expiry) paired with rotating refresh tokens stored in secure, `HttpOnly`, `SameSite=Strict` cookies. Refresh token reuse triggers immediate family-wide session invalidation.
- **Authenticated Private Document Storage**: Uploaded files (identity proofs, contracts, resumes) are stored in authenticated Cloudinary cloud storage with randomized keys. Download URLs are signed, time-limited, and issued only after backend permission checks. Files are never placed in public directories.
- **Tamper-Evident Audit Trail**: Every critical action—user role changes, salary updates, task reassignments, voice command confirmations, and AI requests—is permanently recorded in the audit log with the actor ID, timestamp, IP address, user-agent, and state diff.
- **Data Protection Compliance**: Built to align with Indian Digital Personal Data Protection (DPDP) Act, GDPR, and ISO/SOC 2 standards.

---

### Module 12: Pragmatic & Ethical AI Assistance
Rather than replacing human management with unchecked autonomous agents, MobiusEMS uses AI to remove administrative friction while keeping humans firmly in control.

- **Company Knowledge Assistant**: Grounded in your company's uploaded handbooks and HR policies. Answers common employee questions regarding leave rules, expense policies, and benefits. Questions outside documented knowledge are automatically escalated to HR.
- **Advisory Review Drafting**: Prepares draft narrative summaries for managers prior to performance reviews by collating completed tasks, weekly updates, and KPI achievements. Managers review, edit, and approve every draft.
- **Multi-Provider Architecture**: Pre-configured for Groq (`llama-3.3-70b-versatile`) for ultra-fast, sub-second responses. Supports OpenAI, Anthropic, Gemini, or self-hosted LLMs through simple environment configuration.
- **Consent-Based Email Automation**: Multi-step drip workflows integrated with Brevo for automated vendor outreach and candidate communications, with automatic stop conditions on reply, bounce, or unsubscribe.

---

## 5. Real-World Walkthroughs: A Day in the Life

To see how MobiusEMS functions in practice, consider how different roles interact with the platform throughout a typical workday:

### Scenario A: Software Engineer / Knowledge Worker
- **9:15 AM**: Arrives at the office, opens `employee.whalexy.com` on their phone, and taps **Check In**. The system validates their location within the 300m geofence and marks them `PRESENT`.
- **9:30 AM**: Opens the **Work** tab. Reviews assigned tasks on the Kanban board, adds a comment to an in-progress ticket, and flags an external API dependency as a **Blocker**.
- **1:30 PM**: Completes a major refactoring task. Taps the voice recorder on the Work page and speaks: *"Finished task 104 in 3 hours, code committed to staging."* The system transcribes the speech, extracts the 3-hour duration, presents an editable preview, and upon confirmation moves the task to `In Review`.
- **5:30 PM**: Submits a brief **Weekly Update** summarizing two completed deliverables and next week's goals. Taps **Check Out** and departs.

### Scenario B: Field Sales Representative
- **10:00 AM**: Opens the mobile dashboard to view assigned leads in their designated district territory.
- **11:30 AM**: Meets a prospective client. After the meeting, records a voice note updating the lead status to `Proposal Sent` and schedules a follow-up task.
- **3:00 PM**: Receives a signed agreement for a major contract. Moves the deal in the **Sales Pipeline** to `Closed Won`. The deal value automatically books realized revenue onto the ledger, updates the rep's quarterly quota pacing, and reflects in the regional sales director's dashboard.

### Scenario C: Department Engineering Manager
- **10:00 AM**: Checks the morning **Attendance Register** to see team availability. Notices a team member is on approved leave and temporarily reassigns an urgent client task.
- **11:00 AM**: Inspects the **Work Kanban** board. Spots a task flagged as **Blocked** due to missing design assets, contacts the design lead, and clears the obstacle within 20 minutes.
- **2:00 PM**: Holds a bi-weekly **1-on-1** meeting with a junior engineer. Reviews discussion items logged in MobiusEMS, notes training goals, and recommends an internal course from the training catalog.
- **4:00 PM**: Prepares a quarterly performance evaluation. Opens the employee's **Performance Review** tab. Reviews actual KPI attainment, objective deliverable velocity, and reads the advisory AI summary before finalizing the score.

### Scenario D: Head of HR & Executive Leadership
- **Monday Morning**: Executive leadership opens the **Executive Cockpit**. Reviews company-wide attendance averages, active project counts, commercial pipeline value, and territory revenue achievement.
- **Talent Planning**: HR inspects the **Skill Matrix Heatmap** to identify skill shortages in emerging technologies across departments, creating a focused training requisition.
- **Recruitment**: HR reviews candidates for an open position. Uses the **Resume Screener** to run a first-pass comparison of 25 applicant resumes against the job description, shortlisting the top 5 candidates for technical interviews.

---

## 6. Comparison: MobiusEMS vs. Disconnected SaaS Tools

| Capability | Fragmented Point Solutions (Typical Stack) | MobiusEMS Unified Platform |
|:---|:---|:---|
| **Attendance Tracking** | Biometric fingerprint machines; expensive hardware, fails for field staff, manual punch reconciliation. | Browser-based Haversine geofencing (300m radius); zero hardware, anti-spoofing protection, automatic late/half-day logic. |
| **Task & Work Management** | Standalone boards (Trello/Asana); disconnected from employee profiles, payroll, and appraisals. | Integrated Kanban boards; direct links to weekly deliverables, blocker logs, rework metrics, and performance evidence. |
| **Performance Reviews** | Annual spreadsheets or standalone review tools; subjective, recency-biased, lacking historical evidence. | Continuous evidence logging, measurable KPIs, 360 reviews, deterministic mathematical scoring, and frozen immutable snapshots. |
| **Task Creation & Updates** | Tedious multi-field web forms; employees procrastinate logging daily time and status. | Local multilingual voice-to-task (11 Indian languages + English); audio shredded immediately, zero per-minute API fees. |
| **Commercial Sales** | Expensive external CRM (Salesforce/HubSpot); disconnected from employee attendance, leave, and capacity. | Native 7-tier GIS hierarchy (Global to Pincode), territory quotas, lead SLA tracking, deal pipelines, and automated revenue ledger. |
| **Recruitment & Screening** | Manual resume scanning in shared inboxes or expensive external ATS subscriptions. | Integrated job description library, candidate pipelines, and automated PDF resume screening with advisory skill matching. |
| **Artificial Intelligence** | Black-box algorithms or intrusive surveillance tools attempting to rate or rank staff automatically. | Transparent advisory AI for drafting and company policy Q&A; strict ethical lock against automated personnel decisions. |
| **Data Privacy & Security** | Multiple third-party vendors with scattered data ownership and complex compliance agreements. | Single tenant-isolated database, fail-closed security, HttpOnly rotating sessions, and complete tamper-evident audit logs. |

---

## 7. Deployment, Technical Architecture & Infrastructure

MobiusEMS is built on modern, production-tested enterprise technologies engineered for performance, maintainability, and data sovereignty:

- **Frontend Application**: React 19 SPA, TypeScript 5.8, Vite 7, Tailwind CSS, TanStack React Query, React Hook Form, Zod schema validation, Recharts analytics, and Leaflet GIS mapping.
- **Backend API Runtime**: Node.js 20+ LTS, Express 4.21, Zod request boundary validation, rate limiting, Helmet security headers, and restricted CORS.
- **Persistence & Cloud Storage**: MongoDB Atlas 7+ with tenant-scoped collections, compound indexes, and authenticated Cloudinary cloud storage for private encrypted assets.
- **Speech Engine**: Local Python `faster-whisper` worker running on host infrastructure with zero external API calls and instant audio shredding.
- **Email Delivery**: Brevo transactional API integration with webhook listeners for delivery, open, and bounce tracking.
- **Deployment Flexibility**:
  - **Managed Cloud**: Hosted on high-performance dedicated Node.js infrastructure with automated SSL and daily snapshots.
  - **Private / On-Premise Cloud**: Deployable within your organization's private VPC (AWS, Azure, Google Cloud) or on-premise container cluster (Docker / Kubernetes).

---

## 8. Implementation & Onboarding Roadmap

Transitioning to MobiusEMS is structured and straightforward. A standard enterprise rollout follows a 4-week onboarding plan:

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│                         4-WEEK ROLLOUT TIMELINE                                │
├───────────────┬────────────────────────────────────────────────────────────────┤
│ Week 1        │ Organization Setup & Tenant Configuration                      │
│               │ - Provision isolated tenant workspace                         │
│               │ - Configure departments, teams, designations, and office coords│
│               │ - Define roles and administrative access privileges            │
├───────────────┼────────────────────────────────────────────────────────────────┤
│ Week 2        │ Employee Provisioning & Core Workflows                         │
│               │ - Bulk employee invitation & resumable profile onboarding      │
│               │ - Activate geofenced attendance & leave policies               │
│               │ - Set up initial project portfolios and Kanban boards          │
├───────────────┼────────────────────────────────────────────────────────────────┤
│ Week 3        │ Commercial Sales & Capability Matrix                           │
│               │ - Configure geographic territories and assign sales reps       │
│               │ - Import customer accounts, active leads, and quota targets    │
│               │ - Populate skill catalog and initiate baseline assessments     │
├───────────────┼────────────────────────────────────────────────────────────────┤
│ Week 4        │ Performance Cadence & Full Operation                           │
│               │ - Configure KPI templates and cascading goals                  │
│               │ - Launch weekly update rhythm and 1-on-1 workspaces            │
│               │ - Conduct manager training on reviews and executive dashboards │
└───────────────┴────────────────────────────────────────────────────────────────┘
```

---

## 9. Frequently Asked Questions

#### Q1: Can MobiusEMS run completely on our own private infrastructure?
**Yes.** While many clients prefer our managed cloud deployment, MobiusEMS can be deployed entirely within your own private VPC (AWS, Azure, GCP) or on-premise Linux environment. All components—including the database, the API, and the local speech recognition engine—can run within your private network perimeter.

#### Q2: How does the voice feature handle data privacy and sensitive company information?
Speech transcription runs locally on the application host via `faster-whisper`. The recorded audio is received over HTTPS, written to an ephemeral temporary file, transcribed into text, and **immediately shredded**. The audio recording is never written to persistent storage, never backed up, and never shared with third-party AI vendors.

#### Q3: What happens if an employee tries to spoof their GPS location for attendance?
MobiusEMS requires high-precision GPS coordinates from the browser's hardware geolocation API. If a location-spoofing tool or emulator introduces coordinate variance greater than 200 meters, the check-in is rejected automatically. Furthermore, the Haversine distance formula validates that the check-in occurs within 300 meters of the configured office location.

#### Q4: Can we customize our review cycles and KPI weightings?
**Yes.** Review templates, KPI weightings, and goal achievement percentages are fully configurable by HR administrators. You can define distinct performance templates for engineering, sales, customer support, and administrative teams.

#### Q5: Is data segregated between different client organizations?
**Yes.** MobiusEMS enforces logical multi-tenancy with fail-closed database proxies. Every database read, write, update, and aggregation is automatically bound to the authenticated user's organization (`tenantId`) via Node.js `AsyncLocalStorage`. It is technically impossible for one client organization to query or view records belonging to another.

---

## 10. Next Steps & Demonstration

To explore how MobiusEMS can simplify your organization's workforce operations, eliminate disconnected software subscriptions, and establish clear delivery accountability:

- **Schedule a Tailored Demonstration**: We will configure a live demonstration sandbox tailored to your company's department structure, office locations, and sales territories.
- **Pilot Program**: Launch a 30-day pilot with a single department or sales territory to experience the platform in your live operational environment.
- **Contact**: Reach out to our enterprise solutions team at **`contact@whalexy.com`** or visit **`https://employee.whalexy.com`**.

---
*© 2026 Mobius Bloom Venture Pvt Ltd. All rights reserved.*
'''

def generate_markdown(output_path):
    content = get_markdown_content()
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Markdown generated: {output_path} ({len(content)} chars)")

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, border_color="cbd5e1"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>
            <w:bottom w:val="single" w:sz="8" w:space="0" w:color="{border_color}"/>
            <w:left w:val="none"/>
            <w:right w:val="none"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>
            <w:insideV w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

def add_callout(doc, text, title=None, border_color="2563eb", bg_color="f8fafc"):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>
            <w:top w:val="none"/>
            <w:right w:val="none"/>
            <w:bottom w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    if title:
        run_title = p.add_run(f"{title}\n")
        run_title.font.bold = True
        run_title.font.size = Pt(10)
        run_title.font.color.rgb = RGBColor(15, 23, 42)
        run_title.font.name = "Segoe UI"
    
    run_text = p.add_run(text)
    run_text.font.size = Pt(9.5)
    run_text.font.color.rgb = RGBColor(51, 65, 85)
    run_text.font.name = "Segoe UI"
    
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(0)
    p_after.paragraph_format.space_after = Pt(4)

def generate_docx(output_path):
    doc = Document()
    
    # Page Setup: A4, 0.8 in margins
    for section in doc.sections:
        section.page_width = Inches(8.27)
        section.page_height = Inches(11.69)
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
    
    # Styles
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Segoe UI'
    style_normal.font.size = Pt(10)
    style_normal.font.color.rgb = RGBColor(51, 65, 85)
    style_normal.paragraph_format.line_spacing = 1.2
    style_normal.paragraph_format.space_after = Pt(5)

    # Document Header Badge
    p_badge = doc.add_paragraph()
    p_badge.paragraph_format.space_after = Pt(2)
    run_badge = p_badge.add_run("ENTERPRISE PRODUCT SPECIFICATION & CAPABILITIES OVERVIEW")
    run_badge.font.size = Pt(8)
    run_badge.font.bold = True
    run_badge.font.color.rgb = RGBColor(37, 99, 235)
    
    # Title
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    run_title = p_title.add_run("MobiusEMS Feature Overview")
    run_title.font.size = Pt(24)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(15, 23, 42)
    
    # Subtitle
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(12)
    run_sub = p_sub.add_run("A connected platform for workforce operations, daily project delivery, objective performance intelligence, and commercial sales")
    run_sub.font.size = Pt(11)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(100, 116, 139)

    # Meta box
    add_callout(
        doc,
        "Mobius Bloom Venture Pvt Ltd  |  Product Version: v2.0-PROD  |  Primary System: https://employee.whalexy.com\nTarget Audience: Prospective Enterprise Clients, CXOs, HR Directors, Operations Leads, Commercial Heads",
        title="DOCUMENT CONTEXT",
        border_color="0f172a",
        bg_color="f1f5f9"
    )

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(15)
        run.font.bold = True
        run.font.color.rgb = RGBColor(15, 23, 42)
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(12)
        run.font.bold = True
        run.font.color.rgb = RGBColor(30, 58, 138)
        return p

    def add_bullet(bold_prefix, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        run_p = p.add_run(bold_prefix)
        run_p.font.bold = True
        run_p.font.color.rgb = RGBColor(15, 23, 42)
        run_t = p.add_run(text)
        run_t.font.color.rgb = RGBColor(51, 65, 85)

    # 1. Executive Summary
    add_h1("1. Executive Summary: Breaking the 5-Tool Trap")
    p = doc.add_paragraph()
    p.add_run("In most growing organizations, everyday operations are fragmented across a patchwork of disconnected single-purpose tools: biometric fingerprint machines that fail for field staff, project boards disconnected from HR, annual appraisal spreadsheets conducted months after work is done, and heavy external CRMs that know nothing about employee capacity or leave. ")
    p.add_run("The result is constant administrative overhead, endless manual status chasing, and leadership flying blind without reliable data.")

    p2 = doc.add_paragraph()
    p2.add_run("MobiusEMS replaces this tool sprawl with a single, role-aware operational workspace. It connects daily work execution, verified geofenced attendance, skill matrix capabilities, objective performance evidence, talent acquisition, and commercial sales territories into one coherent system.")

    # 2. Core Principles
    add_h1("2. Our Core Engineering Principles")
    add_bullet("Deterministic Math Over Black-Box AI: ", "All performance appraisals, KPI calculations, attendance records, sales capacity forecasts, and contribution percentiles are calculated using pure mathematical algorithms. LLMs are strictly an advisory layer for drafting text and answering policy questions. The platform enforces an explicit architectural policy: AI is strictly prohibited from making or modifying promotion, compensation, disciplinary, or termination decisions.")
    add_bullet("Respectful Accountability Over Invasive Surveillance: ", "MobiusEMS strictly rejects invasive employee monitoring software. There are no background keyloggers, no secret screen grabbers, and no 24/7 mobile location tracking. Accountability is measured through physical presence at check-in/out via 300m browser geofencing and verifiable work delivery on project tasks.")
    add_bullet("Data Sovereignty & Local Zero-Retention Voice: ", "Speech transcription runs locally on your host server via faster-whisper. Voice commands are converted into structured draft tasks on your machine, and the ephemeral audio file is shredded immediately in code. Audio recordings never leave your servers, are never stored on disk, and incur zero per-minute external API fees.")

    # Table of modules
    add_h1("3. Capabilities at a Glance")
    table = doc.add_table(rows=1, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_table_borders(table)

    col_widths = [Inches(1.8), Inches(3.4), Inches(1.5)]
    headers = ["Functional Module", "What It Delivers", "Primary Users"]
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], "0f172a")
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=120, right=120)
        p = hdr_cells[i].paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(title)
        run.font.bold = True
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(255, 255, 255)

    modules_data = [
        ("Workforce & Org Setup", "Departments, teams, designations, Employee 360 profiles, career history, and resumable onboarding.", "HR, Managers, Employees"),
        ("Smart Attendance", "Mobile browser check-in, 300m Haversine geofence, 11:30 AM cutoff, 4h half-day, and leave management.", "All Employees, HR Ops"),
        ("Project & Task Delivery", "Kanban boards, validated state transitions, blocker escalation, cycle time, and rework metrics.", "Project Teams, Managers"),
        ("Local Voice-to-Task", "Multilingual speech capture (11 Indian languages + English), Hinglish NLP parser, and editable draft cards.", "Field Staff, Engineers"),
        ("Skills & Capability Matrix", "Verified vs self-reported skills, departmental heatmaps, role benchmarks, and timed quiz assessments.", "HR, Practice Leads"),
        ("Objective Performance", "Cascading goals, quantifiable KPIs, 360 reviews, deterministic math scoring, and frozen audit snapshots.", "Leadership, Managers"),
        ("Contribution Intelligence", "Weekly deliverable updates, velocity metrics, contribution percentiles, and evidence coverage checks.", "Team Leads, People Ops"),
        ("Commercial Sales & GIS", "7-tier GIS hierarchy (Global to Pincode), territory quotas, lead SLA tracking, pipelines, and revenue ledger.", "Sales Reps, Sales Heads"),
        ("Talent Acquisition", "Job description library, candidate hiring pipelines, and automated PDF resume screening with skill matching.", "Recruiters, Hiring Leads"),
        ("People Growth & 1-on-1s", "Structured 1-on-1 meeting workspace, internal training catalog, peer recognitions, and private to-dos.", "Managers, Employees"),
        ("Governance & Security", "Fail-closed multi-tenancy, HttpOnly rotating sessions, authenticated private files, and tamper-evident audit logs.", "IT, Security, Compliance")
    ]

    for mod, desc, users in modules_data:
        row = table.add_row()
        cells = row.cells
        cells[0].width = col_widths[0]
        cells[1].width = col_widths[1]
        cells[2].width = col_widths[2]
        for idx, text in enumerate([mod, desc, users]):
            set_cell_margins(cells[idx], top=80, bottom=80, left=100, right=100)
            p = cells[idx].paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(text)
            run.font.size = Pt(8.8)
            if idx == 0:
                run.font.bold = True
                run.font.color.rgb = RGBColor(15, 23, 42)
            else:
                run.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph() # spacing

    # 4. Detailed Modules
    add_h1("4. Comprehensive Module Deep-Dive")

    add_h2("4.1 Unified Workforce & Organizational Structure")
    p = doc.add_paragraph("The foundation of MobiusEMS is a flexible organizational graph that mirrors your real operating hierarchy:")
    add_bullet("Dynamic Organizational Hierarchy: ", "Define Departments, Teams, and Designations with configurable reporting lines and approval paths. Adapt structures as your organization evolves without database migrations.")
    add_bullet("Employee 360 Longitudinal Profiles: ", "Each profile connects employment details, emergency contacts, active tasks, verified skills, appraisal records, leave balances, 1-on-1 logs, and career milestones into one working view.")
    add_bullet("Invitation-Only Provisioning & Resumable Onboarding: ", "New hires are provisioned via secure invitation links. The system generates temporary credentials, enforces mandatory password changes upon first login, and provides a step-by-step resumable profile wizard.")
    add_bullet("Role-Based Access Control: ", "Five core system roles (SUPER_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, MANAGER, and EMPLOYEE) enforce strict separation of duties and data confidentiality.")

    add_h2("4.2 Smart Geofenced Attendance & Leave Management")
    p = doc.add_paragraph("Eliminate costly biometric hardware maintenance and manual muster-roll reconciliations:")
    add_bullet("Zero-Hardware Mobile Browser Check-In: ", "Employees check in from their smartphone or laptop browser. The application validates their physical presence using native HTML5 browser geolocation.")
    add_bullet("Haversine Spherical Geofencing (300m Radius): ", "Calculates exact spherical distance against configured office coordinates. Check-ins outside 300 meters are rejected.")
    add_bullet("GPS Anti-Spoofing Protection: ", "Check-in attempts with GPS accuracy fuzzier than 200 meters are automatically blocked to prevent mock-location emulators.")
    add_bullet("Predictable Business Rules: ", "Check-ins after 11:30 AM IST automatically mark the day as LATE. Shifts under 4 hours (240 minutes) upon checkout automatically demote the status to HALF_DAY. Clean 5-state taxonomy: PRESENT, LATE, HALF_DAY, ON_LEAVE, or ABSENT.")
    add_bullet("Attendance Register & Regularization: ", "Managers view real-time team availability. Employees can submit regularization requests with notes for unexpected transit delays or client visits.")

    add_h2("4.3 Project Delivery & Visual Task Execution")
    p = doc.add_paragraph("Keep client deliverables on track and surface workflow roadblocks early:")
    add_bullet("Project Portfolio Management: ", "Track project codes, budgets, target deadlines, team rosters, and client stakeholder references.")
    add_bullet("Interactive Kanban State Machine: ", "Tasks progress through validated states: Todo -> In Progress -> In Review -> Done. Prevents skipping critical stages or moving incomplete work to review.")
    add_bullet("Explicit Blocker Escalation: ", "Team members can flag tasks as blocked and document the exact reason (e.g., waiting for client API keys or assets). Blockers immediately highlight on manager dashboards.")
    add_bullet("Cycle Time & Rework Tracking: ", "Monitors planned vs actual hours, cycle time, and rework loops. Frequent rework cycles highlight requirements ambiguity or skill training opportunities.")

    add_h2("4.4 Local Zero-Retention Voice-to-Task Capture")
    p = doc.add_paragraph("Field workers, executives, and technical leads rarely fill out clunky mobile form fields. MobiusEMS introduces speech-driven task capture built specifically for Indian and multilingual enterprise environments:")
    add_bullet("Local faster-whisper Engine: ", "Runs directly on your application server using optimized local models. Zero per-minute cloud API bills and zero vendor lock-in.")
    add_bullet("Guaranteed Audio Shredding (Zero Retention): ", "Audio is ingested into an ephemeral temp file, transcribed, and shredded immediately in a strict code finally block. Raw audio is never stored on disk or in the cloud.")
    add_bullet("11 Indian Languages + English: ", "Full support for English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and Urdu.")
    add_bullet("Intelligent Multilingual NLP Parser: ", "Differentiates between future assignments and completed work logs, converts spoken number words ('two hours', 'do ghante') into numeric hours, and splits compound instructions ('Ayush ko frontend do aur Priya ko backend do').")
    add_bullet("Human-in-the-Loop Confirmation: ", "Transcripts are never committed automatically. The user reviews and edits a structured preview card before saving to the database.")

    add_h2("4.5 Capability, Skills Matrix & Timed Assessments")
    p = doc.add_paragraph("Build clear visibility into workforce technical and operational capabilities:")
    add_bullet("Standardized Skills Catalog: ", "Centralized taxonomy of technical, functional, and domain skills categorized by competency area.")
    add_bullet("Verified vs Self-Reported Ratings: ", "Employees self-rate skills (1-5 scale) with evidence. Ratings remain flagged as Self-Reported until verified by a manager or peer.")
    add_bullet("Departmental Skill Heatmaps: ", "Visual matrix showing skill depth across teams, identifying single-point dependency vulnerabilities.")
    add_bullet("Role Competency Benchmarks: ", "Compares employee profiles against defined designation requirements to highlight specific training gaps.")
    add_bullet("Built-In Timed Assessments: ", "Create multiple-choice quizzes with randomized question pools, time limits, and automated scoring.")

    add_h2("4.6 Objective Performance Management & Snapshots")
    p = doc.add_paragraph("Eliminate annual review anxiety, recency bias, and subjective favoritism:")
    add_bullet("Cascading Goals & Measurable KPIs: ", "Quantifiable targets, milestones, and percentage weights aligned from leadership down to individual contributors.")
    add_bullet("Structured 360 Performance Reviews: ", "Multi-competency evaluation templates covering technical execution, collaboration, and leadership.")
    add_bullet("Deterministic Mathematical Scoring: ", "Final Score = (Goals Achievement x Wg) + (KPI Performance x Wk) + (Review Competencies x Wr). Grade bands: Exceeding (>=90%), Meeting (75-89.9%), Needs Improvement (60-74.9%), Unsatisfactory (<60%).")
    add_bullet("Immutable Historical Snapshots: ", "Freezes all inputs, weights, ratings, and formulas into an immutable cryptographic snapshot, eliminating post-review alterations.")

    add_h2("4.7 Commercial Sales Intelligence & Geographic Management (GIS)")
    p = doc.add_paragraph("Connect commercial revenue operations directly to employee capacity and organization structure:")
    add_bullet("7-Tier Geographic Hierarchy (GIS): ", "Model territories from Global and Country down through State, District, City, Area, and Pincode.")
    add_bullet("Interactive GIS Heatmaps: ", "Visual maps showing customer density, active leads, sales rep deployment, and revenue distribution.")
    add_bullet("Territory Quotas & Headcount Capacity: ", "Assign sales managers and reps to territories with defined lead capacity thresholds to prevent lead neglect.")
    add_bullet("Lead Pipeline & SLA Tracking: ", "Enforce response SLAs and automatically calculate Estimated Lost Revenue when leads sit unattended.")
    add_bullet("Visual Opportunity Pipeline: ", "Track deals from Prospecting to Closed-Won / Closed-Lost with probability-weighted expected revenue.")
    add_bullet("Automated Revenue Ledger: ", "Closed-won opportunities automatically book realized revenue transactions into the ledger.")
    add_bullet("3-Tier Scoped Commercial Access: ", "Field reps see SELF records, regional managers see TEAM territories, and executives see ALL organization data.")

    add_h2("4.8 Talent Acquisition & Automated Resume Screening")
    p = doc.add_paragraph("Streamline recruitment within the same platform:")
    add_bullet("Job Description (JD) Library: ", "Maintain standardized job requisitions tied to organizational skill profiles.")
    add_bullet("Candidate Hiring Pipelines: ", "Track applicants through Sourced, Screened, Interviewing, Offer, and Hired stages.")
    add_bullet("Automated Resume Screening: ", "Upload PDF/DOCX resumes. The engine extracts skills, education, and experience years, matching them against job requirements.")
    add_bullet("Transparent Match Evidence: ", "Generates an advisory match score detailing fulfilled and missing criteria to assist recruiters.")

    add_h2("4.9 Enterprise Governance, Security & Compliance")
    p = doc.add_paragraph("Engineered with security and regulatory compliance as core architectural requirements:")
    add_bullet("Fail-Closed Multi-Tenancy: ", "Data isolation enforced at the database driver abstraction layer using AsyncLocalStorage and Mongoose proxies. Complete IDOR immunity.")
    add_bullet("HttpOnly Rotating Sessions: ", "15-minute JWT access tokens paired with rotating refresh tokens. Replay detection immediately revokes the session family.")
    add_bullet("Private Authenticated Document Storage: ", "Files stored with randomized keys in Cloudinary. Download links are signed, time-limited, and generated only after server-side permission checks.")
    add_bullet("Tamper-Evident Audit Trail: ", "Every critical update (role changes, salary revisions, permissions, voice tasks) logs actor ID, timestamp, IP, and JSON diffs.")

    # 5. Real-World Walkthrough
    add_h1("5. Real-World Scenarios: A Day in the Life")
    add_bullet("The Software Engineer: ", "Checks in via mobile browser within 300m of the office (9:15 AM). Reviews Kanban tasks, flags a third-party blocker. Completes a feature, uses local voice command ('Finished task 104 in 3 hours') to log hours and move to review. Submits weekly progress check-in before checkout.")
    add_bullet("The Field Sales Rep: ", "Checks territory leads on mobile. Visits a client, records a voice note updating deal status to Proposal Sent. Closes a contract at 3:00 PM; moving the deal to Won automatically logs realized revenue and updates quarterly quota pacing.")
    add_bullet("The People Manager: ", "Reviews morning attendance register to ensure coverage. Unblocks a stalled task on the Kanban board. Conducts a structured 1-on-1 with shared discussion notes. Prepares a quarterly review using objective KPI data and advisory AI drafts.")
    add_bullet("The HR Director: ", "Inspects the organization skill heatmap to identify training needs. Runs batch resume screening against open requisitions. Monitors territory revenue and reviews tamper-evident audit logs.")

    # 6. Comparison Table
    add_h1("6. Comparison: MobiusEMS vs. Disconnected SaaS Tools")
    comp_table = doc.add_table(rows=1, cols=3)
    comp_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    comp_table.autofit = False
    set_table_borders(comp_table)

    comp_widths = [Inches(1.8), Inches(2.4), Inches(2.5)]
    comp_headers = ["Capability", "Fragmented SaaS Stack", "MobiusEMS Unified Platform"]
    hdr_cells = comp_table.rows[0].cells
    for i, title in enumerate(comp_headers):
        hdr_cells[i].width = comp_widths[i]
        set_cell_background(hdr_cells[i], "0f172a")
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=100, right=100)
        p = hdr_cells[i].paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(title)
        run.font.bold = True
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(255, 255, 255)

    comp_rows = [
        ("Attendance", "Biometric fingerprint machines; expensive hardware, fails for field reps.", "Mobile browser Haversine geofence (300m); zero hardware, anti-spoofing protection."),
        ("Task Tracking", "Standalone Trello/Asana; disconnected from employee profiles and appraisals.", "Integrated Kanban; directly feeds weekly deliverables, blocker logs, and review evidence."),
        ("Appraisals", "Annual spreadsheets; subjective, recency-biased, and lacking historical proof.", "Continuous delivery evidence, quantifiable KPIs, deterministic math scoring, frozen snapshots."),
        ("Voice Input", "Manual form entry or expensive per-minute third-party cloud speech APIs.", "Local faster-whisper on server; 11 Indian languages, zero per-minute fees, instant audio shredding."),
        ("Commercial Sales", "Expensive standalone CRM; disconnected from employee capacity and leave.", "Native 7-tier GIS hierarchy, territory quotas, lead SLA tracking, and automated revenue ledger."),
        ("Recruiting", "Manual resume scanning in shared inboxes or expensive external ATS.", "Integrated JD library, candidate pipelines, and automated PDF resume screening with skill matching."),
        ("AI Approach", "Black-box models or invasive surveillance attempting to rate or rank staff.", "Transparent advisory AI; strict ethical lock against automated personnel decisions.")
    ]

    for cap, frag, mob in comp_rows:
        row = comp_table.add_row()
        cells = row.cells
        cells[0].width = comp_widths[0]
        cells[1].width = comp_widths[1]
        cells[2].width = comp_widths[2]
        for idx, text in enumerate([cap, frag, mob]):
            set_cell_margins(cells[idx], top=70, bottom=70, left=80, right=80)
            p = cells[idx].paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(text)
            run.font.size = Pt(8.5)
            if idx == 0:
                run.font.bold = True
                run.font.color.rgb = RGBColor(15, 23, 42)
            elif idx == 2:
                run.font.color.rgb = RGBColor(30, 58, 138)
            else:
                run.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_paragraph()

    # 7. Rollout
    add_h1("7. Implementation & 4-Week Rollout Plan")
    add_bullet("Week 1 (Org Setup & Governance): ", "Provision isolated tenant workspace, configure departments, teams, designations, office coordinates, and assign admin roles.")
    add_bullet("Week 2 (Workforce & Daily Rhythm): ", "Bulk invite employees with resumable onboarding, activate geofenced attendance, and set up project Kanban boards.")
    add_bullet("Week 3 (Sales & Skills Matrix): ", "Define geographic territories, assign sales reps, import customer accounts, and populate standardized skills catalog.")
    add_bullet("Week 4 (Performance Cadence): ", "Configure KPI templates and cascading goals, launch weekly update cadence, and activate manager review workspaces.")

    # 8. FAQs
    add_h1("8. Frequently Asked Questions")
    add_bullet("Can MobiusEMS run on our own private infrastructure? ", "Yes. While we offer a managed cloud deployment, MobiusEMS can be deployed entirely inside your private VPC (AWS, Azure, GCP) or on-premise container cluster.")
    add_bullet("How does the voice feature protect data privacy? ", "Transcription runs locally on your host server via faster-whisper. Ephemeral audio is shredded immediately in code after transcription. Audio is never stored or sent to third-party cloud APIs.")
    add_bullet("How does attendance prevent location spoofing? ", "The platform enforces native browser GPS precision. Coordinate variance fuzzier than 200m is rejected, and the Haversine formula ensures check-ins occur within 300m of the office.")
    add_bullet("Is data segregated between client organizations? ", "Yes. Fail-closed multi-tenancy enforced by AsyncLocalStorage and Mongoose proxies ensures every query and write is locked to the authenticated tenantId.")

    # Next steps callout
    add_callout(
        doc,
        "Schedule a Tailored Demonstration: We will configure a live sandbox reflecting your department hierarchy, office geofences, and sales territories.\nContact: contact@whalexy.com  |  Visit: https://employee.whalexy.com",
        title="READY TO GET STARTED?",
        border_color="2563eb",
        bg_color="eff6ff"
    )

    doc.save(output_path)
    print(f"DOCX generated: {output_path}")

def get_html_content():
    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MobiusEMS - Enterprise Product Feature Guide</title>
<style>
  @page {
    size: A4 portrait;
    margin: 12mm 15mm 12mm 15mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    font-size: 8.8pt;
    line-height: 1.42;
    color: #334155;
    margin: 0;
    padding: 0;
    background-color: #ffffff;
  }
  .page {
    page-break-after: always;
    height: 272mm;
    position: relative;
    padding-top: 12mm;
    padding-bottom: 12mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .page:last-child {
    page-break-after: avoid;
  }
  .page-header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 9mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 7pt;
    font-weight: 600;
    color: #64748b;
    letter-spacing: 0.8px;
    border-bottom: 1px solid #e2e8f0;
    text-transform: uppercase;
  }
  .page-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 8mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 7.2pt;
    color: #64748b;
    border-top: 1px solid #e2e8f0;
  }
  .content {
    flex: 1;
  }
  h1 {
    font-size: 14pt;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 8px 0;
    letter-spacing: -0.3px;
  }
  h2 {
    font-size: 10.5pt;
    font-weight: 700;
    color: #1e3a8a;
    margin: 10px 0 4px 0;
    letter-spacing: -0.2px;
  }
  h3 {
    font-size: 9pt;
    font-weight: 700;
    color: #0f172a;
    margin: 6px 0 2px 0;
  }
  p {
    margin: 0 0 6px 0;
  }
  .badge {
    display: inline-block;
    background-color: #eff6ff;
    color: #2563eb;
    border: 1px solid #bfdbfe;
    font-size: 7pt;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 4px;
    margin-bottom: 6px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .callout {
    background-color: #f8fafc;
    border-left: 3.5px solid #2563eb;
    padding: 8px 12px;
    border-radius: 0 4px 4px 0;
    margin: 8px 0;
    font-size: 8.4pt;
  }
  .callout strong {
    color: #0f172a;
  }
  .callout-dark {
    background-color: #0f172a;
    color: #f8fafc;
    border-left: 3.5px solid #3b82f6;
    padding: 8px 12px;
    border-radius: 0 4px 4px 0;
    margin: 8px 0;
  }
  .callout-dark strong {
    color: #ffffff;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 8pt;
  }
  th {
    background-color: #0f172a;
    color: #ffffff;
    font-weight: 600;
    text-align: left;
    padding: 5px 8px;
    border: 1px solid #0f172a;
  }
  td {
    padding: 4.5px 8px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
  }
  tr:nth-child(even) td {
    background-color: #f8fafc;
  }
  .grid-2 {
    display: flex;
    gap: 12px;
  }
  .grid-2 > div {
    flex: 1;
  }
  ul {
    margin: 3px 0 6px 16px;
    padding: 0;
  }
  li {
    margin-bottom: 3px;
  }
  li strong {
    color: #0f172a;
  }
  .feature-card {
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 8px 10px;
    margin-bottom: 8px;
    background-color: #ffffff;
  }
  .feature-card h3 {
    color: #1e3a8a;
    margin-top: 0;
    margin-bottom: 3px;
  }
</style>
</head>
<body>

<!-- PAGE 1: TITLE & EXECUTIVE SUMMARY -->
<div class="page">
  <div class="page-header">
    <span>MobiusEMS Enterprise Solution Guide</span>
    <span>Platform Capabilities Overview</span>
  </div>
  <div class="content">
    <div class="badge">Enterprise Product Specification</div>
    <h1 style="font-size: 20pt; margin-bottom: 4px; color: #0f172a;">MobiusEMS: Unified Workforce & Commercial Operations Platform</h1>
    <div style="font-size: 10.5pt; color: #64748b; font-style: italic; margin-bottom: 14px;">
      Connecting daily project delivery, geofenced attendance, capability intelligence, objective performance, and territory sales into one role-aware workspace.
    </div>

    <div class="callout" style="border-left-color: #0f172a; background-color: #f1f5f9; margin-bottom: 14px;">
      <strong>Product Version:</strong> v2.0-PROD &nbsp;|&nbsp; <strong>Deployment:</strong> https://employee.whalexy.com &nbsp;|&nbsp; <strong>Company:</strong> Mobius Bloom Venture Pvt Ltd<br>
      <strong>Target Audience:</strong> Prospective Enterprise Clients, CXOs, HR Directors, Operations Leads, Commercial Sales Leadership
    </div>

    <h2>1. Executive Summary: Breaking the "5-Tool Trap"</h2>
    <p>
      In most growing companies, everyday operations are fractured across single-purpose tools that do not talk to each other:
    </p>
    <ul>
      <li><strong>Hardware Attendance Clocks:</strong> Expensive to maintain, prone to hardware failures, and useless for field sales or distributed branch offices.</li>
      <li><strong>Disconnected Project Boards:</strong> Good for logging tasks, but completely isolated from employee records, payroll, and appraisals.</li>
      <li><strong>Spreadsheet-Driven Appraisals:</strong> Conducted once a year long after the work was done, suffering from recency bias, subjective favoritism, and missing work proof.</li>
      <li><strong>Standalone CRM Tools:</strong> Expensive commercial software that knows nothing about employee capacity, leave, or actual project workload.</li>
      <li><strong>Scattered Personnel Documents:</strong> Resumes buried in email threads, policies in shared folders, and no audit trail.</li>
    </ul>
    <p>
      <strong>MobiusEMS replaces this tool sprawl.</strong> It provides a single, role-aware operational environment where an engineer's completed task automatically feeds their weekly contribution score, a field rep's closed deal updates their territory quota and revenue ledger, and a manager's performance review is backed by tamper-proof historical evidence.
    </p>

    <h2>2. Our Core Engineering Principles</h2>
    <div class="feature-card">
      <h3>Principle 1: Deterministic Math Over Black-Box AI</h3>
      <p style="margin-bottom: 0;">
        All performance evaluations, KPI scorecards, attendance rules, sales capacity metrics, and contribution percentiles are computed with pure mathematical formulas. AI functions strictly as an advisory drafting assistant. <strong>The platform enforces an explicit architectural policy: AI is strictly barred from making or modifying promotion, compensation, disciplinary, or termination decisions.</strong>
      </p>
    </div>

    <div class="feature-card">
      <h3>Principle 2: Respectful Accountability Over Invasive Spyware</h3>
      <p style="margin-bottom: 0;">
        MobiusEMS rejects employee surveillance software. There are no background keyloggers, secret screen captures, or 24/7 GPS stalking. Accountability is measured through physical presence at check-in/out via browser geofencing (300m radius) and verifiable deliverables on project tasks.
      </p>
    </div>

    <div class="feature-card">
      <h3>Principle 3: Built-In Data Sovereignty & Local Zero-Retention Voice</h3>
      <p style="margin-bottom: 0;">
        Speech-to-task recognition runs locally on your host server via <code>faster-whisper</code>. Spoken voice commands are converted into draft tasks on your machine, and <strong>the ephemeral audio file is shredded immediately in code</strong>. Voice recordings never leave your servers, are never stored on disk, and incur zero per-minute external API fees.
      </p>
    </div>
  </div>
  <div class="page-footer">
    <span>Mobius Bloom Venture Pvt Ltd</span>
    <span>CONFIDENTIAL & PROPRIETARY — PREPARED FOR CLIENT REVIEW</span>
    <span>Page 1</span>
  </div>
</div>

<!-- PAGE 2: PLATFORM OVERVIEW TABLE & WORKFORCE/ATTENDANCE -->
<div class="page">
  <div class="page-header">
    <span>MobiusEMS Enterprise Solution Guide</span>
    <span>Core Operational Modules</span>
  </div>
  <div class="content">
    <h2>3. Platform Capabilities at a Glance</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Module</th>
          <th style="width: 50%;">Core Capability Delivered</th>
          <th style="width: 25%;">Primary Users</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Workforce & Org Setup</strong></td>
          <td>Departments, teams, designations, Employee 360 profiles, career history, and resumable onboarding.</td>
          <td>HR, Managers, Employees</td>
        </tr>
        <tr>
          <td><strong>Smart Attendance</strong></td>
          <td>Mobile browser geofence (300m radius), 11:30 AM cutoff, 4h half-day, and leave management.</td>
          <td>All Employees, HR Ops</td>
        </tr>
        <tr>
          <td><strong>Project & Task Delivery</strong></td>
          <td>Kanban state machine, blocker escalation, cycle time, rework metrics, and audit history.</td>
          <td>Project Teams, Managers</td>
        </tr>
        <tr>
          <td><strong>Local Voice-to-Task</strong></td>
          <td>Zero-retention speech capture (11 Indian languages + English), Hinglish NLP, and editable draft cards.</td>
          <td>Field Staff, Engineers</td>
        </tr>
        <tr>
          <td><strong>Skills & Capability Matrix</strong></td>
          <td>Verified vs self-reported skills, departmental heatmaps, role benchmarks, and timed assessments.</td>
          <td>HR, Practice Leads</td>
        </tr>
        <tr>
          <td><strong>Objective Performance</strong></td>
          <td>Cascading goals, measurable KPIs, 360 reviews, deterministic math scoring, and frozen snapshots.</td>
          <td>Leadership, Managers</td>
        </tr>
        <tr>
          <td><strong>Contribution Intelligence</strong></td>
          <td>Weekly deliverable updates, velocity metrics, contribution percentiles, and evidence coverage checks.</td>
          <td>Team Leads, People Ops</td>
        </tr>
        <tr>
          <td><strong>Commercial Sales & GIS</strong></td>
          <td>7-tier GIS hierarchy (Global to Pincode), territory quotas, lead SLA tracking, pipelines, and revenue ledger.</td>
          <td>Sales Reps, Sales Heads</td>
        </tr>
        <tr>
          <td><strong>Talent Acquisition</strong></td>
          <td>Job description library, candidate hiring pipelines, and automated PDF resume screening with skill matching.</td>
          <td>Recruiters, Hiring Leads</td>
        </tr>
        <tr>
          <td><strong>People Growth & 1-on-1s</strong></td>
          <td>Structured 1-on-1 meeting workspace, internal training catalog, peer recognitions, and private to-dos.</td>
          <td>Managers, Employees</td>
        </tr>
        <tr>
          <td><strong>Governance & Security</strong></td>
          <td>Fail-closed multi-tenancy, HttpOnly rotating sessions, authenticated private files, and audit logs.</td>
          <td>IT, Security, Compliance</td>
        </tr>
      </tbody>
    </table>

    <h2>4. Module Deep-Dive: People & Daily Execution</h2>
    
    <div class="feature-card">
      <h3>4.1 Unified Workforce & Organizational Structure</h3>
      <ul>
        <li><strong>Dynamic Org Hierarchy:</strong> Model Departments, Teams, and Designations with custom reporting lines and approval paths. Modify structures dynamically without database migrations.</li>
        <li><strong>Employee 360 Longitudinal Profiles:</strong> Single pane of glass connecting personal details, active tasks, verified skills, appraisal history, leave balances, 1-on-1 logs, and career milestones.</li>
        <li><strong>Frictionless Onboarding:</strong> Provision via secure invitation links, temporary credentials, mandatory password rotation upon first login, and a resumable onboarding wizard.</li>
        <li><strong>Role-Based Access Control:</strong> 5 system roles (<code>SUPER_ADMIN</code>, <code>HR_ADMIN</code>, <code>DEPARTMENT_HEAD</code>, <code>MANAGER</code>, <code>EMPLOYEE</code>) enforcing strict separation of duties.</li>
      </ul>
    </div>

    <div class="feature-card">
      <h3>4.2 Smart Geofenced Attendance & Leave Management</h3>
      <ul>
        <li><strong>Zero-Hardware Mobile Browser Check-In:</strong> Validates location from employee mobile/laptop browsers using native HTML5 geolocation without mandatory native app downloads.</li>
        <li><strong>Haversine Geofencing (300m Radius):</strong> Enforces check-in within a 300-meter radius of configured office coordinates. GPS accuracy fuzzier than 200m is rejected to block location spoofing.</li>
        <li><strong>Predictable Business Rules:</strong> Check-ins after 11:30 AM IST automatically mark as <code>LATE</code>. Total elapsed shift under 4 hours (240 mins) upon checkout demotes the day to <code>HALF_DAY</code>.</li>
        <li><strong>Clean 5-State Taxonomy:</strong> Classifies daily records into <code>PRESENT</code>, <code>LATE</code>, <code>HALF_DAY</code>, <code>ON_LEAVE</code>, or <code>ABSENT</code>. Includes regularization requests for field transit.</li>
      </ul>
    </div>
  </div>
  <div class="page-footer">
    <span>Mobius Bloom Venture Pvt Ltd</span>
    <span>CONFIDENTIAL & PROPRIETARY — PREPARED FOR CLIENT REVIEW</span>
    <span>Page 2</span>
  </div>
</div>

<!-- PAGE 3: TASK, VOICE, SKILLS, PERFORMANCE -->
<div class="page">
  <div class="page-header">
    <span>MobiusEMS Enterprise Solution Guide</span>
    <span>Delivery, Voice & Performance</span>
  </div>
  <div class="content">
    <h2>4. Module Deep-Dive (Continued)</h2>

    <div class="feature-card">
      <h3>4.3 Project Delivery & Visual Task Execution</h3>
      <ul>
        <li><strong>Portfolio Management:</strong> Manage project codes, budgets, target completion dates, team rosters, and client references.</li>
        <li><strong>Kanban State Machine:</strong> Tasks progress through validated states: <code>Todo</code> &rarr; <code>In Progress</code> &rarr; <code>In Review</code> &rarr; <code>Done</code>. Enforces validations to prevent skipping stages.</li>
        <li><strong>Explicit Blocker Escalation:</strong> Team members flag blockers directly on tasks (e.g. waiting for client assets). Blockers alert managers immediately to clear bottlenecks.</li>
        <li><strong>Rework & Cycle Time Metrics:</strong> Monitors planned vs actual hours and rework loops. Frequent rework cycles surface requirements ambiguity or training needs.</li>
      </ul>
    </div>

    <div class="feature-card">
      <h3>4.4 Local Zero-Retention Multilingual Voice-to-Task Capture</h3>
      <ul>
        <li><strong>Local Speech Transcription:</strong> Powered by <code>faster-whisper</code> running on host infrastructure. Zero per-minute API costs.</li>
        <li><strong>Guaranteed Audio Shredding:</strong> Ingested to ephemeral temp file, transcribed, and shredded immediately in a strict code <code>finally</code> block. Audio is never stored on disk or cloud.</li>
        <li><strong>11 Indian Regional Languages + English:</strong> English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and Urdu.</li>
        <li><strong>Smart Multilingual NLP Parser:</strong> Differentiates future tasks from completed work logs, converts spoken number words ("two hours", "दो घंटे") into numeric hours, and splits compound instructions ("Ayush ko frontend do aur Priya ko backend do").</li>
        <li><strong>Human Confirmation:</strong> Generates an editable preview card for user verification before database commit.</li>
      </ul>
    </div>

    <div class="feature-card">
      <h3>4.5 Capability, Skills Matrix & Timed Assessments</h3>
      <ul>
        <li><strong>Verified vs Self-Reported Skills:</strong> Clear distinction between self-ratings (1-5) and peer/manager verified skills with proof.</li>
        <li><strong>Departmental Skill Heatmaps:</strong> Visual matrix highlighting competency depth across teams and single-point dependency risks.</li>
        <li><strong>Role Benchmarks & Gap Analysis:</strong> Compares employee skill profiles against designation requirements to guide training.</li>
        <li><strong>Timed Assessments:</strong> Multiple-choice evaluations with randomized pools, time limits, and automated scoring.</li>
      </ul>
    </div>

    <div class="feature-card">
      <h3>4.6 Objective Performance Management & Snapshots</h3>
      <ul>
        <li><strong>Cascading Goals & Measurable KPIs:</strong> Quantifiable targets and weightings cascaded from company priorities down to individuals.</li>
        <li><strong>Structured 360 Reviews:</strong> Multi-competency evaluation templates covering execution, communication, and leadership rubrics.</li>
        <li><strong>Deterministic Math Formula:</strong> <code>Final Score = (Goals x Wg) + (KPIs x Wk) + (Review Competencies x Wr)</code>. Non-negotiable grade bands: Exceeding (&ge;90%), Meeting (75-89.9%), Needs Improvement (60-74.9%), Unsatisfactory (&lt;60%).</li>
        <li><strong>Immutable Frozen Snapshots:</strong> All inputs, ratings, and weights are locked into immutable cryptographic records preventing post-review alterations.</li>
      </ul>
    </div>
  </div>
  <div class="page-footer">
    <span>Mobius Bloom Venture Pvt Ltd</span>
    <span>CONFIDENTIAL & PROPRIETARY — PREPARED FOR CLIENT REVIEW</span>
    <span>Page 3</span>
  </div>
</div>

<!-- PAGE 4: COMMERCIAL SALES, RECRUITMENT, GOVERNANCE -->
<div class="page">
  <div class="page-header">
    <span>MobiusEMS Enterprise Solution Guide</span>
    <span>Commercial Operations & Security</span>
  </div>
  <div class="content">
    <h2>4. Module Deep-Dive: Commercial Operations & Security</h2>

    <div class="feature-card">
      <h3>4.7 Commercial Sales Intelligence & Geographic Management (GIS)</h3>
      <p style="margin-bottom: 4px;">Connect sales execution directly to workforce capacity and geographic territories:</p>
      <ul>
        <li><strong>7-Tier Geographic Hierarchy (GIS):</strong> Complete spatial hierarchy: <code>Global</code> &rarr; <code>Country</code> &rarr; <code>State</code> &rarr; <code>District</code> &rarr; <code>City</code> &rarr; <code>Area</code> &rarr; <code>Pincode</code>.</li>
        <li><strong>Interactive GIS Maps:</strong> Visual heatmaps showing customer density, active leads, sales rep deployment, and revenue distribution.</li>
        <li><strong>Territory Quotas & Headcount Capacity:</strong> Assign reps to territories with defined lead capacity thresholds to prevent lead neglect.</li>
        <li><strong>Lead Management & SLA Tracking:</strong> Enforce response SLAs and automatically compute <strong>Estimated Lost Revenue</strong> for neglected leads.</li>
        <li><strong>Opportunity Pipeline & Deal Stages:</strong> Visual pipeline (Prospecting to Closed-Won) with probability-weighted expected revenue.</li>
        <li><strong>Automated Revenue Ledger:</strong> Closed-won opportunities automatically book realized revenue transactions onto the ledger.</li>
        <li><strong>3-Tier Commercial Access Scoping:</strong> Reps see <code>SELF</code> records, managers see <code>TEAM</code> territories, and executives see <code>ALL</code> data.</li>
      </ul>
    </div>

    <div class="feature-card">
      <h3>4.8 Talent Acquisition & Automated Resume Screening</h3>
      <ul>
        <li><strong>Job Description (JD) Library:</strong> Standardized requisition templates tied to required organizational skill profiles.</li>
        <li><strong>Candidate Pipeline:</strong> Visual stages from Sourced and Screened to Technical Interview, Offer, and Hired.</li>
        <li><strong>Automated Resume Screening:</strong> Upload PDF/DOCX resumes. Extracts candidate skills, education, and experience years, matching them against job requirements with transparent match evidence for human recruiters.</li>
      </ul>
    </div>

    <div class="feature-card">
      <h3>4.9 Enterprise Governance, Security & Compliance</h3>
      <ul>
        <li><strong>Fail-Closed Multi-Tenancy:</strong> Logical tenant isolation enforced at database driver level via <code>AsyncLocalStorage</code> and Mongoose proxies. Zero cross-tenant data leakage (IDOR immunity).</li>
        <li><strong>HttpOnly Rotating Sessions:</strong> 15-minute JWT access tokens paired with rotating refresh tokens. Replay detection revokes the token family.</li>
        <li><strong>Private Authenticated Document Storage:</strong> Randomized keys in Cloudinary. Download links are signed, time-limited, and generated only after server-side permission checks. Files are never stored in public directories.</li>
        <li><strong>Tamper-Evident Audit Trail:</strong> Every critical mutation (role changes, salary updates, voice commands, AI requests) records actor ID, timestamp, IP address, and JSON diffs.</li>
      </ul>
    </div>

    <div class="feature-card">
      <h3>4.10 Pragmatic & Ethical AI Assistance</h3>
      <ul>
        <li><strong>Company Knowledge Assistant:</strong> Answers employee policy questions grounded in uploaded company handbooks. Unhandled queries escalate to HR.</li>
        <li><strong>Advisory Review Drafting:</strong> Prepares human-reviewable draft review summaries based on logged work history.</li>
        <li><strong>Multi-Provider Ready:</strong> Pre-configured for Groq (<code>llama-3.3-70b-versatile</code>), with support for OpenAI, Anthropic, Gemini, or local models.</li>
      </ul>
    </div>
  </div>
  <div class="page-footer">
    <span>Mobius Bloom Venture Pvt Ltd</span>
    <span>CONFIDENTIAL & PROPRIETARY — PREPARED FOR CLIENT REVIEW</span>
    <span>Page 4</span>
  </div>
</div>

<!-- PAGE 5: COMPARISON & ROLLOUT -->
<div class="page">
  <div class="page-header">
    <span>MobiusEMS Enterprise Solution Guide</span>
    <span>Comparison & Implementation</span>
  </div>
  <div class="content">
    <h2>5. Feature Comparison: MobiusEMS vs. Disconnected SaaS Tools</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 22%;">Operational Domain</th>
          <th style="width: 38%;">Fragmented SaaS Stack (Typical Setup)</th>
          <th style="width: 40%;">MobiusEMS Unified Platform</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Attendance Tracking</strong></td>
          <td>Biometric fingerprint machines; expensive hardware, fails for field staff, manual reconciliation.</td>
          <td>Mobile browser Haversine geofencing (300m radius); zero hardware, anti-spoofing protection, automatic late/half-day logic.</td>
        </tr>
        <tr>
          <td><strong>Task Management</strong></td>
          <td>Standalone boards (Trello/Asana); disconnected from employee profiles and appraisals.</td>
          <td>Integrated Kanban; directly feeds weekly deliverables, blocker logs, rework metrics, and review evidence.</td>
        </tr>
        <tr>
          <td><strong>Performance Reviews</strong></td>
          <td>Annual spreadsheets; subjective, recency-biased, lacking historical evidence.</td>
          <td>Continuous evidence logging, measurable KPIs, 360 reviews, deterministic math scoring, and frozen snapshots.</td>
        </tr>
        <tr>
          <td><strong>Voice Task Capture</strong></td>
          <td>Manual web forms or expensive per-minute third-party cloud speech APIs.</td>
          <td>Local <code>faster-whisper</code> on host; 11 Indian languages, zero per-minute fees, instant audio shredding.</td>
        </tr>
        <tr>
          <td><strong>Commercial Sales</strong></td>
          <td>Expensive standalone CRM; disconnected from employee capacity, leaves, and realized revenue.</td>
          <td>Native 7-tier GIS hierarchy, territory quotas, lead SLA tracking, deal pipelines, and automated revenue ledger.</td>
        </tr>
        <tr>
          <td><strong>Recruitment & Screening</strong></td>
          <td>Manual resume scanning in shared inboxes or expensive external ATS subscriptions.</td>
          <td>Integrated JD library, candidate pipelines, and automated PDF resume screening with advisory skill matching.</td>
        </tr>
        <tr>
          <td><strong>AI Capabilities</strong></td>
          <td>Black-box models or intrusive surveillance attempting to rate or rank staff automatically.</td>
          <td>Transparent advisory AI; strict ethical lock against automated personnel decisions.</td>
        </tr>
      </tbody>
    </table>

    <h2>6. Implementation & 4-Week Rollout Plan</h2>
    <div class="grid-2">
      <div class="feature-card">
        <h3 style="color: #0f172a;">Week 1: Org Setup & Governance</h3>
        <p style="font-size: 8pt; margin-bottom: 0;">
          Provision isolated tenant workspace, configure departments, teams, designations, office coordinates, and assign administrative roles.
        </p>
      </div>
      <div class="feature-card">
        <h3 style="color: #0f172a;">Week 2: Workforce & Daily Rhythm</h3>
        <p style="font-size: 8pt; margin-bottom: 0;">
          Bulk invite employees with resumable onboarding, activate geofenced attendance, and configure initial project Kanban boards.
        </p>
      </div>
    </div>
    <div class="grid-2">
      <div class="feature-card">
        <h3 style="color: #0f172a;">Week 3: Sales & Skills Matrix</h3>
        <p style="font-size: 8pt; margin-bottom: 0;">
          Define geographic territories, assign sales reps, import customer accounts, and populate standardized skills catalog.
        </p>
      </div>
      <div class="feature-card">
        <h3 style="color: #0f172a;">Week 4: Performance Cadence</h3>
        <p style="font-size: 8pt; margin-bottom: 0;">
          Configure KPI templates and cascading goals, launch weekly update cadence, and activate manager review workspaces.
        </p>
      </div>
    </div>

    <h2>7. Ready to Get Started?</h2>
    <div class="callout" style="border-left-color: #2563eb; background-color: #eff6ff;">
      <strong>Schedule a Tailored Demonstration:</strong> We will configure a live sandbox reflecting your department hierarchy, office geofences, and sales territories.<br>
      <strong>Contact:</strong> contact@whalexy.com &nbsp;|&nbsp; <strong>Visit:</strong> https://employee.whalexy.com &nbsp;|&nbsp; <strong>Mobius Bloom Venture Pvt Ltd</strong>
    </div>
  </div>
  <div class="page-footer">
    <span>Mobius Bloom Venture Pvt Ltd</span>
    <span>CONFIDENTIAL & PROPRIETARY — PREPARED FOR CLIENT REVIEW</span>
    <span>Page 5</span>
  </div>
</div>

</body>
</html>
"""

def generate_html_and_pdf(html_path, pdf_path):
    html_content = get_html_content()
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"HTML generated: {html_path}")

    edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_exe):
        edge_exe = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

    print(f"Executing Edge headless to generate PDF: {pdf_path}")
    cmd = [
        edge_exe,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path}",
        html_path
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Edge error: {res.stderr}")
        return False

    if os.path.exists(pdf_path):
        size_kb = os.path.getsize(pdf_path) / 1024
        print(f"PDF generated: {pdf_path} ({size_kb:.1f} KB)")
        try:
            reader = PdfReader(pdf_path)
            print(f"Verified PDF page count: {len(reader.pages)}")
        except Exception as e:
            print(f"pypdf note: {e}")
        return True
    else:
        print("PDF was not created.")
        return False

def build_all():
    os.makedirs(DOCS_DIR, exist_ok=True)
    os.makedirs(DELIV_DIR, exist_ok=True)

    md_path = os.path.join(DOCS_DIR, "MobiusEMS_Product_Feature_Documentation.md")
    docx_path = os.path.join(DELIV_DIR, "MobiusEMS_Feature_Documentation_Client.docx")
    html_path = os.path.join(DELIV_DIR, "MobiusEMS_Feature_Documentation_Client.html")
    pdf_path = os.path.join(DELIV_DIR, "MobiusEMS_Feature_Documentation_Client.pdf")

    print("--- 1. Generating Markdown ---")
    generate_markdown(md_path)

    print("--- 2. Generating Word DOCX ---")
    generate_docx(docx_path)

    print("--- 3. Generating HTML & Publication PDF ---")
    generate_html_and_pdf(html_path, pdf_path)

    print("All feature documentation deliverables generated successfully!")

if __name__ == "__main__":
    build_all()
