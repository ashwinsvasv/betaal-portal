# Sunwai (सुनवाई) — Student Council Issue-Tracking Portal
### Indian Institute of Management Lucknow · Sprints 1 & 2 Complete

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

---

## 🧱 Database Schema & Architecture

Sunwai's database is modeled around 11 relational tables in PostgreSQL:

- `users`: Enrolled students and staff (`@iiml.ac.in` email, roll number, course, batch, hostel).
- `course_prefixes`: Prefix matching for roll numbers (`PGP`, `ABM`, `IPM`, `IPMX`).
- `roles`: Student council positions with individual holder user IDs and role inboxes.
- `routing_rules`: Deterministic `category + scope -> owner_role + cc_roles` mapping.
- `issues`: Primary complaints table with `ack_deadline`, `vote_count`, `severity`, and `is_priority`.
- `issue_photos`: Uploaded image proofs and compressed photos.
- `votes`: Composite key `(issue_id, user_id)` guaranteeing zero duplicate votes.
- `comments`: Discussion threads with admin moderation flags.
- `status_updates`: Append-only transition audit log (no updates or deletes permitted).
- `audit_log`: System and admin actions audit trail.
- `email_outbox`: Dispatched notifications to role inboxes with retry tracking.

---

## 📂 Project Structure

```
Sunwai/
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Root layout with SunwaiProvider & Navbar
│   │   ├── page.tsx                       # Public Feed & Discovery (S6, S7)
│   │   ├── raise/page.tsx                 # Raise Issue Wizard (S2, S3)
│   │   ├── issue/[id]/page.tsx            # Issue Detail, Timeline, C6 Severity & C5 Redirect
│   │   ├── my-issues/page.tsx             # Student Issues & Confirmation/Reopen (S4, S5, S9)
│   │   ├── inbox/page.tsx                 # Owner Inbox (C1-C5)
│   │   ├── area-dashboard/page.tsx        # Secretariat Area Performance Dashboard (C7)
│   │   ├── outbox/page.tsx                # Outbox & Notification Center with Retries (S10)
│   │   ├── president/page.tsx             # President Dashboard (P1-P3)
│   │   ├── api/cron/deadline-checker/     # Hourly Deadline Checker Cron API
│   │   └── api/cron/daily-digest/         # 8 AM Daily Digest Cron API
│   ├── components/
│   │   ├── Navbar.tsx                     # Top navigation & demo controls
│   │   ├── IssueCard.tsx                  # Upvote card with severity and identity masking
│   │   ├── Timeline.tsx                   # Append-only status progression
│   │   ├── CommentSection.tsx             # Threaded discussion with role badges
│   │   ├── PersonaSwitcherModal.tsx       # Fast role impersonation
│   │   ├── EmailOutboxModal.tsx           # Quick email drawer modal
│   │   └── DeadlineControlModal.tsx       # Time-travel & escalation simulator
│   ├── lib/
│   │   ├── deadline-checker.ts            # SLA deadline & escalation rule engine
│   │   ├── email-service.ts               # Email dispatch templates & outbox queue
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
