# Sunwai — Prompts & AI Coding Log

**Project:** Sunwai (सुनवाई) — Student Council Issue-Tracking Portal, IIM Lucknow  
**Event:** Overtures / Synapse  
**Sprints Covered:** Sprint 1 (Overtures MVP: Core Loop) & Sprint 2 (Accountability)  
**AI Coding Tool Disclosed:** Claude Code / Advanced Agentic Pair Programmer  
**Date:** October 3, 2026  

---

## 1. Executive Summary & AI Disclosure

As required by the Overtures submission guidelines, this document records the prompts, architectural decisions, and agentic workflows used to build **Sprint 1 (Core Loop)** and **Sprint 2 (Accountability)** of **Sunwai**.

Sunwai turns complaints into formal, trackable tickets with deterministic owner assignment, 48-hour SLAs, append-only audit trails, and automatic council escalations.

- **Sprint 1 Exit Test:** *"Demo the hot-water story end to end on the live site."* (Passed)
- **Sprint 2 Exit Test:** *"An unacknowledged test issue escalates on its own."* (Passed)

---

## 2. Sprint 1 Trajectory: Core Loop (Overtures MVP)

### Phase 1: Tech Spec Ingestion & Domain Modeling
**User Prompt:**
> "can you go through the technical specifications in the folder and code the first sprint?"

**Agent Reasoning & Architectural Plan:**
- Parsed `Sunwai — Technical Specification.md` across the six roles, core user flows, 11 database tables, deterministic routing rules, and lifecycle timers.
- Designed a hybrid persistence architecture:
  1. Full Supabase PostgreSQL DDL migration (`supabase/migrations/20261003_sprint1_schema.sql`) and `seed.sql` for production cloud deployment.
  2. A reactive in-browser state synchronization layer (`src/lib/store.tsx`) with localStorage persistence, allowing zero-friction offline execution and live demos without mandatory external cloud credentials.

### Phase 2: Schema, Types & Deterministic Routing Table
- Implemented `users`, `roles`, `routing_rules`, `issues`, `votes`, `comments`, `status_updates`, `issue_photos`, and `email_outbox`.
- Implemented deterministic routing table in `src/lib/routing.ts` matching category and scope to owner role and copied roles, with conflict-of-interest safeguards.

### Phase 3: Seed Data & Hot-Water Story
- Seeded council roles, 2 hostel reps (H3, H4), 30 students across PGP, ABM, and IPM, and 10 realistic issues including the 214-vote Hostel 3 geyser issue.

### Phase 4: UI/UX & Role Workflows
- **S1, S2, S3**: Raise issue wizard with sensitive keyword redirect (ICC, medical, safety), duplicate detection, and owner confirmation.
- **S6, S7**: Public feed with upvotes, keyword search, status/category filters, and public identity masking (`PGP 41 student`).
- **C1 to C5**: Owner inbox with acknowledge, in-progress, proof completion, and rejection.
- **S4, S5, S9**: Student dashboard with edit, delete, withdraw, and 7-day confirmation/reopen.
- **P1 to P3**: President dashboard with KPI cards, L1 escalation queue, and area overview.

---

## 3. Sprint 2 Trajectory: Accountability & Escalation Engine

### Phase 5: Architecture & Backend Rules
**User Prompt:**
> "let's go with sprint 2"

**Agent Reasoning & Sprint 2 Plan:**
Sprint 2 requires enforcing accountability mechanisms so issues cannot sit idle:
1. **Email Service & Outbox with Retries**: Outbox queue supporting delivery status, failure logging, and exponential retry up to 3 attempts.
2. **Notification Matrix (S10)**: All templates from the spec: 24h ack reminder, Escalation L1, Escalation L2, Priority threshold alert, Weekly update overdue reminder, Weekly update escalation, Reopen notice, and 8 AM Daily Digest.
3. **Hourly Deadline Checker & Cron Engine**:
   - 24h reminder for pending `Raised` issues.
   - 48h SLA breach $\rightarrow$ Auto-escalation to `Escalated L1` (President).
   - 48h President inaction $\rightarrow$ Auto-escalation to `Escalated L2` (Student Affairs).
   - 7-day weekly update breach $\rightarrow$ Reminder; +3 days grace breach $\rightarrow$ Escalated L1.
   - 7-day Priority response breach $\rightarrow$ Escalated L1.
   - 7-day Student review window expiration on Completed tickets $\rightarrow$ Auto-close as `Closed`.
4. **API Routes for Cron**:
   - `/api/cron/deadline-checker` (hourly deadline checker).
   - `/api/cron/daily-digest` (8:00 AM daily digest generator).
5. **C5 Redirect Rules**: Strict 2-redirect maximum limit; 3rd attempt automatically routes permanently to the President.
6. **C6 Severity Flags**: Normal, High, and Critical flags with priority sorting.
7. **C7 Area Dashboards**: Dedicated `/area-dashboard` with open count, overdue count, median resolution days, severity mix, and student reopen rates.
8. **Time-Machine & Simulator**: Interactive control panel (`DeadlineControlModal.tsx`) allowing evaluators to advance the clock (+24h, +48h, +96h) and verify that unacknowledged test issues escalate on their own.

---

## 4. Exit Test Verification Matrix

### Sprint 1 Exit Test: The Hot-Water Story
| Step | Action Taken | Expected Result | Verified Status |
| --- | --- | --- | --- |
| 1 | Open Feed | `Geysers non-functional in Hostel 3` is visible at top with 214 votes and Priority flame tag | Passed |
| 2 | Switch to Student | Upvote toggles +1 / -1; duplicate suggestion flags during issue creation | Passed |
| 3 | Switch to Hostel Rep H3 | Open Owner Inbox $\rightarrow$ H3 Geyser issue appears under assigned items | Passed |
| 4 | Acknowledge | Rep acknowledges with inspection note $\rightarrow$ moves to `Acknowledged` | Passed |
| 5 | Start Work | Rep moves to `In Progress` $\rightarrow$ 7-day update due date set | Passed |
| 6 | Complete Fix | Rep submits proof photo and note $\rightarrow$ moves to `Completed` | Passed |
| 7 | Student Verification | Student clicks "Confirm Fix" $\rightarrow$ issue auto-closes as `Closed` | Passed |

### Sprint 2 Exit Test: Unacknowledged Test Issue Escalates On Its Own
| Step | Action Taken | Expected Result | Verified Status |
| --- | --- | --- | --- |
| 1 | Spawn Unacknowledged Issue | Click "Spawn Unacknowledged Issue" in Accountability Simulator $\rightarrow$ Issue created with status `Raised` and 48h clock | Passed |
| 2 | Advance Clock +24 Hours | Click "Fast-Forward 24 Hours" $\rightarrow$ Automated 24h reminder notification queued to owner role inbox | Passed |
| 3 | Advance Clock +48 Hours | Click "Fast-Forward 48 Hours" $\rightarrow$ 48h SLA breached. Issue auto-escalates to `Escalated L1` on President Dashboard. Escalation email sent to President | Passed |
| 4 | Advance Clock +48h more | Click "Trigger L2" $\rightarrow$ President inattention window breached. Issue auto-escalates to `Escalated L2` (Student Affairs) | Passed |
| 5 | Test 2-Redirect Limit | In issue detail, redirect twice $\rightarrow$ 3rd redirect automatically routes to President with alert | Passed |
| 6 | Test 8 AM Daily Digest | Click "Generate 8 AM Daily Digest" $\rightarrow$ multi-ticket digests compiled and dispatched to each role | Passed |
| 7 | Test Email Retry Worker | In `/outbox`, click "Retry Failed" $\rightarrow$ failed delivery re-attempted and transitioned to `sent` | Passed |
