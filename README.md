# Sunwai (सुनवाई) — Student Council Issue-Tracking Portal
### Indian Institute of Management Lucknow · Overtures MVP (Sprint 1)

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

## 🧪 Sprint 1 Exit Test: The Hot-Water Story Walkthrough

The Sprint 1 exit test requires demonstrating the **hot-water story end-to-end**:

1. **View the Problem in the Feed (`/`)**:
   - The top seeded issue is: **"Geysers non-functional in Hostel 3 2nd floor washrooms"** with **214 votes** and the **Priority Issue (200+ votes)** badge.
   - Click the upvote button to see optimistic, one-student-one-vote toggling.
2. **Review Deterministic Owner Routing (`/issue/issue-hot-water`)**:
   - Notice the assigned owner: **Hostel Rep H3** (`Vikramaditya Rao`), with **Infra & IT Secretary** (`Kabir Mehta`) copied.
   - Public students see the author as `PGP Batch 41 student` (Public Identity Rule).
3. **Switch Persona to the Owner**:
   - Click the **Persona Switcher** in the top navigation bar.
   - Select **Hostel Rep H3 (Vikramaditya Rao)**.
4. **Take Owner Action in Owner Inbox (`/inbox`)**:
   - Open **Owner Inbox**. The hot water issue appears under assigned items with its 48-hour SLA deadline.
   - Click **Acknowledge Issue**, enter an inspection note, and confirm.
   - The status updates to `Acknowledged` and an email is dispatched to the student (viewable in the **Simulated Outbox** modal).
5. **Start Work & Post Progress**:
   - Click **Start Work** $\rightarrow$ moves to `In Progress` and schedules the 7-day weekly update SLA.
   - Click **Post Progress Update** to post interim notes to the append-only timeline.
6. **Mark as Completed with Proof**:
   - Click **Close as Completed**, enter the resolution details and attach a proof photo URL.
   - Status moves to `Completed`, opening a 7-day review window for the student.
7. **Student Verification & Confirmation**:
   - Switch persona back to **Student (Rahul Sharma)**.
   - Navigate to **My Issues (`/my-issues`)** or open the ticket.
   - Notice the resolution banner: click **Confirm Fix** to formally close the ticket as `Closed`, or test **Reopen Issue** to send it back to `In Progress` with a `Reopened by Student` badge.
8. **Test System Deadline Escalations**:
   - Click the **⚡ Run Deadline Check** button in the header.
   - Any ticket exceeding the 48-hour acknowledgment deadline (such as the Chintan Auditorium microphone issue) automatically escalates to **Escalated L1** on the **President Dashboard (`/president`)**.

---

## 🛠️ Sprint 1 Deliverables & Feature Checklist

| Requirement ID | Specification Requirement | Status | Implementation Details |
| --- | --- | --- | --- |
| **S1** | IIML Sign-in with Course, Batch, Hostel | ✅ Completed | Google login validation with `@iiml.ac.in` domain lock + interactive persona switcher |
| **S2** | Raise Issue Form with Category, Scope, Photos | ✅ Completed | 9 categories, 3 scopes, up to 3 photo attachments, public/private toggle |
| **S3** | Deterministic Owner Suggestion & Confirmation | ✅ Completed | Lookup table computation (`category + scope + hostel`), conflict-of-interest checks, President override |
| **S4** | "My Issues" Dashboard | ✅ Completed | Displays all tickets raised by user with live statuses, timelines, and private issues |
| **S5** | Edit / Delete / Withdraw Rules | ✅ Completed | Can edit/delete only before votes/acknowledgment; withdraw after votes |
| **S6** | Public Upvoting Engine | ✅ Completed | One vote per student, removable, with priority flame trigger at 200+ votes |
| **S7** | Search & Multi-criteria Filtering | ✅ Completed | Instant keyword search, category pills, status filters, hostel filters, sort by votes/newest |
| **S8** | Append-Only Timeline & Role-Tagged Comments | ✅ Completed | Status history audit trail and discussion threads with official council officer badges |
| **S9** | Student Confirmation & Reopening | ✅ Completed | 7-day post-completion review window to confirm fix or reopen with justification |
| **C1** | Owner Inbox with Overdue Highlighting | ✅ Completed | Filter by assigned, unacknowledged, in-progress, and overdue 48h breaches |
| **C2** | Acknowledge with Required Note | ✅ Completed | Clears 48h SLA timer, notifies student via email outbox |
| **C3** | Move to In Progress & Weekly Updates | ✅ Completed | Enforces 7-day update schedule with optional photo proofs |
| **C4** | Complete with Proof or Reject with Reason | ✅ Completed | Requires resolution proof or structured rejection reason |
| **C5** | Redirect with 2-Redirect Limit | ✅ Completed | Restarts 48h SLA clock; 3rd redirect automatically escalates to President |
| **P1** | President Cross-Secretariat Dashboard | ✅ Completed | Campus-wide KPI cards, breakdown table of all 9 secretariats and hostels |
| **P2** | Escalated L1 Resolution | ✅ Completed | President can reassign or assume direct ownership of breached tickets |
| **P3** | Confidential Issue Access | ✅ Completed | President has visibility into private and conduct complaints |

---

## 🧱 Database Schema & Architecture

Sunwai's database is modeled around 11 relational tables in PostgreSQL:

- `users`: Enrolled students and staff (`@iiml.ac.in` email, roll number, course, batch, hostel).
- `course_prefixes`: Prefix matching for roll numbers (`PGP`, `ABM`, `IPM`, `IPMX`).
- `roles`: Student council positions with individual holder user IDs and role inboxes.
- `routing_rules`: Deterministic `category + scope -> owner_role + cc_roles` mapping.
- `issues`: Primary complaints table with `ack_deadline`, `vote_count`, and `is_priority`.
- `issue_photos`: Uploaded image proofs and compressed photos.
- `votes`: Composite key `(issue_id, user_id)` guaranteeing zero duplicate votes.
- `comments`: Discussion threads with admin moderation flags.
- `status_updates`: Append-only transition audit log (no updates or deletes permitted).
- `audit_log`: System and admin actions audit trail.
- `email_outbox`: Dispatched notifications to role inboxes with retry tracking.

SQL Migration file: `supabase/migrations/20261003_sprint1_schema.sql`  
SQL Seed file: `supabase/seed.sql`

---

## 🛡️ Privacy & Safeguards

- **Public Identity Masking:** General students browsing the public feed see only course and batch (e.g. `PGP 41 student`). Full names and roll numbers are visible solely to the assigned owner and the President.
- **Sensitive Case Interceptor:** Inquiries or complaints regarding harassment, ragging, or medical emergencies trigger an immediate interceptor showing official contacts for the Internal Complaints Committee (ICC), Chief Security Officer, and Campus Medical Officer. Nothing sensitive is stored.
- **Conflict of Interest Handling:** Conduct complaints against council members route directly to the President. Complaints regarding the President route to Student Affairs. Self-assignment is blocked.

---

## 👥 Roles Seeded for Evaluation

| Name | Role | Test Focus |
| --- | --- | --- |
| **Rahul Sharma** | Student (Hostel 3) | Raising issues, upvoting, confirming/reopening fixes |
| **Vikramaditya Rao** | Hostel Rep H3 | Owning the 214-vote H3 Hot Water issue, resolving tickets |
| **Kabir Mehta** | Infra & IT Secretary | Owning campus infrastructure, copied on hostel repairs |
| **Ananya Sen** | Mess Secretary | Resolving food hygiene and night canteen tickets |
| **Ashwin Narayan** | Student Council President | Handling Escalated L1 tickets and campus-wide oversight |
| **Tech Admin** | Tech Committee Admin | System audit trail and roll prefix administration |

---

## 📂 Project Structure

```
Sunwai/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout with SunwaiProvider & Navbar
│   │   ├── page.tsx           # Public Feed & Discovery (S6, S7)
│   │   ├── raise/page.tsx     # Raise Issue Wizard (S2, S3)
│   │   ├── issue/[id]/page.tsx# Issue Detail, Timeline & Actions (S8, C2-C5)
│   │   ├── my-issues/page.tsx # Student Issues & Confirmation/Reopen (S4, S5, S9)
│   │   ├── inbox/page.tsx     # Owner Inbox (C1-C5)
│   │   ├── president/page.tsx # President Dashboard (P1-P3)
│   │   └── globals.css
│   ├── components/
│   │   ├── Navbar.tsx         # Top navigation & demo controls
│   │   ├── IssueCard.tsx      # Upvote card with masked identity
│   │   ├── Timeline.tsx       # Append-only status progression
│   │   ├── CommentSection.tsx # Threaded discussion with role badges
│   │   ├── PersonaSwitcherModal.tsx # Fast role impersonation
│   │   └── EmailOutboxModal.tsx     # Simulated notification dispatch log
│   ├── lib/
│   │   ├── routing.ts         # Deterministic routing table
│   │   ├── seed-data.ts       # 30 students, 10 realistic issues, council roles
│   │   ├── store.tsx          # Context state & localStorage synchronization
│   │   └── supabase.ts        # Supabase client configuration
│   └── types/
│       └── index.ts           # Domain TypeScript interfaces
├── supabase/
│   ├── migrations/
│   │   └── 20261003_sprint1_schema.sql # PostgreSQL DDL & triggers
│   └── seed.sql               # Seed SQL script
├── prompts.md                 # AI coding disclosure & prompt trajectory
├── README.md                  # Documentation & evaluation guide
├── package.json
└── tsconfig.json
```
