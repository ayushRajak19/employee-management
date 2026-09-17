import os
import subprocess
from pypdf import PdfReader

WORKSPACE = r"c:\Users\rainb\Desktop\employee-management"
HTML_PATH = os.path.join(WORKSPACE, "docs", "MobiusEMS_Whalexy_Style_Brochure.html")
PDF_PATH = os.path.join(WORKSPACE, "docs", "MobiusEMS_Whalexy_Style_Brochure.pdf")
ROOT_PDF_PATH = os.path.join(WORKSPACE, "MobiusEMS_Whalexy_Style_Brochure.pdf")

def get_brochure_html():
    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MobiusEMS - Enterprise Product Brochure</title>
<style>
  @page {
    size: 16in 9in;
    margin: 0;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background: #f8fafc;
    -webkit-font-smoothing: antialiased;
  }

  .slide {
    width: 16in;
    height: 9in;
    page-break-after: always;
    position: relative;
    padding: 0.8in 1.1in;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #ffffff;
    overflow: hidden;
  }
  .slide:last-child {
    page-break-after: avoid;
  }

  /* Watermark / Brand Header & Footer */
  .brand-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #f1f5f9;
    padding-bottom: 0.25in;
    margin-bottom: 0.3in;
  }
  .brand-logo {
    font-size: 24pt;
    font-weight: 900;
    letter-spacing: -0.5px;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .brand-logo span {
    color: #2563eb;
  }
  .brand-tagline {
    font-size: 13pt;
    font-weight: 600;
    color: #64748b;
    background: #f1f5f9;
    padding: 6px 16px;
    border-radius: 20px;
  }

  .brand-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 2px solid #f1f5f9;
    padding-top: 0.2in;
    font-size: 12pt;
    color: #94a3b8;
    font-weight: 500;
  }

  /* Slide 1: Cover */
  .cover-slide {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
    color: #ffffff;
    justify-content: center;
    padding: 1.2in 1.4in;
  }
  .cover-badge {
    display: inline-block;
    background: rgba(37, 99, 235, 0.3);
    border: 1.5px solid #3b82f6;
    color: #93c5fd;
    font-size: 15pt;
    font-weight: 700;
    padding: 8px 20px;
    border-radius: 30px;
    margin-bottom: 0.4in;
    letter-spacing: 0.5px;
  }
  .cover-title {
    font-size: 52pt;
    font-weight: 900;
    line-height: 1.15;
    margin: 0 0 0.3in 0;
    letter-spacing: -1px;
    max-width: 12in;
  }
  .cover-subtitle {
    font-size: 22pt;
    color: #cbd5e1;
    font-weight: 400;
    line-height: 1.45;
    max-width: 11in;
    margin-bottom: 0.5in;
  }
  .cover-footer {
    display: flex;
    gap: 0.6in;
    font-size: 14pt;
    color: #93c5fd;
    font-weight: 600;
  }

  /* Typography */
  .slide-title {
    font-size: 34pt;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
    margin: 0 0 0.15in 0;
    letter-spacing: -0.5px;
  }
  .slide-subtitle {
    font-size: 17pt;
    color: #475569;
    line-height: 1.45;
    margin: 0 0 0.35in 0;
    max-width: 12.5in;
  }

  /* Pill Badges (Slide 2) */
  .pills-strip {
    display: flex;
    gap: 0.25in;
    margin-bottom: 0.4in;
  }
  .pill-badge {
    background: #eff6ff;
    border: 1.5px solid #bfdbfe;
    color: #1d4ed8;
    font-size: 13pt;
    font-weight: 700;
    padding: 8px 20px;
    border-radius: 30px;
  }

  /* Overview Box (Slide 2) */
  .overview-card {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    padding: 0.45in 0.6in;
    margin-bottom: 0.4in;
  }
  .overview-card h3 {
    font-size: 22pt;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 0.2in 0;
  }
  .overview-card p {
    font-size: 16.5pt;
    line-height: 1.55;
    color: #334155;
    margin: 0 0 0.25in 0;
  }

  /* 4-Card Problem Grid (Slide 3) */
  .grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.3in;
  }
  .problem-card {
    background: #ffffff;
    border: 2px solid #fee2e2;
    border-radius: 14px;
    padding: 0.35in 0.3in;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
  .problem-icon {
    font-size: 28pt;
    margin-bottom: 0.15in;
  }
  .problem-card h4 {
    font-size: 16pt;
    font-weight: 750;
    color: #991b1b;
    margin: 0 0 0.15in 0;
    line-height: 1.3;
  }
  .problem-card p {
    font-size: 12.5pt;
    color: #475569;
    line-height: 1.45;
    margin: 0;
  }

  /* Impact Strip (Slide 4) */
  .solution-box {
    background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
    color: #ffffff;
    border-radius: 16px;
    padding: 0.5in 0.7in;
    margin-bottom: 0.4in;
  }
  .solution-box h3 {
    font-size: 26pt;
    font-weight: 800;
    margin: 0 0 0.2in 0;
  }
  .solution-box p {
    font-size: 16pt;
    color: #cbd5e1;
    line-height: 1.5;
    margin: 0 0 0.3in 0;
  }
  .impact-strip {
    background: rgba(255, 255, 255, 0.1);
    border: 1.5px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 0.25in 0.4in;
    display: flex;
    align-items: center;
    gap: 0.25in;
  }
  .impact-title {
    font-size: 15pt;
    font-weight: 800;
    color: #93c5fd;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    min-width: 2in;
  }
  .impact-desc {
    font-size: 14pt;
    color: #ffffff;
    line-height: 1.4;
  }

  /* 6-Card Features Grid (Slide 5, Slide 10, Slide 11) */
  .grid-6 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.3in;
  }
  .feature-card {
    background: #ffffff;
    border: 2px solid #e2e8f0;
    border-radius: 14px;
    padding: 0.35in 0.35in;
  }
  .feature-card h4 {
    font-size: 17pt;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 0.12in 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .feature-card p {
    font-size: 12.5pt;
    color: #475569;
    line-height: 1.45;
    margin: 0;
  }

  /* Comparison Side-by-Side (Slide 6) */
  .comp-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4in;
  }
  .comp-box {
    border-radius: 14px;
    padding: 0.35in 0.4in;
  }
  .comp-box.trad {
    background: #fef2f2;
    border: 2px solid #fecaca;
  }
  .comp-box.mobius {
    background: #f0fdf4;
    border: 2px solid #bbf7d0;
  }
  .comp-box h3 {
    font-size: 20pt;
    font-weight: 800;
    margin: 0 0 0.25in 0;
  }
  .comp-box.trad h3 { color: #991b1b; }
  .comp-box.mobius h3 { color: #166534; }
  .comp-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .comp-list li {
    font-size: 13pt;
    line-height: 1.45;
    margin-bottom: 0.15in;
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  .comp-box.trad li { color: #7f1d1d; }
  .comp-box.mobius li { color: #14532d; font-weight: 600; }

  /* Comparison Table (Slide 7) */
  .comp-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12pt;
    border-radius: 10px;
    overflow: hidden;
  }
  .comp-table th {
    background: #0f172a;
    color: #ffffff;
    font-size: 13pt;
    font-weight: 750;
    text-align: left;
    padding: 14px 20px;
  }
  .comp-table td {
    padding: 12px 20px;
    border-bottom: 1.5px solid #e2e8f0;
    color: #334155;
  }
  .comp-table tr:nth-child(even) td {
    background: #f8fafc;
  }
  .comp-table td.brand-col {
    font-weight: 750;
    color: #1d4ed8;
    background: #eff6ff !important;
  }

  /* Journey Steps (Slide 8) */
  .journey-container {
    display: flex;
    gap: 0.25in;
    align-items: stretch;
  }
  .journey-step {
    flex: 1;
    background: #ffffff;
    border: 2px solid #e2e8f0;
    border-top: 6px solid #2563eb;
    border-radius: 12px;
    padding: 0.3in 0.25in;
  }
  .step-num {
    font-size: 14pt;
    font-weight: 800;
    color: #2563eb;
    margin-bottom: 0.1in;
  }
  .journey-step h4 {
    font-size: 16pt;
    font-weight: 750;
    color: #0f172a;
    margin: 0 0 0.15in 0;
    line-height: 1.3;
  }
  .journey-step p {
    font-size: 12pt;
    color: #475569;
    line-height: 1.45;
    margin: 0;
  }

  /* Big Metric Callout (Slide 9) */
  .growth-hero {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
    border-radius: 16px;
    color: #ffffff;
    padding: 0.6in 0.8in;
    text-align: center;
    margin-bottom: 0.35in;
  }
  .growth-badge {
    font-size: 16pt;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: #60a5fa;
    text-transform: uppercase;
    margin-bottom: 0.15in;
  }
  .growth-title {
    font-size: 38pt;
    font-weight: 900;
    margin: 0 0 0.2in 0;
  }
  .growth-sub {
    font-size: 18pt;
    color: #cbd5e1;
    max-width: 10in;
    margin: 0 auto;
  }
  .growth-formula-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.3in;
  }
  .formula-card {
    background: #ffffff;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 0.3in;
    text-align: center;
  }
  .formula-card h5 {
    font-size: 14pt;
    color: #2563eb;
    font-weight: 800;
    margin: 0 0 0.08in 0;
  }
  .formula-card p {
    font-size: 11.5pt;
    color: #475569;
    margin: 0;
    line-height: 1.35;
  }

  /* Slide 12: Final Contact */
  .contact-slide {
    background: #ffffff;
  }
  .contact-hero {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
    color: #ffffff;
    border-radius: 16px;
    padding: 0.6in 0.8in;
    margin-bottom: 0.4in;
  }
  .contact-hero h2 {
    font-size: 38pt;
    font-weight: 900;
    margin: 0 0 0.15in 0;
  }
  .contact-hero p {
    font-size: 18pt;
    color: #cbd5e1;
    margin: 0;
  }
  .contact-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.3in;
  }
  .contact-card {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 14px;
    padding: 0.3in 0.25in;
    text-align: center;
  }
  .contact-icon {
    font-size: 26pt;
    margin-bottom: 0.1in;
  }
  .contact-card h4 {
    font-size: 13pt;
    font-weight: 750;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 0.08in 0;
  }
  .contact-card p {
    font-size: 13.5pt;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
    line-height: 1.3;
  }
</style>
</head>
<body>

<!-- ==========================================
     PAGE 1: COVER
=========================================== -->
<div class="slide cover-slide">
  <div class="cover-badge">ENTERPRISE WORKFORCE & OPERATIONS PLATFORM</div>
  <h1 class="cover-title">The Smarter Way to<br>Manage Workforce &amp; Operations</h1>
  <p class="cover-subtitle">Manage daily delivery, automate verified attendance &amp; performance reviews, and scale commercial sales from one intelligent platform.</p>
  <div class="cover-footer">
    <div>✦ Zero-Hardware Geofencing</div>
    <div>✦ 100% Deterministic Appraisals</div>
    <div>✦ Local Zero-Retention Voice AI</div>
    <div>✦ 7-Tier GIS Commercial CRM</div>
  </div>
</div>

<!-- ==========================================
     PAGE 2: WHAT IS MOBIUSEMS?
=========================================== -->
<div class="slide">
  <div class="brand-header">
    <div class="brand-logo">Mobius<span>EMS</span></div>
    <div class="brand-tagline">Executive Overview</div>
  </div>

  <div>
    <div class="pills-strip">
      <div class="pill-badge">Smart Geofenced Attendance</div>
      <div class="pill-badge">Visual Task Delivery Kanban</div>
      <div class="pill-badge">Deterministic Math Appraisals</div>
      <div class="pill-badge">Commercial Sales &amp; 7-Tier GIS</div>
    </div>

    <div class="overview-card">
      <h3>What is MobiusEMS?</h3>
      <p><strong>MobiusEMS</strong> helps businesses manage daily work execution, verified geofenced attendance, objective performance evidence, and commercial sales territories from one intelligent platform.</p>
      <p style="margin-bottom: 0;">Built to eliminate fragmented tools, it enables faster sprint delivery, verified workforce presence, unbiased mathematical reviews, and predictable revenue growth.</p>
    </div>
  </div>

  <div class="brand-footer">
    <div>Mobius Bloom Venture Pvt Ltd</div>
    <div>www.whalexy.com | employee.whalexy.com</div>
    <div>Page 2 of 12</div>
  </div>
</div>

<!-- ==========================================
     PAGE 3: WHY AUTOMATION? (4 PROBLEMS)
=========================================== -->
<div class="slide">
  <div class="brand-header">
    <div class="brand-logo">Mobius<span>EMS</span></div>
    <div class="brand-tagline">The Operational Challenge</div>
  </div>

  <div>
    <h2 class="slide-title">Why Businesses Need Workforce &amp; Operations Automation?</h2>
    <p class="slide-subtitle">Growing businesses often struggle to manage workforce delivery, attendance, and commercial pipelines efficiently, resulting in slower projects, biased reviews, and lost revenue.</p>

    <div class="grid-4">
      <div class="problem-card">
        <div class="problem-icon">⏳</div>
        <h4>Slow Delivery &amp; Hidden Blockers</h4>
        <p>Tasks logged in isolated boards hide impediments, leading to delayed project deadlines and lost client delivery trust.</p>
      </div>

      <div class="problem-card">
        <div class="problem-icon">📍</div>
        <h4>Biometric Failures &amp; Proxy Punching</h4>
        <p>Hardware biometric clocks break down constantly and cannot verify field sales reps, branch staff, or hybrid workers.</p>
      </div>

      <div class="problem-card">
        <div class="problem-icon">📊</div>
        <h4>Biased &amp; Subjective Appraisals</h4>
        <p>Annual spreadsheet appraisals suffer from severe recency bias, personal favoritism, and missing historical evidence.</p>
      </div>

      <div class="problem-card">
        <div class="problem-icon">📉</div>
        <h4>Disconnected Sales &amp; Leaked Revenue</h4>
        <p>Commercial deals isolated from employee capacity, leaves, and realized cash ledgers cause missed revenue targets.</p>
      </div>
    </div>
  </div>

  <div class="brand-footer">
    <div>Mobius Bloom Venture Pvt Ltd</div>
    <div>www.whalexy.com | employee.whalexy.com</div>
    <div>Page 3 of 12</div>
  </div>
</div>

<!-- ==========================================
     PAGE 4: COMPLETE SOLUTION & IMPACT
=========================================== -->
<div class="slide">
  <div class="brand-header">
    <div class="brand-logo">Mobius<span>EMS</span></div>
    <div class="brand-tagline">Business Impact</div>
  </div>

  <div>
    <div class="solution-box">
      <h3>The Complete Solution for Smarter Workforce Operations</h3>
      <p>MobiusEMS simplifies everyday operations with intelligent automation, helping businesses deliver faster, evaluate fairly, and grow commercial revenue efficiently through a unified enterprise operating system.</p>
      
      <div class="impact-strip">
        <div class="impact-title">Business Impact :</div>
        <div class="impact-desc">Zero hardware investment, faster sprint cycle times, 100% objective mathematical appraisals, and realized deduplicated revenue.</div>
      </div>
    </div>
  </div>

  <div class="brand-footer">
    <div>Mobius Bloom Venture Pvt Ltd</div>
    <div>www.whalexy.com | employee.whalexy.com</div>
    <div>Page 4 of 12</div>
  </div>
</div>

<!-- ==========================================
     PAGE 5: EXPLORE CORE FEATURES
=========================================== -->
<div class="slide">
  <div class="brand-header">
    <div class="brand-logo">Mobius<span>EMS</span></div>
    <div class="brand-tagline">Core Capabilities</div>
  </div>

  <div>
    <h2 class="slide-title">Explore MobiusEMS's Core Features</h2>
    <p class="slide-subtitle">A unified suite of enterprise capabilities connecting daily work execution to strategic business growth.</p>

    <div class="grid-6">
      <div class="feature-card">
        <h4>📍 Smart Geofenced Attendance</h4>
        <p>Browser check-in within a 300m office radius. 11:30 AM cutoff, 4h half-day calculation, and leave quotas.</p>
      </div>

      <div class="feature-card">
        <h4>📋 Visual Task Delivery Kanban</h4>
        <p>7-stage workflow state machine, real-time blocker escalation, cycle time, and rework loop intelligence.</p>
      </div>

      <div class="feature-card">
        <h4>🎙️ Local Zero-Retention Voice AI</h4>
        <p>Transcribe speech into structured tasks across 11 Indian languages locally with instant audio shredding.</p>
      </div>

      <div class="feature-card">
        <h4>🎯 Objective Performance Snapshots</h4>
        <p>Cascading goals, bounded KPIs (0–200%), and 360 reviews frozen into immutable cryptographic records.</p>
      </div>

      <div class="feature-card">
        <h4>🗺️ Commercial Sales &amp; 7-Tier GIS</h4>
        <p>Pincode-to-global mapping, territory capacity math, lead SLAs, and deduplicated realized revenue ledgers.</p>
      </div>

      <div class="feature-card">
        <h4>🏆 Capability Matrix &amp; Assessments</h4>
        <p>Centralized skills catalog, manager evidence verification, departmental heatmaps, and timed quizzes.</p>
      </div>
    </div>
  </div>

  <div class="brand-footer">
    <div>Mobius Bloom Venture Pvt Ltd</div>
    <div>www.whalexy.com | employee.whalexy.com</div>
    <div>Page 5 of 12</div>
  </div>
</div>

<!-- ==========================================
     PAGE 6: TRADITIONAL VS MOBIUSEMS
=========================================== -->
<div class="slide">
  <div class="brand-header">
    <div class="brand-logo">Mobius<span>EMS</span></div>
    <div class="brand-tagline">Competitive Comparison</div>
  </div>

  <div>
    <h2 class="slide-title">Traditional Fragmented Stack vs. MobiusEMS Unified Platform</h2>
    <p class="slide-subtitle">See how moving from disconnected point-solutions to a unified workspace transforms business performance.</p>

    <div class="comp-container">
      <div class="comp-box trad">
        <h3>Traditional Fragmented Stack (5 Tools)</h3>
        <ul class="comp-list">
          <li>✖ Expensive biometric hardware with high repair &amp; AMC costs</li>
          <li>✖ Isolated task boards with hidden blockers and delayed sprints</li>
          <li>✖ Subjective annual spreadsheet reviews prone to recency bias</li>
          <li>✖ Standalone external CRM licenses disconnected from employee capacity</li>
          <li>✖ Cloud privacy vulnerabilities and voice recording data leaks</li>
          <li>✖ Data silos, manual re-entry errors, and missing compliance audit logs</li>
        </ul>
      </div>

      <div class="comp-box mobius">
        <h3>MobiusEMS Unified Enterprise Platform</h3>
        <ul class="comp-list">
          <li>✔ Zero-hardware browser GPS check-in (300m Haversine radius)</li>
          <li>✔ 7-stage Kanban state machine with instant blocker escalation</li>
          <li>✔ 100% deterministic mathematical scoring &amp; frozen audit snapshots</li>
          <li>✔ Native 7-tier GIS CRM &amp; automated deduplicated revenue ledger</li>
          <li>✔ Local faster-whisper AI with guaranteed audio shredding</li>
          <li>✔ Fail-closed multi-tenancy &amp; immutable historical audit trail</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="brand-footer">
    <div>Mobius Bloom Venture Pvt Ltd</div>
    <div>www.whalexy.com | employee.whalexy.com</div>
    <div>Page 6 of 12</div>
  </div>
</div>

<!-- ==========================================
     PAGE 7: MOBIUSEMS VS OTHER PLATFORMS
=========================================== -->
<div class="slide">
  <div class="brand-header">
    <div class="brand-logo">Mobius<span>EMS</span></div>
    <div class="brand-tagline">Platform Matrix</div>
  </div>

  <div>
    <h2 class="slide-title">MobiusEMS Vs Other Platforms</h2>
    <p class="slide-subtitle">Feature-by-feature evaluation against traditional single-purpose enterprise software.</p>

    <table class="comp-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Feature Capability</th>
          <th style="background: #1e3a8a;">MobiusEMS Platform</th>
          <th>Traditional Point Solutions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Attendance &amp; GPS</strong></td>
          <td>Physical Presence Verification</td>
          <td class="brand-col">Browser Haversine 300m + Spoof Guard</td>
          <td>Biometric Finger Clocks / 24/7 Phone Stalking</td>
        </tr>
        <tr>
          <td><strong>Speech &amp; AI</strong></td>
          <td>Task Voice Capture</td>
          <td class="brand-col">Local faster-whisper (Zero Retention, 11 Indian Languages)</td>
          <td>None / Third-Party Cloud APIs with Leaks</td>
        </tr>
        <tr>
          <td><strong>Appraisals</strong></td>
          <td>Performance Scoring</td>
          <td class="brand-col">Deterministic Math (Goals + KPIs + 360) + Snapshots</td>
          <td>Subjective Annual Form Fill / Spreadsheets</td>
        </tr>
        <tr>
          <td><strong>Delivery</strong></td>
          <td>Project &amp; Work Execution</td>
          <td class="brand-col">Native 7-Stage Kanban + Blocker Alerting</td>
          <td>Isolated Standalone Tools (Jira / Trello)</td>
        </tr>
        <tr>
          <td><strong>Commercial Sales</strong></td>
          <td>Territory CRM &amp; Ledger</td>
          <td class="brand-col">Native 7-Tier GIS + Headcount Math + Deduplicated Ledger</td>
          <td>Heavy External CRM Disconnected from HR</td>
        </tr>
        <tr>
          <td><strong>Security</strong></td>
          <td>Multi-Tenant Isolation</td>
          <td class="brand-col">Fail-Closed AsyncLocalStorage + Rotating HttpOnly JWT</td>
          <td>Shared Tenant DB Queries / Fragmented SaaS</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="brand-footer">
    <div>Mobius Bloom Venture Pvt Ltd</div>
    <div>www.whalexy.com | employee.whalexy.com</div>
    <div>Page 7 of 12</div>
  </div>
</div>

<!-- ==========================================
     PAGE 8: JOURNEY FROM CHECK-IN TO REVENUE
=========================================== -->
<div class="slide">
  <div class="brand-header">
    <div class="brand-logo">Mobius<span>EMS</span></div>
    <div class="brand-tagline">Operational Workflow</div>
  </div>

  <div>
    <h2 class="slide-title">Powering the Journey from Daily Check-In to Enterprise Revenue</h2>
    <p class="slide-subtitle">A connected 5-step operational pipeline linking daily individual effort to verified commercial results.</p>

    <div class="journey-container">
      <div class="journey-step">
        <div class="step-num">STEP 01</div>
        <h4>Onboard &amp; Verify Profile</h4>
        <p>Resumable onboarding, mandatory first-login password change, statutory IDs, and Employee 360 career history.</p>
      </div>

      <div class="journey-step">
        <div class="step-num">STEP 02</div>
        <h4>Smart Geofenced Check-In</h4>
        <p>One-tap mobile browser check-in within 300m of office. Anti-spoofing protection and automatic 11:30 AM cutoff.</p>
      </div>

      <div class="journey-step">
        <div class="step-num">STEP 03</div>
        <h4>Execute &amp; Log Voice Tasks</h4>
        <p>7-stage Kanban execution, instant blocker escalation, and multilingual zero-retention voice task capture.</p>
      </div>

      <div class="journey-step">
        <div class="step-num">STEP 04</div>
        <h4>Continuous Weekly Check-In</h4>
        <p>Friday deliverable logs, velocity tracking over 30/90 days, and objective peer contribution percentiles.</p>
      </div>

      <div class="journey-step">
        <div class="step-num">STEP 05</div>
        <h4>Book Commercial Revenue</h4>
        <p>Field sales in assigned GIS territories convert leads; won deals book deduplicated revenue onto the ledger.</p>
      </div>
    </div>
  </div>

  <div class="brand-footer">
    <div>Mobius Bloom Venture Pvt Ltd</div>
    <div>www.whalexy.com | employee.whalexy.com</div>
    <div>Page 8 of 12</div>
  </div>
</div>

<!-- ==========================================
     PAGE 9: MORE VELOCITY. BETTER GROWTH.
=========================================== -->
<div class="slide">
  <div class="brand-header">
    <div class="brand-logo">Mobius<span>EMS</span></div>
    <div class="brand-tagline">Strategic Growth</div>
  </div>

  <div>
    <div class="growth-hero">
      <div class="growth-badge">MORE VELOCITY. BETTER GROWTH. HIGHER RETENTION.</div>
      <h2 class="growth-title">Turn Everyday Delivery into Measurable Enterprise Growth</h2>
      <p class="growth-sub">From Daily Effort to Realized Commercial Revenue, Simplified.</p>
    </div>

    <div class="growth-formula-strip">
      <div class="formula-card">
        <h5>1. Verified Presence</h5>
        <p>Haversine 300m browser GPS eliminates biometric clock queues and attendance fraud.</p>
      </div>

      <div class="formula-card">
        <h5>2. Sprint Velocity</h5>
        <p>Cycle times and rework counts spotlight delivery bottlenecks in real time.</p>
      </div>

      <div class="formula-card">
        <h5>3. Objective Reviews</h5>
        <p>100% deterministic mathematical appraisals eliminate workplace politics.</p>
      </div>

      <div class="formula-card">
        <h5>4. Realized Revenue</h5>
        <p>Closed-won deals book deduplicated transactions directly to the financial ledger.</p>
      </div>
    </div>
  </div>

  <div class="brand-footer">
    <div>Mobius Bloom Venture Pvt Ltd</div>
    <div>www.whalexy.com | employee.whalexy.com</div>
    <div>Page 9 of 12</div>
  </div>
</div>

<!-- ==========================================
     PAGE 10: INDUSTRIES WE SERVE
=========================================== -->
<div class="slide">
  <div class="brand-header">
    <div class="brand-logo">Mobius<span>EMS</span></div>
    <div class="brand-tagline">Industry Verticals</div>
  </div>

  <div>
    <h2 class="slide-title">Industries We Serve</h2>
    <p class="slide-subtitle">Purpose-built workflows tailored for high-growth sectors and distributed enterprise teams.</p>

    <div class="grid-6">
      <div class="feature-card">
        <h4>💻 IT &amp; Software Services</h4>
        <p>Visual Kanban boards, cycle time tracking, rework count metrics, and departmental skill matrix heatmaps.</p>
      </div>

      <div class="feature-card">
        <h4>🚚 Field Sales &amp; Distribution</h4>
        <p>7-tier geographic hierarchy, territory capacity forecasting, and lead SLA lost revenue warnings.</p>
      </div>

      <div class="feature-card">
        <h4>🏭 Manufacturing &amp; Operations</h4>
        <p>Shift check-in verification, geofenced facility boundaries, and real-time attendance registers.</p>
      </div>

      <div class="feature-card">
        <h4>🎓 Education &amp; EdTech</h4>
        <p>Timed candidate assessments, randomized question pools, skill gap analysis, and internal training catalog.</p>
      </div>

      <div class="feature-card">
        <h4>🏥 Healthcare &amp; Clinic Chains</h4>
        <p>Multi-location staff attendance, shift rosters, leave quotas, and centralized employee 360 records.</p>
      </div>

      <div class="feature-card">
        <h4>💼 Professional Services</h4>
        <p>Client project tracking, deliverable check-ins, structured 1-on-1 agendas, and core-value recognitions.</p>
      </div>
    </div>
  </div>

  <div class="brand-footer">
    <div>Mobius Bloom Venture Pvt Ltd</div>
    <div>www.whalexy.com | employee.whalexy.com</div>
    <div>Page 10 of 12</div>
  </div>
</div>

<!-- ==========================================
     PAGE 11: WHY BUSINESSES CHOOSE MOBIUSEMS
=========================================== -->
<div class="slide">
  <div class="brand-header">
    <div class="brand-logo">Mobius<span>EMS</span></div>
    <div class="brand-tagline">Enterprise Value</div>
  </div>

  <div>
    <h2 class="slide-title">Why Businesses Choose MobiusEMS ?</h2>
    <p class="slide-subtitle">MobiusEMS helps businesses simplify workforce management, automate daily workflows, and scale commercial sales—all from one intelligent platform.</p>

    <div class="grid-6">
      <div class="feature-card">
        <h4>⚡ Zero-Hardware Simplicity</h4>
        <p>Save lakhs on biometric hardware and maintenance fees with instant browser-based geofencing.</p>
      </div>

      <div class="feature-card">
        <h4>🔒 100% Privacy &amp; Local AI</h4>
        <p>Local speech-to-task via faster-whisper with strict audio shredding; no cloud leaks.</p>
      </div>

      <div class="feature-card">
        <h4>📐 Deterministic Fairness</h4>
        <p>Transparent mathematical appraisals eliminate recency bias and subjective workplace politics.</p>
      </div>

      <div class="feature-card">
        <h4>🗺️ Native Commercial GIS</h4>
        <p>Territory capacity planning, SLA tracking, and deduplicated realized revenue accounting.</p>
      </div>

      <div class="feature-card">
        <h4>🚨 Real-Time Blocker Alerts</h4>
        <p>Surfaces delivery impediments immediately to keep project sprints and deadlines on track.</p>
      </div>

      <div class="feature-card">
        <h4>🛡️ Fail-Closed Security</h4>
        <p>AsyncLocalStorage multi-tenancy, rotating HttpOnly sessions, and tamper-evident audit logs.</p>
      </div>
    </div>
  </div>

  <div class="brand-footer">
    <div>Mobius Bloom Venture Pvt Ltd</div>
    <div>www.whalexy.com | employee.whalexy.com</div>
    <div>Page 11 of 12</div>
  </div>
</div>

<!-- ==========================================
     PAGE 12: CONTACT & CALL TO ACTION
=========================================== -->
<div class="slide contact-slide">
  <div class="brand-header">
    <div class="brand-logo">Mobius<span>EMS</span></div>
    <div class="brand-tagline">Get In Touch</div>
  </div>

  <div>
    <div class="contact-hero">
      <h2>Ready to Grow Your Business with MobiusEMS?</h2>
      <p>Have questions or want to see MobiusEMS in action? Contact our team for an executive walkthrough.</p>
    </div>

    <div class="contact-grid">
      <div class="contact-card">
        <div class="contact-icon">📞</div>
        <h4>Call Us</h4>
        <p>+91 9171115206</p>
      </div>

      <div class="contact-card">
        <div class="contact-icon">🌐</div>
        <h4>Online Platform</h4>
        <p>www.whalexy.com<br><span style="font-size: 11pt; color: #2563eb;">employee.whalexy.com</span></p>
      </div>

      <div class="contact-card">
        <div class="contact-icon">✉️</div>
        <h4>Email Us</h4>
        <p>connect@whalexy.com<br><span style="font-size: 11pt; color: #64748b;">arbusiness1909@gmail.com</span></p>
      </div>

      <div class="contact-card">
        <div class="contact-icon">🏢</div>
        <h4>Headquarters</h4>
        <p>3rd Floor, Shivnath Business Centre, Raipur, Chhattisgarh</p>
      </div>
    </div>
  </div>

  <div class="brand-footer">
    <div>Mobius Bloom Venture Pvt Ltd</div>
    <div>v2.0-PROD Enterprise Edition</div>
    <div>Page 12 of 12</div>
  </div>
</div>

</body>
</html>
"""

def generate_whalexy_style_pdf():
    with open(HTML_PATH, "w", encoding="utf-8") as f:
        f.write(get_brochure_html())
    print(f"Written Whalexy-Style HTML: {HTML_PATH}")

    edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_exe):
        edge_exe = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

    cmd = [
        edge_exe,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=3000",
        f"--print-to-pdf={PDF_PATH}",
        HTML_PATH
    ]

    print("Compiling Whalexy-Inspired 16:9 Landscape PDF via Edge...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("Edge error:", res.stderr)
        return False

    if os.path.exists(PDF_PATH):
        size_bytes = os.path.getsize(PDF_PATH)
        print(f"PDF generated: {PDF_PATH} ({size_bytes / 1024:.1f} KB)")

        # Copy to root
        with open(PDF_PATH, "rb") as src, open(ROOT_PDF_PATH, "wb") as dst:
            dst.write(src.read())
        print(f"Copied to workspace root: {ROOT_PDF_PATH}")

        reader = PdfReader(PDF_PATH)
        print(f"Total Pages in PDF: {len(reader.pages)}")
        for idx, p in enumerate(reader.pages):
            text = (p.extract_text() or "").strip()
            print(f"  Page {idx+1}: {len(text)} chars | Preview: {text[:60]!r}")
        return True
    else:
        print("PDF was not created.")
        return False

if __name__ == "__main__":
    generate_whalexy_style_pdf()
