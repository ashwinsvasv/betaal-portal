# Sunwai — Prompts & AI Coding Log

**Project:** Sunwai (सुनवाई) — Student Council Issue-Tracking Portal, IIM Lucknow  
**Event:** Overtures / Synapse  
**Sprint:** Sprint 1 (Overtures MVP: Core Loop)  
**AI Coding Tool Disclosed:** Claude Code / Advanced Agentic Pair Programmer  
**Date:** October 3, 2026  

---

## 1. Executive Summary & AI Disclosure

As required by the Overtures submission guidelines, this document records the prompts, architectural decisions, and agentic workflows used to build the Sprint 1 MVP of **Sunwai**.

Sunwai solves the accountability void where student complaints at IIM Lucknow get lost across WhatsApp, emails, and hallway conversations. The Sprint 1 objective was to deliver the complete core loop:
> *"A student can raise an issue and an owner can close it. Exit test: Demo the hot-water story end to end on the live site."*

---

## 2. Iterative Prompt Trajectory & Agentic Workflows

### Phase 1: Tech Spec Ingestion & Domain Modeling
**User Prompt:**
> "can you go through the technical specifications in the folder and code the first sprint?"

**Agent Reasoning & Architectural Plan:**
- Parsed `Sunwai — Technical Specification.md` (447 lines) across the six roles, core user flows, 11 database tables, deterministic routing rules, and lifecycle timers.
- Designed a hybrid persistence architecture:
  1. Full Supabase PostgreSQL DDL migration (`supabase/migrations/20261003_sprint1_schema.sql`) and `seed.sql` for production cloud deployment.
  2. A reactive in-browser state synchronization layer (`src/lib/store.tsx`) with localStorage persistence, allowing zero-friction offline execution and live demos without mandatory external cloud credentials.

---

### Phase 2: Schema, Types & Deterministic Routing Table
**Internal Prompt / Directive:**
> *"Implement the PostgreSQL schema and TypeScript interfaces corresponding to users, roles, routing_rules, issues, votes, comments, status_updates, issue_photos, and email_outbox. Implement the deterministic routing rules lookup table according to Section 'Routing rules' in the spec."*

**Key Rules Implemented in `src/lib/routing.ts`:**
- **Category + Scope Lookup Table:**
  - `Infra & IT` / `Hostel life` with `my room` or `my hostel` $\rightarrow$ Routes to the student's specific `Hostel Rep` (e.g. `Hostel Rep H3`), with `Infra & IT Secretary` copied.
  - `Infra & IT` with `whole campus` $\rightarrow$ `Infra & IT Secretary`.
  - `Mess and food` $\rightarrow$ `Mess Secretary`.
  - `Academics` $\rightarrow$ `Academic Secretary`.
  - `Sports facilities and events` $\rightarrow$ `Sports Secretary`.
  - `Events` $\rightarrow$ `Events Secretary`.
  - `Cultural` $\rightarrow$ `Cultural Secretary`.
  - `Finance and reimbursements` $\rightarrow$ `Treasurer`.
  - `Other / not sure` $\rightarrow$ `President`.
- **Conflict of Interest Rules:**
  - Conduct complaint checkbox $\rightarrow$ routes to President and forces private visibility.
  - Complaint about the President $\rightarrow$ routes directly to Student Affairs.
  - Self-assignment prevention $\rightarrow$ If the logged-in student holds the owner role, it routes to President.

---

### Phase 3: Seed Data & The Hot-Water Story Exit Test
**Internal Prompt / Directive:**
> *"Construct rich seed data containing council roles, 2 hostel reps (H3 and H4), 30 students across PGP, ABM, IPM, and 10 realistic issues. Ensure the famous hot-water request ('Geysers non-functional in Hostel 3 2nd floor washrooms') is seeded with 214 votes, priority status, photos, and status updates."*

**Data Seeded:**
- **Hot-Water Issue (`issue-hot-water`)**:
  - Title: *"Geysers non-functional in Hostel 3 2nd floor washrooms"*
  - Category: `Infra & IT`, Scope: `my hostel`, Hostel: `Hostel 3`
  - Vote count: 214 (crossed >10% campus threshold, marked `is_priority = true`)
  - Owner: `Hostel Rep H3` (Vikramaditya Rao), CC: `Infra & IT Secretary` (Kabir Mehta)
  - Status: `Raised` (48h clock running), with realistic comments from batchmates.

---

### Phase 4: UI / UX & Role Flows Implementation

#### S1, S2, S3 — Raise Issue Wizard
- Implemented sensitive keyword interceptor: Any query mentioning harassment, safety, or acute medical emergencies stops submission and displays official emergency contacts (ICC, Campus Health Centre, Counsellor, Chief Security Officer).
- Live duplicate detection: While typing title, searches open issues and provides an "Upvote instead" button to prevent duplicate vote dilution.
- Owner Confirmation step: Displays the exact computed owner and CC roles before confirmation, with an override option: "Not sure, send to President".

#### S6, S7 — Public Feed & Discovery
- Upvoting engine: Removable, single-vote per student, synchronized vote count.
- Privacy-preserving Public Identity Rule: Public viewers see only masked identity (e.g. `PGP 41 student`). Assigned owners and the President see full name, roll number, and hostel block.
- Search and multi-criteria filters: Category, status, hostel, and sort by "Most Upvoted" vs "Newest".

#### C1 to C5 — Owner Inbox & Lifecycle Transitions
- Filter by: All Assigned, Awaiting Acknowledgment, In Progress, Overdue.
- C2 Acknowledge: Requires note, updates status to `Acknowledged`, clears SLA clock.
- C3 Start Work: Moves to `In Progress`, schedules weekly update SLA (7 days).
- C4 Complete: Requires proof note and optional photo.
- C4 Reject: Requires structured reason selection and note.
- C5 Redirect: Reassigns to another role, restarts 48h clock, caps at 2 redirects (3rd redirect automatically routes to President).

#### S9 — Student Confirmation or Reopen
- When owner marks an issue `Completed`, student has a 7-day review window:
  - "Confirm Fix": Transitions issue to `Closed`.
  - "Reopen Issue": Requires reason, transitions back to `In Progress` with a `Reopened by Student` badge.

#### P1 to P3 — President Dashboard
- Executive metrics: Overdue 48h SLA breaches, Priority issues (>10% student votes), Total active tickets.
- Level 1 Escalation Manager: Allows the President to take direct ownership or reassign overdue tickets.
- Secretariat area breakdown table showing open, overdue, and resolved counts per secretary.

#### Demo Simulators
- **⚡ Run Deadline Checker Button**: Simulates the hourly cron worker. Finds overdue `Raised` tickets and auto-escalates them to `Escalated L1` (President).
- **Simulated Email Outbox**: Records all email dispatches to role inboxes and students in real time.
- **Persona Switcher**: One-click toggle between Student, Hostel Rep H3, Infra Sec, Mess Sec, President, and Admin.

---

## 3. Exit Test Verification

| Step | Action Taken | Expected Result | Verified Status |
| --- | --- | --- | --- |
| 1 | Open Feed | `Geysers non-functional in Hostel 3` is visible at the top with 214 votes and Priority flame tag | Passed |
| 2 | Switch to Student | Upvote toggles +1 / -1; duplicate suggestion flags during issue creation | Passed |
| 3 | Switch to Hostel Rep H3 | Open Owner Inbox $\rightarrow$ H3 Geyser issue appears under assigned items | Passed |
| 4 | Acknowledge | Rep acknowledges with inspection note $\rightarrow$ moves to `Acknowledged` | Passed |
| 5 | Start Work | Rep moves to `In Progress` $\rightarrow$ 7-day update due date set | Passed |
| 6 | Complete Fix | Rep submits proof photo and note $\rightarrow$ moves to `Completed` | Passed |
| 7 | Student Verification | Student clicks "Confirm Fix" $\rightarrow$ issue auto-closes as `Closed` | Passed |
| 8 | Escalation Check | Click "Run Deadline Check" $\rightarrow$ overdue issues auto-escalate to `Escalated L1` | Passed |
