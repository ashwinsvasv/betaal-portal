# Sunwai Technical Handover & System Runbook

This document serves as the technical handover guide for incoming student technology committees maintaining and operating the Sunwai platform at IIM Lucknow.

---

## 1. System Overview & Tech Stack
- **Framework**: Next.js 14 (App Router) with React 18 and TypeScript.
- **Styling**: Tailwind CSS adhering to the calm, uncluttered design token system:
  - Background: `#f4f6f9`, Panels: `#ffffff`, Line borders: `#dde2ea`
  - Text: Primary `#16213e`, Muted `#5b6478`
  - Accents: Blue `#2f45c5`, Green `#17734a`, Amber `#9a5506`, Red `#b42318`
  - Typography: Fraunces (serif) for titles/metrics; Inter for UI and body text.
- **Persistence**: Emulated relational store (`src/lib/store.tsx`) with zero-config client persistence (`localStorage`) and fully structured PostgreSQL 16 relational schema ready for external database connection.
- **Zero-config execution**: Runs standalone via `npm run dev` or `npm run build` without mandatory external database or redis dependencies.

---

## 2. Core Architecture & Screens
The platform strictly contains **7 consolidated screens**:
1. `/signin`: Left value proposition, right IIML Google OAuth + instant demo persona selector.
2. `/`: Public feed with category filter, open/resolved toggle, newest/most voted toggle, and `<IssueRow />` listing.
3. `/raise`: Clean 2-step issue submission flow (Step 1: Description; Step 2: Routing confirmation & President bypass).
4. `/issue/[id]`: Detailed view with single `<AccountabilityPill />`, timeline, action panel, discussion comments, and narrow right sidebar.
5. `/my-issues`: Student's raised tickets using the unified issue row component.
6. `/inbox`: Council member action queue with 3 tabs (*Needs action*, *Waiting on student*, *Done*).
7. `/dashboard`: Executive view for President and Tech Admin (5 key metrics in one row, overdue attention queue, owner SLA breakdown table, email dispatch log, and collapsed Sprint 4 hardening operations).

---

## 3. Core Business & Accountability Engines
- **Routing Engine (`src/lib/routing.ts`)**:
  - Deterministically evaluates `(Category, Scope, Hostel)` and returns primary owner role and CC role IDs.
  - Automatically handles user-as-owner edge cases (fallback to President).
- **Accountability Engine (`src/lib/accountability.ts`)**:
  - Generates the singular colored accountability pill with bullet point and deadline status.
  - Formats SLA states: 48h acknowledgment, overdue L1/L2, in-progress 7-day cadence, 7-day student confirmation window.
- **Deadline Checker & Automation (`src/lib/deadline-checker.ts`)**:
  - `runComprehensiveDeadlineCheck(offsetHours)`: Identifies unacknowledged tickets past 48h/96h and auto-escalates (L1 -> President, L2 -> Dean). Auto-closes confirmed/fixed tickets past 7 days.
  - Cron APIs: `/api/cron/deadline-checker`, `/api/cron/daily-digest`, `/api/cron/backup-check`.
- **Content Moderation (`src/lib/moderation.ts`)**:
  - Regex-based harassment and name-targeting scanner. Held issues require manual administrator review before appearing in public feeds.
- **Privacy Isolation Enforcement (`src/lib/store.tsx`)**:
  - Strict rule: Tech administrators are **strictly prohibited** from viewing private complaints (`canUserViewIssue`). Only the raiser, assigned owner, and Council President have read access.
- **Rate Limiting**:
  - Maximum 5 new issues and 30 comments per student per hour. Enforced at submission boundaries.
- **Load Test Runner (`src/lib/load-test.ts`)**:
  - Simulates 500 concurrent voters with composite key deduplication, sub-second execution, and 10% (200 vote) priority escalation.

---

## 4. Annual Council Handover Runbook
At the start of each academic year when the new student council takes office:
1. **Never alter source code for role handovers**.
2. Go to the Admin management console / database:
   - Create new `User` records for incoming representatives (or bulk upload via CSV parser).
   - Update `CouncilRole.holder_user_id` and `CouncilRole.inbox_email` to point to the incoming student.
3. Open tickets automatically flow into the new council members' inboxes without data loss or ticket reassignment.

---

## 5. Operations, Health & Backups
- **Health check endpoint**: `GET /api/health`
  - Validates service status, database latency, outbox queue, and last backup timestamp.
- **Nightly backup check**: `POST /api/cron/backup-check` (Scheduled at 02:00 UTC)
  - Asserts daily `pg_dump` exists, is non-zero in size, and is less than 25 hours old. Retained for 30 days offsite.
- **Email Service**: Uses transactional Postmark SMTP. If email provider is temporarily unreachable, notifications queue in the outbox table with automatic retry.
