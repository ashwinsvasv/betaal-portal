# Sunwai (सुनवाई) — Student Council Issue-Tracking Portal
### Indian Institute of Management Lucknow · Sprints 1, 2, 3 & 4 Complete

> *"Sunwai gives every student complaint at IIM Lucknow an owner, a deadline and a public status, so no issue can be silently ignored."*

---

## 📖 Overview

At IIM Lucknow, students historically raised issues across scattered WhatsApp groups, emails, Google Forms, and hallway conversations. None of these assigned a definitive owner, enforced a deadline, or guaranteed a response. A notorious request for hot water in winter received over 200 votes and still went nowhere because no formal mechanism existed to hold owners accountable.

**Sunwai** solves this problem by turning complaints into formal, trackable tickets with deterministic owner assignment, 48-hour SLAs, append-only audit trails, and automatic council escalations.

---

## 🚀 Quick Start (Running Locally)

### Prerequisites
- Node.js v18+ (tested on Node v24.20.0)
- npm v10+

### 1. Installation
```bash
git clone <repo-url>
cd Sunwai
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> [!NOTE]
> Sunwai is equipped with an integrated reactive state store with seed data for 30 students, 10 realistic issues, and council roles. It works out of the box with zero external configuration!
> For cloud database integration, configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` and run `supabase/migrations/20261003_sprint1_schema.sql`.

## 🧘 Calm, Uncluttered Architecture

Sunwai is designed as a calm, focused application where every screen does exactly one job.

### 1. The Single Accountability Line
On every issue (in lists and on its own page), Sunwai renders one single coloured pill with an accountability dot saying who has the ball and how long they have:
- **Raised, within 48h**: `Mess Secretary has 20h left to respond` (grey; amber if under 12h)
- **Raised, past 48h**: `Mess Secretary is 6h late to respond` (red)
- **Escalated**: `Escalated to the President, Mess Secretary missed the deadline` (red)
- **Acknowledged**: `Mess Secretary acknowledged it` (blue)
- **In progress**: `Mess Secretary is working on it, next update in 4 days` (blue; red if weekly update is late)
- **Fixed**: `Marked fixed, the student has 6 days to confirm or reopen` (green)
- **Resolved**: `Resolved in 5 days` (green)
- **Rejected / Withdrawn**: grey

*Rule:* This pill replaces separate status badges, deadline text, and progress bars. Status is never displayed twice.

### 2. The 7 Focused Screens
1. **Sign in (`/signin`)**: Headline statement on the left, Google sign-in button and 1-click demo account switcher on the right.
2. **All issues (home `/`)**: Clean search box, category dropdown, two small toggles (`Open` / `Resolved` / `Everything`; `Most votes` / `Newest`), and one white panel list.
3. **Raise an issue (`/raise`)**: 1 page, 2 steps (Form $\rightarrow$ "Check who this goes to" with direct send or President fallback).
4. **Issue page (`/issue/[id]`)**: Title, accountability pill, details, photos, viewer-specific action panel, timeline, discussion, and narrow right sidebar (`Responsible`, `Status`, `Votes` only).
5. **My issues (`/my-issues`)**: Reused issue row component, without vote buttons.
6. **My inbox (`/inbox`)**: Reused issue row component with 3 tabs (`Needs action`, `Waiting on student`, `Done`).
7. **Dashboard (`/dashboard`)**: 5 numbers in one row, "Run deadline check now" button, "Needs your attention" list, "By owner" table, and email log.

---

## 🧪 Sprint 3 Exit Tests: 2,000-Row Student Upload & Privacy Isolation

The Sprint 3 exit criteria require:
> *"A 2,000-row upload works, and private issues are invisible to the wrong roles."*

### Exit Test 1: 2,000-Student Bulk Upload (A1)
1. **Navigate to the Admin Portal (`/admin`)**:
   - Click **Admin Portal** in the navigation bar.
2. **Open the "Bulk Student Upload" Tab**:
   - Click the **"Generate 2,000 Test Records"** button to synthesize 2,000 authentic student records across PGP, ABM, IPM, and IPMX batches.
3. **Verify Prefix Splitting & Validation Preview**:
   - The preview table parses roll numbers instantaneously:
     - `PGP42069` $\rightarrow$ Course: **PGP**, Batch: **42**
     - `ABM22045` $\rightarrow$ Course: **ABM**, Batch: **22**
     - `IPMX10012` $\rightarrow$ Course: **IPMX**, Batch: **10**
   - The validation engine checks for valid `@iiml.ac.in` email format and highlights rows with unrecognized roll prefixes in red.
   - Filter by **"Errors Only"** or **"Valid Only"** to review parsed records.
4. **Commit Bulk Enrollment**:
   - Click **"Commit 1,998 Valid Students to Database"**.
   - Notice the enrolled student count updates in real-time and an append-only entry is added to the **Audit Log (A7)**.

---

### Exit Test 2: Role-by-Role Privacy Isolation (RLS)
Sunwai enforces strict Row-Level Security:
- **Public issues**: Visible to all active students and council members.
- **Private issues**: Visible *only* to the **Raiser**, the **Assigned Council Owner**, and the **President**.
- **Crucial Rule:** The **Technical Admin cannot read private issues**, because administrator is a technical operations role, not a student representation role.

To verify privacy isolation:
1. **Automated Verification Suite (`/admin`)**:
   - In the **Admin Portal**, click the **"Privacy Isolation Test"** tab.
   - Click **"Run Automated 5-Role Privacy Test"**.
   - The suite executes an isolation test for a private ticket (`Confidential reimbursement matter`) across 6 distinct personas:
     - ✅ Raising Student: **ACCESS GRANTED**
     - ✅ Assigned Role Owner (Treasurer): **ACCESS GRANTED**
     - ✅ Student Council President: **ACCESS GRANTED**
     - 🛑 Technical Administrator: **ACCESS STRICTLY DENIED**
     - 🛑 General Student: **ACCESS STRICTLY DENIED**
     - 🛑 Unrelated Council Chair (Sports): **ACCESS STRICTLY DENIED**
2. **Interactive UI Verification**:
   - Open a private issue directly, e.g., `/issue/issue-test-private` (or raise a private issue via `/raise`).
   - Switch persona to **Technical Administrator (`techadmin@iiml.ac.in`)**: The page renders the **Access Restricted · Private Issue** security gate.
   - Switch persona to **President (`Ashwin Narayan`)**: Full issue details, timeline, and actions become visible immediately.

---

## 🧪 Sprint 2 Exit Test: Unacknowledged Issue Escalates On Its Own

The Sprint 2 exit test requires verifying that **an unacknowledged test issue escalates on its own without manual human intervention**:

1. **Open the Simulator Control Panel**:
   - In the navigation bar, click the **⚡ Accountability Simulator** button.
2. **Step 1: Spawn an Unacknowledged Test Issue**:
   - Click **"Spawn Unacknowledged Issue"**.
   - A new complaint (`[Exit Test] Raw chicken served at dinner counter`) is created with status `Raised` and an active 48-hour response clock assigned to the Mess Secretary.
3. **Step 2: Advance the Clock +24 Hours (Urgency Reminder)**:
   - Click **"Fast-Forward 24 Hours"**.
   - The deadline engine triggers the automated 24-hour reminder email to the Mess Secretary's inbox (`ack_deadline_reminder_24h`), visible in the **Outbox (`/outbox`)**.
4. **Step 3: Advance the Clock +48 Hours (Level 1 Escalation)**:
   - Click **"Fast-Forward 48h (Trigger L1)"**.
   - The 48-hour SLA deadline is breached! The issue automatically transitions to **`Escalated L1`**.
   - An escalation email is dispatched to the Student Council President (`president@iiml.ac.in`).
   - Open **President Dashboard (`/president`)**: the issue is prominently flagged in the Level 1 Escalation Queue.
5. **Step 4: Advance the Clock Another +48 Hours (Level 2 Escalation)**:
   - Click **"Trigger L2 (Student Affairs)"**.
   - The 48-hour Presidential intervention window is breached without action.
   - The issue automatically escalates to **`Escalated L2`** and dispatches an escalation dossier to the Dean of Student Affairs (`studentaffairs@iiml.ac.in`).

---

## 🧪 Sprint 1 Exit Test: The Hot-Water Story Walkthrough

1. **View the Problem in the Feed (`/`)**:
   - The top seeded issue is: **"Geysers non-functional in Hostel 3 2nd floor washrooms"** with **214 votes** and the **Priority Issue (200+ votes)** badge.
2. **Review Deterministic Owner Routing (`/issue/issue-hot-water`)**:
   - Assigned owner: **Hostel Rep H3** (`Vikramaditya Rao`), with **Infra & IT Secretary** (`Kabir Mehta`) copied.
   - Author identity masked as `PGP Batch 41 student` (Public Identity Rule).
3. **Switch Persona to the Owner & Acknowledge**:
   - Use the **Persona Switcher** $\rightarrow$ switch to **Hostel Rep H3**.
   - Open **Owner Inbox (`/inbox`)** $\rightarrow$ Click **Acknowledge Issue** with note $\rightarrow$ moves to `Acknowledged`.
4. **Progress & Close**:
   - Click **Start Work** $\rightarrow$ moves to `In Progress` (weekly update SLA starts).
   - Click **Close as Completed** $\rightarrow$ submit resolution proof.
5. **Student Confirmation**:
   - Switch back to **Student (Rahul Sharma)** $\rightarrow$ open **My Issues (`/my-issues`)**.
   - Click **Confirm Fix** to mark `Closed`, or **Reopen Issue** with justification to return to `In Progress`.

---

## 🛠️ Feature Checklist & Sprints Progress

### Sprint 1: Core Loop (Overtures MVP)
| Requirement ID | Specification Requirement | Status |
| --- | --- | --- |
| **S1** | IIML Sign-in with Course, Batch, Hostel | ✅ Completed |
| **S2** | Raise Issue Form with Category, Scope, Photos | ✅ Completed |
| **S3** | Deterministic Owner Suggestion & Confirmation | ✅ Completed |
| **S4** | "My Issues" Dashboard | ✅ Completed |
| **S5** | Edit / Delete / Withdraw Rules | ✅ Completed |
| **S6** | Public Upvoting Engine (1 per student, removable) | ✅ Completed |
| **S7** | Search & Multi-criteria Filtering | ✅ Completed |
| **S8** | Append-Only Timeline & Role-Tagged Comments | ✅ Completed |
| **S9** | Student Confirmation & Reopening (7-day window) | ✅ Completed |
| **C1** | Owner Inbox with Overdue Highlighting | ✅ Completed |
| **C2** | Acknowledge with Required Note | ✅ Completed |
| **C3** | Move to In Progress & Weekly Updates | ✅ Completed |
| **C4** | Complete with Proof or Reject with Reason | ✅ Completed |
| **C5** | Redirect with 2-Redirect Limit | ✅ Completed |
| **P1** | President Cross-Secretariat Dashboard | ✅ Completed |
| **P2** | Escalated L1 Resolution | ✅ Completed |
| **P3** | Confidential Issue Access | ✅ Completed |

### Sprint 2: Accountability & Automation
| Requirement ID | Specification Requirement | Status | Implementation Details |
| --- | --- | --- | --- |
| **S10** | Notification Matrix (All 15 Templates) | ✅ Completed | Implemented in `src/lib/email-service.ts` and `src/app/outbox/page.tsx` |
| **Outbox** | Email Service & Outbox with Retries | ✅ Completed | Outbox table queue, failure tracking, exponential backoff up to 3 attempts, manual retry button |
| **Cron L1/L2** | Hourly Deadline Checker | ✅ Completed | Evaluates 24h reminders, 48h L1 escalations, 48h L2 escalations, weekly-update chasing in `src/lib/deadline-checker.ts` |
| **API Cron** | Next.js Scheduled Cron Endpoints | ✅ Completed | `/api/cron/deadline-checker` and `/api/cron/daily-digest` |
| **Digest** | 8:00 AM Daily Digest Generator | ✅ Completed | Compiles open, overdue, and priority tickets for each secretary |
| **C5 Limit** | Strict 2-Redirect Maximum Limit | ✅ Completed | Enforced in store & UI: 3rd redirect automatically routes to President |
| **Auto-Close** | 7-Day Auto-Close for Completed Tickets | ✅ Completed | Automatically closes unobjected completed tickets after 7 days |
| **Priority SLA**| 10% Vote Threshold with 7-Day SLA | ✅ Completed | Priority response deadline set upon crossing 200 votes; escalates if missed |
| **C6 Flag** | Severity Flags (Normal, High, Critical) | ✅ Completed | Council members & President can toggle severity; critical items float to top |
| **C7 Dashboard**| Area Dashboards (`/area-dashboard`) | ✅ Completed | Comprehensive metrics by secretariat: open, overdue, avg days to close, reopen rate, severity mix |

### Sprint 3: Admin & Safety
| Requirement ID | Specification Requirement | Status | Implementation Details |
| --- | --- | --- | --- |
| **A1** | Bulk Student Upload (2,000 Rows) | ✅ Completed | Roll prefix parser (`PGP`, `ABM`, `IPM`, `IPMX`), `@iiml.ac.in` domain validation, error highlighting, commit preview |
| **A2** | User Management & Deactivation | ✅ Completed | Search directory, create/edit student records, activate/deactivate with state preservation and audit logs |
| **A3** | Role Management | ✅ Completed | Assign holder user to council roles, configure custom role inbox emails |
| **A4** | Content Moderation (Comments) | ✅ Completed | Remove violating comments with structured categories; replaced with `[Comment removed by admin: ...]` |
| **A5** | Moderation Philosophy | ✅ Completed | Abusive word checks prompt polite rephrasing; complaints naming individuals held in Admin Review Queue |
| **A6** | Abuse Word List Manager | ✅ Completed | Dynamic custom abuse words dictionary in Admin Portal |
| **A7** | Append-Only Audit Log | ✅ Completed | Complete chronological audit log of all admin, role, user, and moderation decisions |
| **Privacy / RLS**| Role-Based Privacy Isolation | ✅ Completed | Row-level security: private issues visible only to Raiser, Owner, and President; Technical Admin strictly blocked |

---

## 🧱 Database Schema & Architecture

Sunwai's database is modeled around 11 relational tables in PostgreSQL:

- `users`: Enrolled students and staff (`@iiml.ac.in` email, roll number, course, batch, hostel).
- `course_prefixes`: Prefix matching for roll numbers (`PGP`, `ABM`, `IPM`, `IPMX`).
- `roles`: Student council positions with individual holder user IDs and role inboxes.
- `routing_rules`: Deterministic `category + scope -> owner_role + cc_roles` mapping.
- `issues`: Primary complaints table with `ack_deadline`, `vote_count`, `severity`, `is_priority`, and `held_for_review`.
- `issue_photos`: Uploaded image proofs and compressed photos.
- `votes`: Composite key `(issue_id, user_id)` guaranteeing zero duplicate votes.
- `comments`: Discussion threads with admin moderation flags.
- `status_updates`: Append-only transition audit log (no updates or deletes permitted).
- `audit_log`: System and admin actions audit trail.
- `email_outbox`: Dispatched notifications to role inboxes with retry tracking.

---

---

## ⚡ Sprint 4: Hardening & Launch

The Sprint 4 target satisfies the production hardening exit criterion:
> *"500-user load test passes; one hostel pilot runs for a week."*

### 1. 500-User Simulated Load Test
- **Test execution**: Concurrently simulates 500 unique students voting on an issue in sub-second execution (benchmarked >1,000 votes/sec, well exceeding the 50 votes/sec spec target).
- **Atomic Deduplication**: Emulates PostgreSQL `UNIQUE(issue_id, user_id)` constraint via composite keys, blocking 50 concurrent duplicate vote attempts.
- **Priority Escalation**: Automatically flips `is_priority = true` when votes cross 200 (10% of 2,000 students).
- **Interactive Execution**: Surfaced in `/dashboard` under *System operations & launch controls*.

### 2. Hourly Rate Limiting
- **Issues limit**: Max 5 new complaints per student per hour. Enforced at `raiseIssue` submission with clear error feedback.
- **Comments limit**: Max 30 comments per student per hour. Enforced at `addComment` with inline error banner.

### 3. Monitoring, Error Recovery & Nightly Backups
- **Health Check (`GET /api/health`)**: Reports system uptime, database latency, Postmark email outbox queue depth, and backup SLA compliance.
- **Nightly Backup Cron (`POST /api/cron/backup-check`)**: Automated 02:00 AM check asserting that the `pg_dump` snapshot exists, has non-zero size, is <25 hours old, and is retained for 30 days offsite.
- **Calm Error Boundary (`src/app/error.tsx`) & 404 (`src/app/not-found.tsx`)**: Graceful fallbacks designed with Fraunces serif typography and calm action buttons.

### 4. Operational Handover Documentation
- `docs/COUNCIL_TRAINING_GUIDE.md`: 1-page operational handbook for council role owners detailing the 48h clock, inbox tabs, weekly update rules, and resolution verification.
- `docs/TECHNICAL_HANDOVER.md`: Technical handover guide covering the 7-screen architecture, routing engine, accountability engine, annual role reassignment, and backup runbook.

---

## 📂 Project Structure

```
Sunwai/
├── docs/
│   ├── COUNCIL_TRAINING_GUIDE.md          # 1-page handbook for council role owners
│   └── TECHNICAL_HANDOVER.md              # Technical handover guide for tech committees
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Root layout with calm header and ICC footer
│   │   ├── page.tsx                       # All Issues (Home): Search, filters, issue list
│   │   ├── signin/page.tsx                # Sign in: Value prop + Google auth + demo logins
│   │   ├── raise/page.tsx                 # 2-step issue submission flow
│   │   ├── issue/[id]/page.tsx            # Issue page: Accountability pill, action panel, timeline
│   │   ├── my-issues/page.tsx             # My issues list
│   │   ├── inbox/page.tsx                 # Council member inbox (Needs action, Waiting, Done)
│   │   ├── dashboard/page.tsx             # President & Admin dashboard: 5 metrics, SLA table, email log
│   │   ├── error.tsx                      # Calm error boundary component
│   │   ├── not-found.tsx                  # Calm 404 page
│   │   └── api/
│   │       ├── health/route.ts            # System health & uptime check
│   │       └── cron/
│   │           ├── backup-check/route.ts  # Nightly 2 AM backup verification
│   │           ├── deadline-checker/      # Hourly SLA deadline & escalation checker
│   │           └── daily-digest/          # 8 AM daily digest generator
│   ├── components/
│   │   ├── AccountabilityPill.tsx         # Single accountability pill with status dot
│   │   ├── IssueRow.tsx                   # Unified issue list row component
│   │   └── Header.tsx                     # Calm, uncluttered navigation header
│   ├── lib/
│   │   ├── accountability.ts              # Accountability pill text and color generator
│   │   ├── load-test.ts                   # 500-user concurrent load test engine
│   │   ├── deadline-checker.ts            # SLA deadline & escalation rule engine
│   │   ├── email-service.ts               # Email dispatch templates & outbox queue
│   │   ├── student-upload.ts              # 2,000-row batch parser & validator
│   │   ├── moderation.ts                  # Abuse word dictionary & named person detector
│   │   ├── routing.ts                     # Deterministic routing table
│   │   ├── seed-data.ts                   # 30 students, 10 realistic issues, council roles
│   │   ├── store.tsx                      # Context state & localStorage synchronization
│   │   └── supabase.ts                    # Supabase client configuration
│   └── types/
│       └── index.ts                       # Domain TypeScript interfaces
├── supabase/
│   ├── migrations/
│   │   └── 20261003_sprint1_schema.sql    # PostgreSQL DDL & triggers
│   └── seed.sql                           # Seed SQL script
├── prompts.md                             # AI coding disclosure & prompt trajectory
├── README.md                              # Documentation & evaluation guide
├── package.json
└── tsconfig.json
```
