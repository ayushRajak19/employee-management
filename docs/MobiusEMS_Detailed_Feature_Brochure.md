# MobiusEMS: Detailed Enterprise Feature Brochure & Capabilities Guide
**The Complete Product Catalog, Operational Workflows, and Technical Architecture**  
*Mobius Bloom Venture Pvt Ltd | Primary Deployment: `https://employee.whalexy.com`*  
*Product Version: v2.0.0-PROD | Document Classification: Official Enterprise Product Collateral*

---

# Executive Overview: The Unified Operating System for Modern Enterprise

### The Reality of Enterprise Software Today: The "5-Tool Trap"
Modern enterprises run on fragmented software stacks. A typical mid-sized to enterprise business juggles:
1. **Biometric or Hardware Time Clocks**: Prone to sensor wear, network drops, costly annual maintenance contracts (AMCs), and useless for distributed, field, or hybrid teams.
2. **Project Task Boards (Jira, Trello, Asana)**: Excellent for tickets, but completely siloed from attendance, payroll, and employee reviews.
3. **Spreadsheet-Driven Appraisals**: Evaluated months after work happened, heavily biased toward recent memory, subjective impressions, and personal favoritism.
4. **Standalone CRM Software (Salesforce, HubSpot)**: Expensive per-seat licenses, disconnected from field rep capacity, daily leaves, or verified revenue accounting.
5. **Scattered Folders & Drives**: Identity proofs, resumes, and training records scattered across Google Drive, Dropbox, and email inboxes with zero compliance logging.

**The Result**: Administrative gridlock, data duplication, high recurring licensing costs, and leadership lacking a single, unified picture of truth.

---

### The MobiusEMS Solution
**MobiusEMS** eliminates this tool sprawl. It unifies daily execution, verified GPS attendance, talent capabilities, objective performance evidence, commercial field territories, and enterprise governance into one seamless, multi-tenant platform.

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             MOBIUSEMS CORE ECOSYSTEM                             │
├─────────────────────────┬────────────────────────────┬───────────────────────────┤
│    PEOPLE & PRESENCE    │     WORK & CAPABILITY      │    COMMERCIAL & REVENUE   │
├─────────────────────────┼────────────────────────────┼───────────────────────────┤
│ • 300m GPS Geofencing   │ • 7-Stage Visual Kanban    │ • 7-Tier GIS Mapping      │
│ • 11:30 AM Late Cutoff  │ • Local Zero-Retention AI  │ • Rep Headcount Math      │
│ • 4h Half-Day Demotion  │ • Blocker Real-Time Alerts │ • Lead SLA Lost Revenue   │
│ • Leave Quotas & Regs   │ • Verified Skills Matrix   │ • Idempotent Rev. Ledger  │
│ • Employee 360 Timeline │ • Timed Quiz Assessments   │ • 5-Tier Incentive Engine │
├─────────────────────────┴────────────────────────────┴───────────────────────────┤
│                         ENTERPRISE GOVERNANCE & SECURITY                         │
│   • Fail-Closed Multi-Tenancy (AsyncLocalStorage)   • 15-Min Rotating JWT Sessions │
│   • Authenticated Private Cloudinary Storage        • Tamper-Evident Audit Logs    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

# Feature Showcase 1: Smart Geofenced Attendance & Leave Management

### The Business Problem
Traditional biometric hardware costs ₹40,000–₹1,50,000 per office, breaks down frequently, causes entrance bottlenecks, and cannot verify field sales representatives, branch staff, or hybrid workers. Conversely, continuous mobile GPS tracking apps drain employee batteries, violate personal privacy, and trigger severe employee pushback.

### How MobiusEMS Solves It
MobiusEMS introduces **Zero-Hardware Browser Check-In**. Employees simply open the web application on their mobile or laptop browser and tap **"Check In"**.

#### Detailed Operational Walkthrough
1. **One-Tap Check-In**: The browser accesses device GPS coordinates via native HTML5 Geolocation API.
2. **Haversine Spherical Validation**: The server computes the distance between the employee and the registered office coordinates:
   $$d = 2R \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1-a}\right) \quad (R = 6,371,000\text{ m})$$
   If $d \le 300\text{ meters}$, check-in is instantly approved.
3. **GPS Anti-Spoofing Protection**: Mock-location software and developer emulators typically report artificial accuracy radius. The platform automatically inspects GPS accuracy. Any reading with uncertainty $> 200\text{m}$ is rejected (`LOCATION_ACCURACY_LOW`).
4. **Automated Late Arrival Flagging**:
   - Check-in $\le$ 11:30 AM IST $\implies$ **PRESENT**.
   - Check-in $>$ 11:30 AM IST $\implies$ Automatically flagged as **LATE**.
5. **Shift Duration & Half-Day Calculation**:
   - Upon checkout, the system calculates elapsed working time:
     $$\text{Worked Minutes} = \frac{\text{CheckOut Time} - \text{CheckIn Time}}{60,000}$$
   - If $\text{Worked Minutes} < 240\text{ minutes (4 hours)}$, daily status is automatically downgraded to **HALF_DAY**.
6. **Attendance Regularization Workflow**: If an employee was on client site or had network failure, they submit a Regularization Claim with supporting notes. Approvals require direct manager sign-off, which automatically updates the status and records an audit log.
7. **Integrated Leave Quota Management**:
   - Configurable quotas for Privilege Leave (PL), Casual Leave (CL), and Sick Leave (SL).
   - Real-time balance deductions, overlapping date validations, and live department calendar synchronization.

---

# Feature Showcase 2: Visual Task Kanban, Blocker Escalation & Velocity Tracking

### The Business Problem
Engineering and delivery teams log tasks in standalone tools like Jira or Asana, but managers rarely know when work is blocked until sprint reviews or weekly status meetings. Furthermore, rework cycles and cycle times are disconnected from performance appraisals.

### How MobiusEMS Solves It
A built-in **7-Stage Interactive Kanban Board** directly connects daily engineering output to weekly contribution scores and quarterly reviews.

#### Detailed Operational Walkthrough
1. **The 7-Stage State Machine**:
   - Tasks progress through strictly validated states:
     $$\text{NOT\_STARTED} \longrightarrow \text{IN\_PROGRESS} \longrightarrow \text{IN\_REVIEW} \longrightarrow \text{COMPLETED}$$
     Exceptions: Can transition to $\text{BLOCKED}$, $\text{REOPENED}$, or $\text{CANCELLED}$.
2. **Real-Time Blocker Escalation**:
   - Any team member can flag a task as blocked by specifying the category:
     - `EXTERNAL_DEPENDENCY` (e.g., waiting for client credentials or third-party API)
     - `DESIGN_ASSETS` (e.g., pending Figma mocks)
     - `INFRASTRUCTURE` (e.g., database staging server outage)
     - `REQUIREMENT_AMBIGUITY` (e.g., missing business logic spec)
   - Flagging a blocker instantly triggers an alert banner on Manager and Department Head dashboards.
   - **Fairness Protection**: If a blocker is tagged as external (`external: true`), the platform automatically exempts the employee from reliability scoring penalties.
3. **Cycle Time & Quality Rework Tracking**:
   - Measures elapsed wall-clock hours from ticket start to delivery.
   - Automatically increments the **Rework Counter** each time a ticket bounces from `IN_REVIEW` back to `REOPENED` or `IN_PROGRESS`. This objectively surfaces ambiguous requirements or training needs without relying on subjective finger-pointing.
4. **Append-Only Immutable Activity Audit**:
   - Every priority change, reassignment, state transition, and discussion comment is recorded with a permanent timestamp and actor ID.

---

# Feature Showcase 3: Local Zero-Retention Voice-to-Task Capture

### The Business Problem
Field staff, sales executives, and busy software engineers frequently skip logging tasks because typing descriptions and hours on mobile keyboards is tedious. However, sending internal company voice recordings to cloud APIs (like OpenAI or Google Cloud) risks leaking confidential client discussions and incurs steep per-minute fees.

### How MobiusEMS Solves It
MobiusEMS features **on-premise multilingual speech-to-task recognition** powered by local `faster-whisper` models running directly on your host infrastructure.

#### Detailed Operational Walkthrough
1. **One-Tap Voice Recording**: The user taps the microphone icon on desktop or mobile and speaks their update.
2. **11 Regional Indian Languages + English**: Full native transcription support for:
   - English, Hindi (हिन्दी), Bengali (বাংলা), Tamil (தமிழ்), Telugu (తెలుగు), Marathi (मराठी), Gujarati (ગુજરાતી), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), Punjabi (ਪੰਜਾਬੀ), and Urdu (اردو).
3. **Zero-Retention File Shredding**:
   - Audio is recorded in standard `audio/webm` format and transmitted over encrypted HTTPS.
   - The server writes the bytes to an ephemeral temporary file (`/tmp/audio_xyz.webm`), extracts text via local CPU/GPU inference, and **immediately shreds the raw audio file in a strict code `finally` block**.
   - No audio files are ever written to database storage, Cloudinary, or third-party servers.
4. **Intelligent NLP Parsing Engine**:
   - **Prospective Intent** (*"have to complete database index by Friday"*, *"कल तक पूरा करना है"*) $\implies$ Creates a new task in `TODO` status.
   - **Retrospective Intent** (*"finished client presentation in 3 hours"*, *"काम खत्म हो गया"*) $\implies$ Updates task to `IN_REVIEW` or `COMPLETED` and sets `actualHours = 3`.
   - **Spoken Duration Extraction**: Translates words like *"two and a half hours"* or *"दो घंटे"* into float numbers (`actualHours: 2.5`).
   - **Hinglish Compound Splitting**: Correctly decomposes complex sentences (*"Ayush ko frontend do aur Priya ko backend"*) into separate draft assignments.
5. **Human-in-the-Loop Safeguard**:
   - Transcriptions are never committed blindly. The user is presented with an **Editable Confirmation Card** displaying title, assignee, estimated hours, and priority for quick adjustment before saving.

---

# Feature Showcase 4: Capability Matrix, Skill Heatmaps & Timed Assessments

### The Business Problem
Companies rarely know their true internal technical capacity. When a new project starts, managers scramble to find who knows what technology, leading to single points of failure (SPOFs) and project delays.

### How MobiusEMS Solves It
A comprehensive **Skills Matrix and Assessment Engine** maps institutional capability and validates claimed proficiencies through verifiable evidence and timed quizzes.

#### Detailed Operational Walkthrough
1. **Centralized Competency Taxonomy**: A standardized catalog covering Technical (e.g., React, Python, PostgreSQL), Operational (e.g., Agile, DevOps), and Domain skills, rated on a 1-to-5 scale.
2. **Two-Tier Skill Verification**:
   - **Self-Reported**: Employees rate themselves (1–5) and submit proof links (GitHub repos, PR links, project deliverables, certifications).
   - **Manager / Lead Verification**: A designated verifier reviews evidence and clicks `Approve`. Only verified skills feed into promotion benchmarks and organizational heatmaps.
3. **Departmental Skill Heatmap**:
   - A visual color-coded grid mapping departments and teams against core competencies.
   - **Single-Point-of-Failure (SPOF) Detection**: Instantly alerts leadership when only one employee in the company holds a critical competency.
4. **Automated Timed Candidate Assessments**:
   - HR and leads create multiple-choice evaluations with randomized question banks and strict countdown timers.
   - Generates direct applicant assessment links (`APPLICANT` role).
   - Automated grading delivers instant pass/fail metrics, accelerating technical screening.

---

# Feature Showcase 5: Objective Performance Management & Immutable Snapshots

### The Business Problem
Traditional annual performance appraisals are broken. They rely on manager memory, suffer from severe recency bias (judging a whole year by the last 3 weeks), and encourage subjective favoritism.

### How MobiusEMS Solves It
MobiusEMS introduces **Deterministic Mathematical Scoring** grounded in verifiable project output, measurable KPIs, and structured 360 reviews.

#### Detailed Operational Walkthrough
1. **The Weighted Mathematical Formula**:
   $$\text{Final Score} = (\text{Goals Score} \times W_g) + (\text{KPI Performance} \times W_k) + (\text{Review Competencies} \times W_r)$$
   - $\mathbf{W_g, W_k, W_r}$: Configured organizational weights (totaling 1.0).
   - **Goals Achievement**: Percentage attainment of strategic objectives.
   - **KPI Performance**: Bounded achievement across quantifiable targets:
     $$\text{KPI Achievement} = \max\left(0, \min\left(200, \frac{\text{Actual Value}}{\text{Target Value}} \times 100\right)\right)$$
   - **Review Competencies**: Normalized score from structured multi-competency evaluation rubrics.
2. **Strict Performance Bands**:
   - $\ge \mathbf{90\%}$: **Exceptional**
   - $\mathbf{75\% - 89.9\%}$: **Strong Performer**
   - $\mathbf{60\% - 74.9\%}$: **Consistent Performer**
   - $<\mathbf{60\%}$: **Developing / Needs Support**
3. **Immutable Cryptographic Snapshots**:
   - Once HR closes a review cycle, raw scores, calculation weights, and reviewer comments are frozen into a cryptographic snapshot record.
   - Historical records cannot be altered retroactively, guaranteeing total compliance during compensation rounds or legal audits.
4. **Ethical AI Policy Lock**:
   - Large Language Models are strictly confined to drafting advisory narrative summaries for managers.
   - **The platform enforces an absolute architectural lock: AI is barred from modifying scores, setting salaries, or making promotion/termination decisions.**

---

# Feature Showcase 6: Continuous Contribution Intelligence

### The Business Problem
Employees shouldn't have to wait 12 months to know where they stand. Conversely, managers shouldn't have to chase employees every Friday for status emails.

### How MobiusEMS Solves It
The **Contribution Intelligence Engine** captures weekly delivery signals and calculates real-time contribution velocity.

#### Detailed Operational Walkthrough
1. **Structured Friday Check-Ins**:
   - Employees log completed deliverables, next week priorities, and active blockers in 3 minutes.
2. **Deliverable Velocity Over Desk Face-Time**:
   - Tracks actual output completion rates over rolling 30-day and 90-day windows.
   - Shifts organizational culture away from superficial hours spent sitting at desks to verified work shipped.
3. **Algorithmic Peer Contribution Percentiles**:
   - Ranks contribution fairly within peer cohorts by normalizing completed deliverables, commitment reliability, and rework frequency.
4. **The Evidence-Coverage Guardrail**:
   - The platform strictly enforces an operational rule: **Never confuse missing paperwork with poor delivery.**
   - If an employee misses updates, the system flags an **"Information Gap"** for manager follow-up rather than unfairly depressing their score.

---

# Feature Showcase 7: Commercial Sales Intelligence & 7-Tier GIS Mapping

### The Business Problem
Enterprises purchase expensive CRM software (Salesforce, HubSpot) that lives in isolation from the rest of the company. HR doesn't know sales rep capacity, attendance doesn't sync with field visits, and closed deals don't match realized accounting ledgers.

### How MobiusEMS Solves It
A built-in **Commercial Sales Engine with Native Geographic Information System (GIS)** connects field sales, territory capacity, and realized revenue directly to employee profiles.

#### Detailed Operational Walkthrough
1. **7-Tier Geographic Hierarchy (GIS)**:
   - Maps operational markets down to the local pincode:
     $$\text{Global} \longrightarrow \text{Country} \longrightarrow \text{State} \longrightarrow \text{District} \longrightarrow \text{City} \longrightarrow \text{Area} \longrightarrow \text{Pincode}$$
2. **Interactive Geospatial Density Maps**:
   - Visualizes lead concentration, active field reps, and revenue generation across states and districts.
3. **Territory Headcount Capacity Math**:
   - The system computes territory workload using deterministic math (`salesMath.ts`):
     $$\text{Required Reps} = \left\lceil \frac{\text{Lead Load}}{\text{Capacity per Rep}} \right\rceil, \quad \text{Headcount Gap} = \max(0, \text{Required} - \text{Active})$$
   - Prevents territory under-staffing and lead neglect.
4. **Lead Lifecycle & SLA Lost Revenue Tracking**:
   - Tracks leads through $\text{NEW} \to \text{CONTACTED} \to \text{QUALIFIED} \to \text{CONVERTED} \; / \; \text{LOST}$.
   - **Automated Lost Revenue Warning**: Calculates financial loss when leads sit past territory SLA response times without rep contact.
5. **Idempotent Realized Revenue Ledger**:
   - Moving an opportunity to $\text{Closed Won}$ automatically books an immutable transaction into `SalesRevenueTransaction` and increments Customer Lifetime Value ($\text{LTV}$).
   - **Duplicate-Proof**: System enforces idempotency locks. Repeated clicks or submissions can never create duplicate revenue records.
6. **5-Tier Flexible Compensation Engine**:
   - Supports Proportional payouts, Commission Slabs, Flat percentages, Target Gates (100% threshold before payout), and Hybrid base+bonus structures with accelerators and budget caps.

---

# Feature Showcase 8: Talent Acquisition, JD Library & Resume Screener

### The Business Problem
Recruiters spend days manually reading hundreds of PDF resumes, copying candidate data into spreadsheets, and re-entering the same details when someone is hired.

### How MobiusEMS Solves It
An integrated **Applicant Tracking System (ATS) with Automated Resume Screening** that converts hired candidates into active employee profiles with one click.

#### Detailed Operational Walkthrough
1. **Standardized JD Library**:
   - Maintain reusable job requisition templates with documented skill profiles, experience requirements, and salary bands.
2. **Visual Hiring Pipeline**:
   - Drag-and-drop applicant tracking across stages:
     $$\text{Sourced} \longrightarrow \text{Screened} \longrightarrow \text{Interviewing} \longrightarrow \text{Offer Extended} \longrightarrow \text{Hired}$$
3. **Automated PDF/DOCX Resume Screening**:
   - Recruiter uploads applicant resumes.
   - Text parser extracts claimed skills, education, and years of experience.
   - Matches candidate profile against the JD requirements and computes an **Advisory Qualification Score**.
4. **Human Recruiter Gate**:
   - AI is strictly advisory; it never auto-rejects applicants. Human recruiters maintain complete review authority.
5. **1-Click Employee Onboarding**:
   - When an applicant is marked `Hired`, clicking "Convert to Employee" provisions their Employee 360 profile, generates invitation credentials, and initiates first-login password setup.

---

# Feature Showcase 9: People Operations, Culture & Gamification

### The Business Problem
Dispersed teams struggle with disengagement, infrequent 1-on-1s, and forgotten peer appreciation, resulting in quiet quitting and high turnover.

### How MobiusEMS Solves It
Built-in **People Growth, Peer Recognition, and Engagement Workspaces**.

#### Detailed Operational Walkthrough
1. **Structured 1-on-1 Agendas**:
   - Collaborative meeting workspace with mutual talking points, follow-up action items with due dates, and **Private Manager Coaching Notes**.
2. **Internal Training Catalog & Certifications**:
   - Catalog of internal and external courses. Completed courses automatically update the employee's verified skill matrix profile.
3. **Core-Value Peer Recognitions**:
   - Public company-wide recognition board where team members celebrate colleagues demonstrating core values (Integrity, Innovation, Customer Focus).
4. **Private Daily To-Dos**:
   - Distraction-free personal task manager for individual employees.
   - **Privacy Lock**: Personal to-dos are strictly private and completely excluded from manager dashboards or performance reviews.
5. **Gamification & Badges**:
   - Employees earn points and achievement badges for on-time check-ins, sprint velocity, completed courses, and peer recognition.

---

# Feature Showcase 10: Enterprise Governance, Security & Multi-Tenancy

### The Business Problem
Enterprise SaaS platforms often suffer from data leaks between organizations, insecure file storage, and lack of accountability when records are modified.

### How MobiusEMS Solves It
Engineered from day one with **military-grade data isolation, stateless authentication, and tamper-evident audit trails**.

#### Detailed Operational Walkthrough
1. **Fail-Closed Multi-Tenancy**:
   - Enforced at the database driver layer using Node.js `AsyncLocalStorage`.
   - Every read, write, and aggregation automatically injects the authenticated `tenantId`.
   - Cross-tenant data leakage (IDOR) is structurally impossible.
2. **Hardened Session Lifecycle**:
   - Short-lived stateless JWT access tokens (15-minute expiry).
   - Rotating long-lived refresh tokens stored in secure `HttpOnly`, `SameSite=Strict` cookies.
   - **Theft Detection**: Token reuse triggers immediate invalidation of the entire session family.
3. **Authenticated Private Document Storage**:
   - Identity documents, employment contracts, and resumes are stored in private Cloudinary cloud storage with randomized keys.
   - Direct public access is disabled; downloads require authenticated API authorization and generate time-limited (15-min) signed URLs.
4. **Tamper-Evident Audit Trail**:
   - Records every sensitive mutation (role changes, salary edits, check-in overrides, document downloads) with actor ID, timestamp, IP address, user-agent, and full JSON before/after state diffs.
   - Audit logs cannot be updated or deleted via API.
5. **Compliance Alignment**:
   - Architected to align with the Indian Digital Personal Data Protection (DPDP) Act and European GDPR standards.

---

# Plan Tiers & Licensing Summary

| Dimension | STARTER | STANDARD | PROFESSIONAL | ENTERPRISE |
| :--- | :---: | :---: | :---: | :---: |
| **Max Employees** | Up to 15 | Up to 50 | Up to 150 | **Unlimited** |
| **Cloud Storage** | 2 GB | 10 GB | 50 GB | **Dedicated / Unlimited** |
| **Geofenced Attendance** | ✅ | ✅ | ✅ | ✅ |
| **Work Kanban & Tasks** | ✅ | ✅ | ✅ | ✅ |
| **Objective Performance**| Goals Only | Full Reviews | Full Reviews | Full Reviews + Snapshots |
| **AI Policy Assistant** | ❌ | ✅ | ✅ | ✅ |
| **Skills & Assessments** | ❌ | ✅ | ✅ | ✅ |
| **Commercial Sales & GIS**| ❌ | ❌ | ✅ | ✅ |
| **Email Automation (Brevo)**| ❌ | ❌ | ✅ | ✅ |
| **Custom Roles & RBAC** | ❌ | ❌ | ✅ | ✅ |
| **Dedicated Support** | Email | Email & Chat | Priority Slack | 24/7 SLA & Tech Lead |

---

# Connect with Us

Ready to replace the "5-Tool Trap" with a single, unified workforce operating system?

* 🌐 **Live Platform**: `https://employee.whalexy.com`
* ✉️ **Enterprise Inquiries**: `arbusiness1909@gmail.com` | `contact@mobiusbloom.com`
* 🏢 **Headquarters**: Mobius Bloom Venture Pvt Ltd, India
* 📞 **Schedule a Demo**: Contact our sales engineering team for a customized enterprise walkthrough.
