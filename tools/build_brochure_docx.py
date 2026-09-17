import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

WORKSPACE = r"c:\Users\rainb\Desktop\employee-management"
DOCX_PATH = os.path.join(WORKSPACE, "docs", "MobiusEMS_Product_Brochure.docx")
ROOT_DOCX_PATH = os.path.join(WORKSPACE, "MobiusEMS_Product_Brochure.docx")

def set_cell_background(cell, fill_hex):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shd)

def set_cell_padding(cell, top=120, bottom=120, left=180, right=180):
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    cell._tc.get_or_add_tcPr().append(tcMar)

def add_header_footer(doc):
    for section in doc.sections:
        section.top_margin = Inches(0.7)
        section.bottom_margin = Inches(0.7)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)
        
        # Header
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("MobiusEMS | Official Enterprise Product Brochure • employee.whalexy.com")
        hrun.font.name = "Segoe UI"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(100, 116, 139)

        # Footer
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.LEFT
        frun = fp.add_run("Mobius Bloom Venture Pvt Ltd • Raipur, Chhattisgarh • Phone: +91 9171115206")
        frun.font.name = "Segoe UI"
        frun.font.size = Pt(8)
        frun.font.color.rgb = RGBColor(148, 163, 184)

def format_run(run, font_name="Segoe UI", size_pt=9.5, color_rgb=RGBColor(30, 41, 59), bold=False, italic=False):
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run.font.color.rgb = color_rgb
    run.bold = bold
    run.italic = italic

def add_section_banner(doc, title_text):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tbl.columns[0].width = Inches(7.0)
    
    cell = tbl.cell(0, 0)
    set_cell_background(cell, "0F172A")
    set_cell_padding(cell, top=140, bottom=140, left=200, right=200)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(title_text.upper())
    format_run(run, size_pt=11, color_rgb=RGBColor(255, 255, 255), bold=True)
    
    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_before = Pt(0)
    spacer.paragraph_format.space_after = Pt(4)

def add_h2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    format_run(run, size_pt=11.5, color_rgb=RGBColor(30, 58, 138), bold=True)

def add_h3(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    format_run(run, size_pt=10, color_rgb=RGBColor(15, 23, 42), bold=True)

def add_p(doc, text, italic=False):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(text)
    format_run(run, size_pt=9.5, color_rgb=RGBColor(51, 65, 85), italic=italic)
    return p

def add_bullet(doc, bold_prefix, text):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r1 = p.add_run(bold_prefix + ": ")
        format_run(r1, size_pt=9.5, color_rgb=RGBColor(15, 23, 42), bold=True)
    r2 = p.add_run(text)
    format_run(r2, size_pt=9.5, color_rgb=RGBColor(51, 65, 85))

def add_callout(doc, title, text):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.columns[0].width = Inches(7.0)
    cell = tbl.cell(0, 0)
    set_cell_background(cell, "EFF6FF")
    set_cell_padding(cell, top=140, bottom=140, left=200, right=200)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    r1 = p.add_run(title + "\n")
    format_run(r1, size_pt=10, color_rgb=RGBColor(29, 78, 216), bold=True)
    r2 = p.add_run(text)
    format_run(r2, size_pt=9, color_rgb=RGBColor(30, 41, 59))
    
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def build_docx():
    doc = Document()
    add_header_footer(doc)

    # Document Header / Hero
    p_hero = doc.add_paragraph()
    p_hero.paragraph_format.space_before = Pt(0)
    p_hero.paragraph_format.space_after = Pt(2)
    r_badge = p_hero.add_run("WHALEXY ENTERPRISE SOLUTIONS\n")
    format_run(r_badge, size_pt=10, color_rgb=RGBColor(37, 99, 235), bold=True)

    r_title = p_hero.add_run("MobiusEMS: Official Product Brochure\n")
    format_run(r_title, size_pt=20, color_rgb=RGBColor(15, 23, 42), bold=True)

    r_sub = p_hero.add_run("The Smarter Way to Manage People, Work & Growth\n")
    format_run(r_sub, size_pt=13, color_rgb=RGBColor(30, 58, 138), bold=True)

    r_meta = p_hero.add_run("Mobius Bloom Venture Pvt Ltd  |  Live Deployment: https://employee.whalexy.com  |  Release: v2.0-PROD")
    format_run(r_meta, size_pt=8.5, color_rgb=RGBColor(100, 116, 139), italic=True)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 1. Executive Overview & Core Purpose
    add_section_banner(doc, "1. Why Growing Companies Need MobiusEMS")
    add_p(doc, "Running a growing business is hard when your everyday software tools don't talk to each other. Most teams end up trapped in a daily juggling act:")
    add_bullet(doc, "The Biometric Headache", "Fingerprint machines fail, create long morning lines at the door, and are completely useless for field staff or remote days.")
    add_bullet(doc, "Work Chaos on Chat", "Important tasks get lost in WhatsApp chats and messy spreadsheets. Nobody knows who is working on what until a deadline is missed.")
    add_bullet(doc, "Biased Year-End Appraisals", "Annual performance reviews turn into popularity contests and memory games because managers don't have records of what was actually delivered.")
    add_bullet(doc, "Disconnected Sales Teams", "Sales reps log leads in expensive standalone CRMs that have no clue about employee availability, leave days, or verified accounting.")
    add_bullet(doc, "Scattered Files & Resumes", "Candidate resumes sit buried in HR inboxes, training records live in separate Excel files, and there is no single source of truth.")

    add_callout(doc, "What is MobiusEMS?", "MobiusEMS is an all-in-one workforce operating system built by Whalexy. It unifies your attendance, project execution, talent recruitment, skill development, objective performance appraisals, and commercial sales into one clean, role-based platform.")

    add_h3(doc, "Built Around Three Core Values")
    add_bullet(doc, "Real Data, Zero Office Politics", "Performance, KPI achievement, and attendance are tracked through transparent, objective calculations. AI is here to assist, never to make hiring, firing, or promotion decisions.")
    add_bullet(doc, "Respectful Accountability, Not Surveillance", "No secret screen recording, no creepy keystroke loggers, and no 24/7 GPS tracking. We verify physical presence when your shift starts, and track real deliverables that get finished.")
    add_bullet(doc, "Total Voice Privacy", "When you speak tasks into MobiusEMS, audio is transcribed on your local server and immediately deleted from memory. Nothing is ever sent to third-party cloud speech providers or saved on disk.")

    # 2. People & Organization Management
    add_section_banner(doc, "2. People & Organization Management")
    add_h3(doc, "Complete Employee 360 Profiles")
    add_bullet(doc, "Single Source of Truth", "Keep every employee's personal details, government IDs (PAN, Aadhaar, Tax IDs), bank details, emergency contacts, active projects, and verified skills in one secure place.")
    add_bullet(doc, "Living Career Timeline", "A permanent chronological history of every promotion, title change, salary adjustment, department transfer, and award earned throughout the employee's journey.")
    add_bullet(doc, "Profile Health Score", "A clear visual meter showing profile completeness, encouraging team members during weekly check-ins to keep their details up to date.")

    add_h3(doc, "Interactive Company Hierarchy & Visual Org Chart")
    add_bullet(doc, "Configurable Departments & Teams", "Build custom departments, sub-teams, and designations that match how your business actually runs.")
    add_bullet(doc, "Visual Org Chart", "Click through your company reporting hierarchy from senior executives down to individual team members. Easily spot open positions, view reporting lines, and balance team sizes.")

    add_h3(doc, "Smooth Onboarding & First-Day Security")
    add_bullet(doc, "Quick HR Invites", "HR creates a profile in minutes and sends the new hire an invitation link with temporary login details.")
    add_bullet(doc, "Mandatory Password Reset on First Login", "Keeps company data safe by requiring new hires to set a private, secure password before accessing anything.")
    add_bullet(doc, "Resumable Onboarding Steps", "New employees can fill in their background, upload ID proofs, and add emergency contacts at their own pace without losing entered data.")

    # 3. Smart Geofenced Attendance & Leave Tracking
    add_section_banner(doc, "3. Smart Geofenced Attendance & Leave Tracking")
    add_h3(doc, "Your Phone is Your Punch Card (No Hardware Required)")
    add_bullet(doc, "Zero Machine Costs", "No biometric machines to buy, install, wire, or fix when they break. Employees check in using their phone or laptop browser.")
    add_bullet(doc, "Smart 300-Meter Office Geofence", "The system checks the employee's location when they hit Check-In, confirming they are within 300 meters of the registered office location.")
    add_bullet(doc, "Anti-Spoofing Filter", "Automatically blocks fake GPS apps and mock location emulators by discarding low-accuracy signals (above 200m).")

    add_h3(doc, "Automatic Shift Rules That Save HR Hours")
    add_bullet(doc, "11:30 AM Late Cutoff", "Anyone punching in after 11:30 AM is automatically marked Late, eliminating manual morning log checks.")
    add_bullet(doc, "4-Hour Minimum Half-Day Rule", "If an employee works less than 240 minutes (4 hours) between check-in and checkout, the day automatically logs as a Half-Day.")
    add_bullet(doc, "Clear Daily Statuses", "Every day is neatly tagged as Present, Late, Half-Day, On Leave, or Absent.")

    add_h3(doc, "Self-Service Regularization & Leave Management")
    add_bullet(doc, "Easy Regularization", "Traveling for a client meeting or stuck in bad transit? Employees submit a quick note explaining the delay. Once their manager clicks approve, the daily record updates automatically.")
    add_bullet(doc, "Custom Leave Quotas", "Manage yearly allowances for Casual Leave, Sick Leave, Paid Leave, Unpaid Leave, and Work-From-Home days.")
    add_bullet(doc, "Overlap Protection", "Prevents duplicate or overlapping leave applications automatically.")
    add_bullet(doc, "Team Leave Calendar", "Managers and team members can see upcoming approved leaves at a glance, making sprint planning straightforward.")

    # 4. Project Delivery, Kanban & Daily Work
    add_section_banner(doc, "4. Project Delivery, Kanban & Daily Work")
    add_h3(doc, "Visual 7-Stage Kanban Boards")
    add_bullet(doc, "Clear Stages of Work", "Tasks flow naturally through validated stages: Not Started → In Progress → In Review → Completed (with special handling for Blocked, Reopened, or Cancelled tasks).")
    add_bullet(doc, "Prevents Cheating the Workflow", "Tasks cannot jump straight from Not Started to Completed without going through work and review stages.")

    add_h3(doc, "Instant Roadblock Alerts (Blocker Escalation)")
    add_bullet(doc, "Flag What's Stuck Immediately", "When a team member hits a wall, they flag the task as Blocked and select the exact reason (Waiting on External Dependency, Missing Assets, Server Outage, Unclear Requirements).")
    add_bullet(doc, "Protects Employees from Unfair Blame", "If a project stalls because a client hasn't sent credentials, the task is marked as an external blocker so the team member's delivery score isn't penalized.")

    add_h3(doc, "Cycle Time & Quality Rework Tracking")
    add_bullet(doc, "Delivery Speed", "Measures how many hours or days it takes from starting a task to getting it approved.")
    add_bullet(doc, "Rework Counter", "Automatically tracks whenever a task fails review and gets sent back to In Progress, helping teams spot confusing requirements early.")
    add_bullet(doc, "Company Task Tracker Grid", "Filter and sort tasks by owner, priority (Low, Medium, High, Critical), status, and due date with a full activity audit log.")

    # 5. Local Zero-Retention Voice-to-Task AI
    add_section_banner(doc, "5. Local Zero-Retention Voice-to-Task AI")
    add_h3(doc, "Speak Naturally in 11 Indian Languages + English")
    add_p(doc, "Team members in the field or in the office can speak in English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, or Urdu.")

    add_h3(doc, "Turn Speech into Structured Tasks in Seconds")
    add_bullet(doc, "Understands Intent", "Say 'Need to create the quarterly presentation by tomorrow afternoon' → creates a new task in To-Do. Say 'Spent three hours fixing the invoice calculation bug' → moves the task to In Review and logs 3 hours of actual work.")
    add_bullet(doc, "Everyday Hinglish & Hindi", "Intelligently handles mixed language commands and splits compound instructions (e.g. assigning one part to Priya and another to Rahul).")

    add_h3(doc, "100% Private — Audio Deleted Immediately")
    add_bullet(doc, "Zero Cloud Exposure", "Audio processing runs locally on your host server. The voice recording is processed in memory and shredded instantly. Nothing is ever sent to third-party cloud APIs or saved on disk.")
    add_bullet(doc, "Editable Preview Card", "Before anything is saved, an editable confirmation card pops up so the user can verify the title, assignee, and hours with a single click.")

    # 6. Talent Acquisition & AI Resume Screener
    add_section_banner(doc, "6. Talent Acquisition & AI Resume Screener")
    add_h3(doc, "Hiring Pipeline from Requisition to Onboarding")
    add_bullet(doc, "Standardized Job Posts", "Maintain approved job openings with required experience, key skills, and expected responsibilities.")
    add_bullet(doc, "Visual Applicant Pipeline", "Track candidates from first contact to hire: Sourced → Screened → Interviewing → Offer Extended → Hired / Rejected.")
    add_bullet(doc, "Instant Resume Parsing", "Drop candidate resumes in PDF or Word (.docx) format directly into the screener.")
    add_bullet(doc, "Automated Match Scoring", "The system extracts skills, education, and years of experience, comparing them against your job requirements to give an advisory match percentage.")
    add_bullet(doc, "Humans Always Make the Call", "The screening score is purely a time-saving guide for interviewers. The system never rejects candidates on its own.")
    add_bullet(doc, "1-Click Onboarding", "Once you mark a candidate as Hired, click 'Convert to Employee'. Their contact details, resume, and skills automatically populate a new Employee 360 profile, ready for onboarding.")

    # 7. AI Assessment Maker & Secure Applicant Testing
    add_section_banner(doc, "7. AI Assessment Maker & Secure Applicant Testing")
    add_h3(doc, "Instant AI Test Generation from Any Job Description (JD)")
    add_bullet(doc, "Generate Tests in Seconds with AI", "Super Admins and hiring managers can enter a role title or paste an entire Job Description, and MobiusEMS AI instantly generates a complete, tailored assessment with multiple-choice questions, detailed answer keys, and technical explanations.")
    add_bullet(doc, "Granular Exam Controls", "Customize difficulty (Beginner, Intermediate, Advanced, Expert), question count, strict time limits (e.g., 30 or 60 minutes), and custom passing percentages (e.g., 70%).")
    add_bullet(doc, "Custom Question Builder", "Add custom domain scenarios, coding questions, or company-specific situational prompts alongside AI-generated questions.")

    add_h3(doc, "Secure Applicant Portal with Auto-Generated Credentials")
    add_bullet(doc, "Dedicated Testing Credentials for Candidates", "When evaluating new applicants, the system provisions an external candidate profile with dedicated, temporary login credentials (email & password).")
    add_bullet(doc, "Restricted Applicant Environment", "When an applicant logs in, they are locked exclusively into the secure Assessment environment and cannot view any internal company data.")
    add_bullet(doc, "Timed Test Runner with Live Auto-Grading", "Candidates take the test against a live countdown timer. Upon submission, the engine instantly grades their answers, calculates their final percentage score, and issues a detailed scorecard (Passed vs. Needs Improvement).")

    add_h3(doc, "Internal Employee Upskilling & Benchmark Testing")
    add_bullet(doc, "Targeted Employee Testing", "Assign specific assessments to individual employees or entire departments to benchmark technical proficiency, evaluate training outcomes, or qualify staff for promotions.")

    # 8. Onboarding Skill Justification & AI Evidence Ranking
    add_section_banner(doc, "8. Onboarding Skill Justification & AI Evidence Ranking")
    add_h3(doc, "Mandatory Onboarding Domain Skill Assessment")
    add_bullet(doc, "Role-Specific Skill Catalog", "When an employee is onboarded, their assigned designation triggers a mandatory, domain-specific skill catalog configured by the Super Admin.")
    add_bullet(doc, "1–10 Skill Rating with Mandatory Written Justification", "For every skill in their domain, the employee must rate their proficiency from 1 to 10 AND provide a detailed, written implementation justification note (explaining Situation, Action, Result, and practical evidence).")
    add_bullet(doc, "Permanent Submission Lock", "Once submitted during onboarding, the self-ratings and justification notes are permanently locked and cannot be edited.")

    add_h3(doc, "Continuous AI Work-Evidence Monitor")
    add_bullet(doc, "Automated Output Tracking", "As the employee works day-to-day, an internal AI monitor continuously compares their claimed 1–10 ratings against their actual completed tasks, on-time delivery rates, and manager quality review scores.")
    add_bullet(doc, "Real-Time Justification Status", "Every skill rating is automatically categorized as Justified (work corroborates score), In Progress (actively building velocity), or Needs Evidence (output does not yet substantiate score).")

    add_h3(doc, "Super Admin Justification Leaderboard & Ranking")
    add_bullet(doc, "Transparency for Leadership", "Super Admins and leadership have a dedicated dashboard ranking employees by their Evidence Confidence Score (%) and rating justification ratio (e.g., 8 of 10 skills justified).")
    add_bullet(doc, "Eliminates Resume & Rating Inflation", "Ensures hiring and appraisal decisions are backed by measurable output, highlighting who truly delivers at the level they claimed.")

    # 9. Skills Matrix, Heatmaps & Capability Intelligence
    add_section_banner(doc, "9. Skills Matrix, Heatmaps & Capability Intelligence")
    add_h3(doc, "Skills Inventory & Competency Catalog")
    add_bullet(doc, "Standard Skill Catalog", "Track technical, domain, and operational skills across your team with 1 to 5 star proficiency levels.")
    add_bullet(doc, "Two-Step Verification", "Employees rate their skills and link real evidence (GitHub repositories, portfolio links, completed certifications). Team leads review the evidence before ratings are verified.")

    add_h3(doc, "Team Skill Heatmaps & Knowledge Gap Alerts")
    add_bullet(doc, "See Team Strengths at a Glance", "Color-coded heatmaps show exactly where your team excels and where skill gaps exist.")
    add_bullet(doc, "Single Point of Failure (SPOF) Detection", "Instantly alerts managers when only one person in the company knows a critical skill, so you can cross-train others before it becomes a bottleneck.")

    # 10. Fair, Data-Backed Performance Reviews
    add_section_banner(doc, "10. Fair, Data-Backed Performance Reviews")
    add_h3(doc, "Strategic Goals & Measurable KPIs")
    add_bullet(doc, "Cascading Goals", "Connect high-level company milestones down to departments and individual contributors.")
    add_bullet(doc, "Clear Numbers, Not Vague Feedback", "KPIs track actual numbers against target benchmarks, bounded between 0% and 200% achievement.")

    add_h3(doc, "Transparent Mathematical Scoring")
    add_p(doc, "Your team's performance rating is calculated objectively:")
    add_callout(doc, "Objective Formula", "Overall Rating = (Goal Achievement × Weight) + (KPI Results × Weight) + (360 Peer Reviews × Weight)\n\nPerformance Tiers:\n• 90%+ : Exceptional Performer\n• 75% – 89.9% : Strong Performer\n• 60% – 74.9% : Consistent Performer\n• Below 60% : Developing / Support Needed")

    add_bullet(doc, "360-Degree Review Rubrics", "Evaluates feedback across managers, peers, and self-reviews using structured competency rubrics.")
    add_bullet(doc, "Immutable Review Records", "Once an appraisal cycle closes, all scores, reviews, and weighting calculations are permanently locked. They cannot be edited after the fact.")

    # 11. Workload Balancing & Smart Staffing
    add_section_banner(doc, "11. Workload Balancing & Smart Staffing")
    add_h3(doc, "Workload & Burnout Radar")
    add_bullet(doc, "Real-Time Capacity Visibility", "See every team member's active tasks, estimated hours remaining, urgent deadlines, and overdue work.")
    add_bullet(doc, "Status Tags", "Automatically highlights team members who are Overloaded, on High Workload, or Balanced, helping managers reallocate tickets before burnout happens.")

    add_h3(doc, "Training Catalog & Skill Growth")
    add_bullet(doc, "Course Catalog", "Maintain a library of internal training modules and external courses.")
    add_bullet(doc, "Targeted Assignments", "Managers assign training directly to help employees close identified skill gaps.")
    add_bullet(doc, "Smart Project Staffing", "Need to staff a new project? MobiusEMS suggests the best team members by weighing verified skill match (70%), current workload availability (15%), and past delivery performance (15%).")

    # 12. Weekly Check-Ins & Contribution Velocity
    add_section_banner(doc, "12. Weekly Check-Ins & Contribution Velocity")
    add_h3(doc, "The 3-Minute Friday Check-In Routine")
    add_bullet(doc, "Simple Weekly Routine", "Every Friday afternoon, employees log three simple things: What they completed this week, What they plan to tackle next week, and Any blockers or help needed.")
    add_bullet(doc, "Measured Deliverable Velocity", "Tracks real deliverable completion rates over rolling 30-day and 90-day periods.")
    add_bullet(doc, "Fair Peer Comparisons", "Compares output volume, on-time reliability, and rework frequency across peers in similar roles.")
    add_bullet(doc, "The Missing Information Guardrail", "If an employee misses a weekly check-in because they were out sick or on leave, the system flags an 'Information Gap' instead of unfairly lowering their performance score.")

    # 13. Commercial Sales CRM & 7-Tier GIS
    add_section_banner(doc, "13. Commercial Sales CRM & 7-Tier GIS")
    add_h3(doc, "7-Tier Geographic Territory Mapping")
    add_p(doc, "Map sales leads, customers, and field reps across seven levels: Global → Country → State → District → City → Area → Pincode.")

    add_h3(doc, "Commercial Features Built for Real Operations")
    add_bullet(doc, "Interactive Regional Maps", "Explore visual maps showing customer density, active sales reps, lead volumes, and revenue across states and districts.")
    add_bullet(doc, "Territory Capacity Planning", "Compares incoming lead volume with rep capacity (Required Reps = Lead Volume / Capacity per Rep) and alerts managers before leads go cold.")
    add_bullet(doc, "Lead Management & SLA Warnings", "Guide prospects from New to Converted/Lost, with alerts calculating revenue at risk when leads languish.")
    add_bullet(doc, "Deduplicated Won Revenue Ledger", "Moving a deal to Closed Won automatically logs an entry into the realized revenue ledger with zero double-counting.")
    add_bullet(doc, "Quotas & Compensation Simulation", "Reps digitally sign off on assigned targets. Model commission payouts at 50%, 80%, 100%, and 150% quota achievement before rollout.")
    add_bullet(doc, "Channel Partner Network", "Manage authorized distributors, dealers, and VARs with territory assignments and partner revenue tracking.")

    # 14. Workplace Experience & Culture
    add_section_banner(doc, "14. Everyday Workplace Experience & Culture")
    add_bullet(doc, "Data-Backed Recognition Badges", "Managers award verified achievement badges (Top Performer, Quality Champion, Skill Master, Fast Learner, On-Time Delivery, Customer Champion, Mentor) backed by specific project milestones.")
    add_bullet(doc, "Private Daily To-Do Lists", "Built-in daily checklist for employees to organize their morning priorities. Strictly private to the employee — never shown to managers or reviewers.")
    add_bullet(doc, "Work Streaks & Engagement Header", "Employees see their daily streak, completed task count, and progress bar at the top of their workspace, celebrating consistent daily effort.")

    # 15. AI Workspace & Ethical Boundaries
    add_section_banner(doc, "15. AI Workspace & Ethical Boundaries")
    add_bullet(doc, "Floating Policy AI Assistant", "An unobtrusive assistant in the corner of your screen that answers handbook and leave policy questions instantly, escalating tricky queries to HR.")
    add_bullet(doc, "Pre-Review AI Summaries", "Compiles an employee's completed deliverables, logged hours, and peer feedback into a clean draft summary before review meetings.")
    add_bullet(doc, "Strict Ethical Guardrail", "AI is strictly advisory — all hiring, firing, salary, and promotion decisions remain 100% human-led.")
    add_bullet(doc, "Mood Break Wellbeing Panel", "A built-in wellbeing panel offering quick breathing exercises and mental break activities during busy workdays.")

    # 16. Email Automation (Brevo Integration)
    add_section_banner(doc, "16. Email Automation (Brevo Integration)")
    add_bullet(doc, "Vendor Introduction Sequences", "Set up multi-step introduction emails for approved vendor contacts with custom waiting periods between messages.")
    add_bullet(doc, "Automatic Stop on Reply", "The sequence automatically halts the moment a vendor responds or unsubscribes.")
    add_bullet(doc, "Excel Vendor Contact Import", "Upload your vendor list in Excel (.xlsx), map columns (Name, Email, Company, Source), verify consent, and preview before importing.")

    # 17. Security, Governance & Audit Trails
    add_section_banner(doc, "17. Security, Governance & Audit Trails")
    add_bullet(doc, "Permanent Audit Trail", "Every role modification, check-in override, salary update, and system setting change is permanently logged with user ID, timestamp, IP address, and before-and-after values.")
    add_bullet(doc, "22-Section Role-Based Access Control", "Granular permissions for Super Admins, HR Admins, Department Heads, Team Managers, Employees, and Job Applicants.")
    add_bullet(doc, "Secure Private Document Storage", "Identity proofs, employment contracts, and resumes are stored securely with encrypted keys and temporary expiring download links.")
    add_bullet(doc, "Complete Organization Data Isolation", "Every company on MobiusEMS runs in complete digital isolation with zero cross-tenant data leakage.")

    # 18. Plan Options & Pricing Tiers Table
    add_section_banner(doc, "18. Plan Options & Pricing Tiers")
    
    plans_data = [
        ["Feature Dimension", "STARTER", "STANDARD", "PROFESSIONAL", "ENTERPRISE"],
        ["Team Size", "Up to 15", "Up to 50", "Up to 150", "Unlimited"],
        ["Document Storage", "2 GB", "10 GB", "50 GB", "Unlimited"],
        ["Geofenced Attendance", "Included", "Included", "Included", "Included"],
        ["Visual Kanban & Projects", "Included", "Included", "Included", "Included"],
        ["Local Voice-to-Task AI", "Included", "Included", "Included", "Included"],
        ["AI Assessment Maker & Tests", "—", "Included", "Included", "Included"],
        ["Onboarding AI Skill Ranking", "—", "Included", "Included", "Included"],
        ["Performance Reviews", "Basic Goals", "Full Reviews", "Full Reviews", "Full Reviews + History"],
        ["Skills Matrix & Heatmaps", "—", "Included", "Included", "Included"],
        ["Company Policy AI", "—", "Included", "Included", "Included"],
        ["Sales CRM & 7-Tier GIS", "—", "—", "Included", "Included"],
        ["Vendor Email Sequences", "—", "—", "Included", "Included"],
        ["Custom Access Roles", "—", "—", "Included", "Included"],
        ["Support SLA", "Standard Email", "Email & Chat", "Priority Assistance", "Dedicated 24/7 Team"]
    ]

    tbl_plan = doc.add_table(rows=len(plans_data), cols=5)
    tbl_plan.alignment = WD_TABLE_ALIGNMENT.CENTER
    col_widths = [Inches(2.2), Inches(1.2), Inches(1.2), Inches(1.2), Inches(1.2)]

    for r_idx, row in enumerate(plans_data):
        for c_idx, val in enumerate(row):
            cell = tbl_plan.cell(r_idx, c_idx)
            cell.width = col_widths[c_idx]
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run(val)
            if r_idx == 0:
                set_cell_background(cell, "0F172A")
                set_cell_padding(cell, top=100, bottom=100, left=120, right=120)
                format_run(run, size_pt=8.5, color_rgb=RGBColor(255, 255, 255), bold=True)
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx == 0 else WD_ALIGN_PARAGRAPH.CENTER
            else:
                bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
                set_cell_background(cell, bg)
                set_cell_padding(cell, top=80, bottom=80, left=120, right=120)
                is_bold = c_idx == 0 or val in ["Included", "Unlimited", "Dedicated 24/7 Team"]
                color = RGBColor(15, 23, 42) if is_bold else RGBColor(71, 85, 105)
                format_run(run, size_pt=8, color_rgb=color, bold=is_bold)
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx == 0 else WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 19. The Old Way vs The MobiusEMS Way Table
    add_section_banner(doc, "19. The Old Way vs The MobiusEMS Way")
    
    comp_data = [
        ["Workplace Function", "The Traditional Way", "The MobiusEMS Way"],
        ["Attendance Punching", "Expensive fingerprint scanners, long morning lines, and broken devices.", "Mobile browser check-in with a 300-meter GPS fence. Zero hardware."],
        ["Creating Daily Tasks", "Typing forms on a laptop or sending unstructured messages on WhatsApp.", "Speak naturally in 11 Indian languages. Instant task setup with zero audio saved."],
        ["Managing Work", "Scattered Excel sheets, missed deadlines, and unflagged roadblocks.", "7-stage visual Kanban board with instant blocker alerts that protect team scores."],
        ["Evaluating Skills", "Self-claimed resume bullet points with zero verification.", "Mandatory 1–10 skill justification at onboarding with continuous AI work-evidence tracking & admin ranking."],
        ["Candidate Testing", "Sending generic Google Forms or scheduling endless initial screening calls.", "AI Assessment Maker generates tailored tests from JDs with auto-generated candidate credentials."],
        ["Performance Reviews", "Once-a-year popularity contests based on memory and recency bias.", "Continuous reviews combining goals, KPIs, and peer feedback in transparent math."],
        ["Hiring & Screening", "Sifting through hundreds of resumes by hand in messy email inboxes.", "Visual applicant pipeline with AI resume screening and 1-click employee onboarding."],
        ["Sales Operations", "Costly standalone CRMs disconnected from team leave and company ledgers.", "Integrated 7-tier GIS, lead SLA warnings, rep capacity math, and won revenue ledgers."]
    ]

    tbl_comp = doc.add_table(rows=len(comp_data), cols=3)
    tbl_comp.alignment = WD_TABLE_ALIGNMENT.CENTER
    comp_widths = [Inches(1.8), Inches(2.6), Inches(2.6)]

    for r_idx, row in enumerate(comp_data):
        for c_idx, val in enumerate(row):
            cell = tbl_comp.cell(r_idx, c_idx)
            cell.width = comp_widths[c_idx]
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(3)
            p.paragraph_format.space_after = Pt(3)
            run = p.add_run(val)
            if r_idx == 0:
                set_cell_background(cell, "1E3A8A")
                set_cell_padding(cell, top=120, bottom=120, left=140, right=140)
                format_run(run, size_pt=9, color_rgb=RGBColor(255, 255, 255), bold=True)
            else:
                bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
                set_cell_background(cell, bg)
                set_cell_padding(cell, top=100, bottom=100, left=140, right=140)
                is_bold = c_idx == 0
                color = RGBColor(15, 23, 42) if c_idx == 2 else (RGBColor(15, 23, 42) if is_bold else RGBColor(71, 85, 105))
                format_run(run, size_pt=8.5, color_rgb=color, bold=(is_bold or c_idx == 2))

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 20. Contact Our Team
    add_section_banner(doc, "20. Contact Our Team")
    add_p(doc, "Ready to streamline your workplace, eliminate hardware hassles, and give your team clear, objective clarity? We would love to walk you through a live demonstration.")
    
    add_callout(doc, "Get in Touch with Mobius Bloom Venture Pvt Ltd", "• Direct Phone: +91 9171115206\n• Official Websites: www.whalexy.com | employee.whalexy.com\n• Enterprise Inquiries: connect@whalexy.com | arbusiness1909@gmail.com\n• Corporate Headquarters: 3rd Floor, Shivnath Business Centre, Raipur, Chhattisgarh")

    # Save document
    doc.save(DOCX_PATH)
    print(f"Saved DOCX: {DOCX_PATH}")

    # Copy to root
    import shutil
    try:
        shutil.copyfile(DOCX_PATH, ROOT_DOCX_PATH)
        print(f"Copied DOCX to workspace root: {ROOT_DOCX_PATH}")
    except PermissionError:
        alt_root = os.path.join(WORKSPACE, "MobiusEMS_Product_Brochure_Updated.docx")
        shutil.copyfile(DOCX_PATH, alt_root)
        print(f"Root file was open in Word. Saved updated copy to: {alt_root}")
    return True

if __name__ == "__main__":
    build_docx()
