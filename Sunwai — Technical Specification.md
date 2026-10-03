# Sunwai — Technical Specification

Student Council issue-tracking portal, IIM Lucknow · Oct 3, 2026 · @Ashwin

## Overview

Sunwai gives every student complaint at IIM Lucknow an owner, a deadline and a public status, so no issue can be silently ignored. Sunwai is Hindi for "a hearing".

**The problem.** Students raise issues through WhatsApp groups, emails, Google Forms and hallway conversations. None of these assigns an owner, tracks progress or forces a reply. A request for hot water got 200+ votes and still went nowhere, because no formal mechanism existed. Each new council also starts from zero, since nothing is recorded.

**What Sunwai does.**

- Students raise an issue (public or private), with photos. The system suggests who owns it, and the student confirms.
- The owner is emailed and has 48 hours to acknowledge. If they don't, the issue escalates to the President, then to Student Affairs.
- Public issues can be upvoted, searched and discussed, so the council sees what matters most to the most people.
- Owners must post weekly updates and close issues with proof or a reason. The student can reopen an issue that isn't actually fixed.

**Success metrics (first term after launch).**

| Metric | Target | Why it matters |
| --- | --- | --- |
| Issues acknowledged within 48 hours | 90% | Shows owners are responding, not ignoring |
| Median days from raised to closed | Under 14 | Shows issues actually get resolved |
| Share of closed issues reopened by students | Under 10% | Shows "completed" means really fixed |
| Students who log in at least once | 60% of enrolled | Shows the portal is the real channel, not a side option |

**In scope:** complaints under the Student Council's domain, including mess, infrastructure and IT, hostels, academics, sports, events, cultural and finance.

**Out of scope:** sexual harassment and safety cases, which belong to the Internal Complaints Committee (ICC) by law; medical emergencies; and grade disputes handled by the academic office. The portal points students to the right body for these instead of storing them.

## Users, roles and permissions

There are six roles. Permissions attach to the **role**, not the person, so when a new council takes office the admin just reassigns who holds each role and every open issue moves with it.

| Role | Who holds it | Main job in Sunwai |
| --- | --- | --- |
| Student | Every enrolled student | Raise, vote, search, comment, confirm or reopen fixes |
| Hostel rep | One per hostel block | Owns small, single-hostel issues; the Infra & IT Secretary is copied |
| Cabinet member | Academic, Events, Sports, Infra & IT, Mess, Cultural Secretaries; Treasurer | Owns issues in their area: acknowledge, update, close, redirect |
| President | Student Council President | Owns escalations and conflict-of-interest cases; sees everything |
| Student Affairs | Institute staff (email only in v1) | Receives second-level escalations |
| Admin | Tech committee member appointed by the council | Manages users and roles; moderates comments |

Council members are also students, so they keep all student abilities.

**Permissions matrix**

| Action | Student | Hostel rep | Cabinet member | President | Admin |
| --- | --- | --- | --- | --- | --- |
| Raise an issue, vote, comment | Yes | Yes | Yes | Yes | No |
| Edit or delete own issue (before any vote or acknowledgment) | Yes | Yes | Yes | Yes | No |
| Withdraw own issue (after that point) | Yes | Yes | Yes | Yes | No |
| See public issues | Yes | Yes | Yes | Yes | Yes |
| See private issues | Own only | Assigned only | Assigned only | All | No |
| Update status on assigned issues | No | Yes | Yes | Yes | No |
| Redirect an issue | No | Yes | Yes | Yes | No |
| Set severity flag | No | No | Yes | Yes | No |
| See area dashboard | No | Own hostel | Own area | All areas | All areas |
| Create, edit, deactivate users; bulk upload | No | No | No | No | Yes |
| Assign people to roles | No | No | No | No | Yes |
| Remove a comment (marked "removed by admin") | No | No | No | No | Yes |
| Delete an issue | No | No | No | No | No |

Nobody can delete an issue once it is public and has a vote or an acknowledgment. The admin cannot read private issues, because admin is a technical role, not a decision-making one.

## Core user flows

Six flows cover the whole product. Each ends with a database record and, where someone needs to act, an email.

**1. Raise an issue (student)**

1. Sign in with an IIML Google account.
2. Choose a category (Mess, Infra & IT, Hostel, Academics, Sports, Events, Cultural, Finance, Other) and a scope (my room, my hostel, whole campus).
3. If the category is sensitive (harassment, safety, health), the portal shows ICC, counsellor and emergency contacts and stops. Nothing is stored.
4. Write a title. While typing, the portal shows up to 5 similar open public issues with an "Upvote instead" button.
5. Add details and up to 3 photos, then choose public or private.
6. The abuse check runs. If it finds abusive words, the student is asked to rephrase. If text targets a named person, the issue is held for admin review instead of being posted.
7. The portal shows the suggested owner (for example, "Hostel Rep, Hostel 3, with Infra & IT Secretary copied"). The student confirms or picks "Not sure, send to President".
8. On confirmation the issue is saved as Raised, the 48-hour clock starts, and the owner's role inbox is emailed.

**2. Acknowledge and resolve (owner)**

1. The owner opens the issue from the email link or their inbox.
2. Within 48 hours they acknowledge it with a short note. The status becomes Acknowledged.
3. When work starts they move it to In Progress. While it stays there, an update is due every 7 days.
4. To close, they choose Completed (note plus at least one photo or a description of the fix) or Rejected (reason required, chosen from a list plus free text).

**3. Redirect (owner)**

1. If the issue is outside their area, the owner picks the right role or Student Affairs and writes a reason.
2. The new owner is emailed, the student is notified, and the 48-hour clock restarts.
3. Each issue can be redirected at most twice. A third redirect goes to the President automatically, so issues can't bounce around forever.

**4. Escalate (system)**

1. If the owner misses the 48-hour acknowledgment, the issue moves to Escalated L1 and the President is emailed.
2. If the President doesn't act within 48 more hours, it moves to Escalated L2 and Student Affairs is emailed.
3. A missed weekly update sends a reminder first, then escalates to the President after 3 more days.

**5. Confirm or reopen (student)**

1. When an issue is marked Completed, the student who raised it is emailed and has 7 days to confirm or reopen it with a reason.
2. Reopening sends it back to In Progress with the same owner and adds a visible "reopened" mark.
3. No response in 7 days means it closes automatically.

**6. Vote, search and comment (any student)**

1. Students browse or search public issues by keyword, category, status or hostel.
2. One upvote per student per issue, which can be removed.
3. Crossing 10% of enrolled students in votes marks the issue Priority. The owner must then post a public response within 7 days, and it appears at the top of the President's dashboard.
4. Comments form a thread under the issue. Owners' comments are labelled with their role.

## Issue lifecycle

Every issue moves through a fixed set of statuses, and only certain moves are allowed. Timers (mainly 48 hours to acknowledge and 7 days between updates) push issues forward, so nothing can sit still unnoticed.

&#91;embedded content: issue lifecycle · 7 statuses, 2 timers\]

A missed deadline sends an issue to Escalated; once someone is assigned, it rejoins the main path. Two side paths aren't drawn: **Redirected** (a new owner, the 48-hour clock restarts) and **Withdrawn** (the student pulls it after votes; it stays visible).

| Timer | Starts when | Length | If missed |
| --- | --- | --- | --- |
| Acknowledgment | Issue raised or redirected | 48 hours | Escalated L1 to the President |
| President action | Issue escalated to L1 | 48 hours | Escalated L2 to Student Affairs |
| Progress update | Issue moves to In Progress, or last update | 7 days | Reminder, then escalation after 3 more days |
| Priority response | Votes cross 10% of students | 7 days | Escalated L1 to the President |
| Student confirmation | Issue marked Completed | 7 days | Auto-closes as Closed |

## Routing rules

Routing is a lookup table, not AI: category plus scope gives one owner role and optional copied roles. The admin can edit the table without touching code, and the student always confirms the suggestion before anything is sent.

| Category | My room / my hostel | Whole campus |
| --- | --- | --- |
| Infra & IT (water, power, Wi-Fi, furniture) | Hostel Rep (that hostel), Infra & IT Secretary copied | Infra & IT Secretary |
| Hostel life (cleaning, noise, common rooms) | Hostel Rep (that hostel), Infra & IT Secretary copied | Infra & IT Secretary |
| Mess and food | Mess Secretary | Mess Secretary |
| Academics | Academic Secretary | Academic Secretary |
| Sports facilities and events | Sports Secretary | Sports Secretary |
| Events | Events Secretary | Events Secretary |
| Cultural | Cultural Secretary | Cultural Secretary |
| Finance and reimbursements | Treasurer | Treasurer |
| Other / not sure | President | President |

The student's hostel comes from their profile, so "my hostel" routes to the right rep without asking.

**Conflict-of-interest rules**

- A checkbox, "This is about a council member's conduct", routes the issue to the President and makes it private.
- If the issue is about the President, it goes to Student Affairs by email.
- An owner cannot be assigned an issue they raised themselves. It goes to the President instead.

**Redirect limits**

- Owners can redirect to any role or to Student Affairs, with a required reason.
- After 2 redirects, the next one goes to the President, who must keep it or assign it for good.

## Functional requirements by role

Each requirement has an ID so sprints and tests can point to it. Priority: P0 = must have for launch, P1 = should have, P2 = later.

**Student**

| ID | Requirement | Priority |
| --- | --- | --- |
| S1 | Sign in with IIML Google account; profile shows name, roll number, course, batch and hostel | P0 |
| S2 | Raise an issue with category, scope, title, details, up to 3 photos and public/private choice | P0 |
| S3 | See and confirm the suggested owner before submitting | P0 |
| S4 | "My issues" page listing everything they raised, with status and timeline | P0 |
| S5 | Edit or delete an issue until the first vote or acknowledgment; after that, withdraw only; edits after votes are shown with history | P0 |
| S6 | Upvote public issues (one per issue, removable) | P0 |
| S7 | Search public issues by keyword, filter by category, status, hostel; sort by votes or newest | P0 |
| S8 | Comment on public issues in a thread | P0 |
| S9 | Confirm or reopen an issue within 7 days of it being marked Completed | P0 |
| S10 | Email when their issue changes status or gets an owner comment | P1 |
| S11 | Duplicate suggestions while typing a title | P1 |
| S12 | Follow an issue raised by someone else to get its updates | P2 |

**Public identity rule:** on public issues and comments, other students see only course and batch (for example "PGP 42 student"). The assigned owner and the President see the full name and roll number. Council members' comments show their role.

**Cabinet member and hostel rep**

| ID | Requirement | Priority |
| --- | --- | --- |
| C1 | Inbox of assigned issues, sortable by votes, age and deadline, with overdue ones highlighted | P0 |
| C2 | Acknowledge with a note | P0 |
| C3 | Move to In Progress; post weekly updates with optional photos | P0 |
| C4 | Close as Completed (proof required) or Rejected (reason required) | P0 |
| C5 | Redirect to another role or Student Affairs with a reason | P0 |
| C6 | Set severity (Normal, High, Critical) on assigned issues | P1 |
| C7 | Area dashboard: open count, overdue count, average days to close | P1 |
| C8 | Merge a duplicate into an existing issue, moving its votes across | P2 |

**President**

| ID | Requirement | Priority |
| --- | --- | --- |
| P1 | Dashboard across all areas: open, overdue, escalated and priority issues by owner | P0 |
| P2 | Handle Escalated L1 issues: take ownership or reassign with a deadline | P0 |
| P3 | See all private issues | P0 |
| P4 | Monthly "You said, we did" summary, exportable to share with students | P1 |

**Admin**

| ID | Requirement | Priority |
| --- | --- | --- |
| A1 | Upload an Excel or CSV of students; preview rows and errors before saving | P0 |
| A2 | Create, edit and deactivate individual users (deactivated users keep their history) | P0 |
| A3 | Assign people to roles and set each role's inbox email | P0 |
| A4 | Remove abusive comments; they show as "Removed by admin" with a reason category | P0 |
| A5 | Review issues held by the abuse check: approve or reject with a note | P0 |
| A6 | Edit the routing table and the abuse word list | P1 |
| A7 | View the audit log of all admin actions | P1 |

## Data model

Eleven tables in one Postgres database. The two most important design choices: **status\_updates** is an append-only log, so history can't be rewritten, and **votes** has a uniqueness rule, so double-voting is impossible even if someone clicks fast.

| Table | What one row is | Key fields | Rules that protect it |
| --- | --- | --- | --- |
| users | One student or staff member | id, roll\_no, name, email, course, batch, hostel, is\_active | roll\_no and email unique; email must end in @iiml.ac.in |
| course\_prefixes | One roll-number pattern | prefix (PGP, ABM, IPM, IPMX…), course\_name | Used once at upload to fill course and batch |
| roles | One council position | id, name ("Mess Secretary", "Hostel Rep H3"), inbox\_email, holder\_user\_id | One current holder per role |
| routing\_rules | One category + scope pair | category, scope, owner\_role\_id, cc\_role\_ids | One rule per pair |
| issues | One complaint | id, raised\_by, title, details, category, scope, hostel, visibility, status, severity, owner\_role\_id, ack\_deadline, next\_update\_due, vote\_count, redirect\_count, is\_priority, created\_at | Never hard-deleted once public with a vote or acknowledgment |
| issue\_photos | One uploaded image | issue\_id, update\_id (optional), storage\_path | Max 3 per issue or update; max 2 MB each after compression |
| votes | One student's upvote | issue\_id, user\_id, created\_at | Unique on (issue\_id, user\_id) |
| comments | One comment | id, issue\_id, author\_id, body, removed\_by\_admin, removal\_reason | Removed comments keep their row; text is hidden |
| status\_updates | One change to an issue | issue\_id, actor\_id, from\_status, to\_status, note, created\_at | Insert-only; no edits or deletes allowed |
| audit\_log | One admin action | actor\_id, action, target, details, created\_at | Insert-only; visible to the President |
| email\_outbox | One email waiting to be sent | recipient, template, issue\_id, status, attempts, sent\_at | Retried up to 3 times; failures shown to admin |

**How the roll number becomes a tag.** At upload, PGP42069 is split into prefix PGP (looked up as the PGP programme) and batch 42. Because ABM22045 follows a different pattern, the prefix table is matched first and the digits after it give the batch. Rows that don't match any prefix are flagged in the upload preview instead of being guessed.

**Why vote\_count is stored on the issue.** Counting votes live on every page load gets slow as votes grow. A database trigger adds or subtracts 1 on each vote, so the feed reads one number.

## System architecture and tech stack

Sunwai runs on two hosted services, Vercel for the app and Supabase for data, so there are no servers to manage and the whole stack is free at campus scale.

&#91;embedded content: system architecture · 2 hosted services, 1 email service\]

The app handles screens and checks every action; the database stores everything and refuses anything the rules don't allow; scheduled jobs chase deadlines and send email.

| Layer | Choice | Why this one |
| --- | --- | --- |
| Front end and server | Next.js (React), TypeScript | One codebase for screens and server logic; AI coding tools handle it well |
| Styling | Tailwind CSS | Fast to build clean, mobile-friendly screens |
| Hosting | Vercel | Free tier, deploys on every code push, one-click rollback |
| Database | Supabase Postgres | Real relational database; rules like "one vote per student" live in the data itself |
| Login | Supabase Auth with Google | Students already have IIML Google accounts; no passwords to store |
| File storage | Supabase Storage | Photos stay next to the data, with access rules |
| Scheduled jobs | Vercel Cron | Runs the hourly and daily jobs without a separate server |
| Email | Resend | Simple API, free tier enough for campus volumes |
| Errors | Sentry | Alerts on crashes |
| AI coding tool | Claude Code (disclosed in prompts.md) | Brief requires naming the tool used |

**Environments.** A preview site for every change, a staging site for council testing, and the production site. Secrets (database keys, email key) live in Vercel's environment settings, never in the code.

## Authentication, authorization and privacy

Only enrolled IIML students can get in, and each person is exactly one account. Authorization is enforced inside the database, so even a buggy screen can't show someone data they aren't allowed to see.

**Login (authentication: proving who you are)**

1. The student clicks "Sign in with Google". Google confirms the email and password; Sunwai never sees or stores a password.
2. Sunwai rejects any email not ending in @iiml.ac.in.
3. It then checks the email against the uploaded student list. If the student isn't on it, or is deactivated, sign-in fails with "Contact the council admin".
4. A session lasts 7 days, then the student signs in again.

**Access rules (authorization: what you're allowed to do)**

- Every table has row-level security: rules in the database that decide which rows each signed-in user can read or change. For example, a private issue is readable only by its raiser, its current owner role's holder and the President.
- Status changes go through a server function that checks the actor holds the owner role and that the transition is allowed (you can't jump from Raised to Completed).
- Admin actions are written to the audit log in the same step as the action, so they can't be done without a record.

**Privacy**

- Public issues show course and batch only. Names and roll numbers are visible to the owner and the President.
- Photos of private issues sit in a private storage bucket and are shown through links that expire after 1 hour.
- Sensitive categories are never stored; the portal shows ICC, counsellor and emergency contacts.
- When a student graduates, their account is deactivated. Their public issues stay as history, with the identity tag kept as course and batch.
- Data is stored with Supabase in its Mumbai region, which keeps student data in India.

## Notifications and scheduled jobs

Email is the only notification channel in v1, because every student and role already has an inbox. Emails go to **role inboxes** (for example mess.sec@…) so they survive council changes.

| Event | Who is emailed | Contains |
| --- | --- | --- |
| Issue raised | Owner role inbox; copied roles | Title, scope, photos link, deadline |
| Redirected | New owner; the student | Reason, new deadline |
| Acknowledged, updated, completed, rejected | The student | Status, note, link to confirm or reopen |
| 24 hours before acknowledgment deadline | Owner | Reminder |
| Escalated L1 | President; original owner copied | Issue, how long it waited |
| Escalated L2 | Student Affairs; President copied | Issue, its full timeline |
| Priority threshold crossed | Owner; President | Vote count, 7-day response deadline |
| Weekly update overdue | Owner | Reminder; escalates after 3 more days |
| Daily digest (8 am) | Each owner with open issues | Their open, overdue and new items |

**Scheduled jobs**

- **Deadline checker, every hour:** finds issues past their acknowledgment or update deadline and escalates them, sends reminders, and auto-closes Completed issues the student didn't respond to within 7 days.
- **Daily digest, 8 am IST:** one email per owner instead of many small ones.
- **Nightly backup check, 2 am:** confirms the database backup ran and alerts the admin if it didn't.

**Reliability.** Emails are written to an outbox table first, then sent by a background worker that retries up to 3 times. If the email service is down, nothing is lost; emails go out when it recovers. Each job only touches rows that still need action, so running it twice by accident does no harm.

## Moderation and integrity safeguards

Every power in Sunwai is checked by someone else, and every action leaves a record. The table lists the ways the system could be gamed and what stops each one.

| Risk | What could happen | Safeguard |
| --- | --- | --- |
| Burying complaints | An owner ignores or quietly closes an issue | 48-hour escalation; closing needs proof or a reason; the student can reopen |
| Pressure to delete | A student is pushed to delete an inconvenient issue | Deletion only before any vote or acknowledgment; after that it can only be withdrawn and stays visible |
| Changing an issue after votes | The text is edited so votes appear to back something else | Edits after the first vote are shown with their history |
| Fake votes | One person votes many times | IIML-only login; one vote per student per issue, enforced by the database |
| Abuse in complaints | Insults or targeted attacks | Word-list check asks the student to rephrase; text naming a person is held for admin review; a human decides on any Senate referral |
| Abuse in comments | Harassment in threads | Admin removes the comment; it shows "Removed by admin" with a reason category, never silently |
| Admin overreach | The admin removes fair criticism | All admin actions go to an insert-only audit log the President can see; the admin cannot delete issues or read private ones |
| Conflict of interest | A complaint about a council member reaches that member | Conduct checkbox routes it to the President; complaints about the President go to Student Affairs |
| Popularity over need | A serious issue affecting few people never gets votes | Owners and the President set severity; Critical issues sit at the top of dashboards whatever their votes |
| Endless redirects | Owners pass an issue around | After 2 redirects the President must keep or assign it |

**Why the abuse check doesn't auto-discard.** A frustrated complaint like "the water has been cold for 3 weeks, this is ridiculous" is valid. Throwing it away, or reporting the student, would teach people not to complain. So the check only nudges the student to rephrase, and a human reviews anything held back.

## Scale, performance and failure handling

Sunwai's load is small by internet standards (a campus of roughly 2,000 to 2,500 people), but it comes in spikes: a bad mess meal can bring hundreds of votes and comments in an hour. The design handles the spike, not the average.

**Targets**

| Measure | Target |
| --- | --- |
| Page load on campus Wi-Fi or 4G | Under 2 seconds |
| Raising an issue, including photo upload | Under 5 seconds |
| Peak load handled | 500 signed-in users and 50 votes per second |
| Uptime during the term | 99.5% (about 3.5 hours of downtime a month at most) |
| Data loss on failure | At most 24 hours (daily backup) |

**How the design meets them**

- **Votes are tiny.** Each vote is one small row, and the uniqueness rule stops duplicates even when someone clicks 10 times.
- **Photos are shrunk in the browser** before upload to under 2 MB, then served from a CDN (a network of servers that stores copies close to users), so they don't slow the database.
- **The feed is paginated:** 20 issues at a time, sorted using indexes (pre-built lookups that make sorting fast) on votes and dates.
- **Search** uses Postgres full-text search, which is enough for a few thousand issues; no separate search engine is needed.
- **Rate limits:** at most 5 new issues and 30 comments per student per hour, to stop spam.
- **Background work stays in the background.** Emails and deadline checks run as jobs, so a slow email service never slows students down.

**When things fail**

| Failure | What students see | What happens behind |
| --- | --- | --- |
| Email service down | Nothing changes | Emails wait in the outbox and are retried |
| Database unreachable | A friendly "Try again in a minute" page; drafts kept in the browser | Hosting provider restores; admin alerted |
| Photo upload fails | Issue still saves; "Retry photo" button | Upload retried |
| Hourly job misses a run | Nothing visible | Next run catches up, since it checks all overdue rows |
| Bad deploy | Possible broken page | One-click rollback to the previous version on Vercel |

**Monitoring.** Error tracking (Sentry, free tier) alerts the admin on crashes. A simple uptime check pings the site every 5 minutes. The admin dashboard shows failed emails and the last job run time.

## Sprint plan

Four sprints take Sunwai from a working demo to a production launch in about 7 weeks. Sprint 1 is deliberately the Overtures MVP: the whole core loop working end to end, with the rough edges cut. Each later sprint adds what a real campus launch needs.

| Sprint | Length | Goal | Exit test |
| --- | --- | --- | --- |
| 1. Core loop (Overtures MVP) | 1 week | A student can raise an issue and an owner can close it | Demo the hot-water story end to end on the live site |
| 2. Accountability | 2 weeks | Deadlines, escalation, emails, reopen | An unacknowledged test issue escalates on its own |
| 3. Admin and safety | 2 weeks | Real student data, roles, moderation, privacy rules | A 2,000-row upload works, and private issues are invisible to the wrong roles |
| 4. Hardening and launch | 2 weeks | Load, monitoring, pilot, launch | 500-user load test passes; one hostel pilot runs for a week |

### Sprint 1: Core loop (Overtures MVP)

- [ ] Set up Next.js project, Supabase database and Vercel hosting
- [ ] Google sign-in limited to @iiml.ac.in (S1)
- [ ] Tables: users, roles, routing\_rules, issues, votes, comments, status\_updates, issue\_photos
- [ ] Seed data: council roles, 2 hostel reps, 30 test students, 10 realistic issues including hot water
- [ ] Raise issue form with photo upload and owner confirmation (S2, S3)
- [ ] Public feed with upvote, keyword search and filters (S6, S7)
- [ ] Issue page with timeline and comments (S8)
- [ ] My issues page with edit/delete/withdraw rules (S4, S5)
- [ ] Owner inbox with acknowledge, update, complete and reject (C1 to C4)
- [ ] President dashboard, basic version (P1)
- [ ] Write prompts.md and README for the submission

**Cut on purpose:** real emails (shown as an on-screen "email sent" log), the hourly job (a "run deadline check" button for the demo), Excel upload, abuse check.

### Sprint 2: Accountability

- [ ] Email service and outbox with retries
- [ ] All notification emails from the notifications table (S10)
- [ ] Hourly deadline checker: reminders, Escalated L1 and L2, weekly-update chasing
- [ ] Redirect flow with 2-redirect limit (C5)
- [ ] Confirm or reopen within 7 days, with auto-close (S9)
- [ ] Priority threshold at 10% of students, with 7-day response deadline
- [ ] Severity flag and area dashboards (C6, C7)
- [ ] Daily digest email

### Sprint 3: Admin and safety

- [ ] Excel/CSV upload with preview, error rows and roll-number parsing (A1)
- [ ] User management and role assignment (A2, A3)
- [ ] Row-level security on every table, tested role by role
- [ ] Public identity rule: course and batch only
- [ ] Sensitive-category screen with ICC and counsellor contacts
- [ ] Abuse word check, held-for-review queue and comment removal (A4, A5)
- [ ] Conflict-of-interest routing
- [ ] Audit log and admin view (A7)
- [ ] Duplicate suggestions while typing (S11)

### Sprint 4: Hardening and launch

- [ ] Load test with 500 simulated users voting at once
- [ ] Rate limits on issues and comments
- [ ] Error tracking, uptime check, backup check
- [ ] Mobile layout pass (most students will open it on phones)
- [ ] Accessibility pass: readable contrast, works with screen readers
- [ ] Council training session and a one-page guide for owners
- [ ] One-hostel pilot for a week; fix what breaks
- [ ] Campus launch with Instagram post and story; seed with current pending issues
- [ ] Handover document so the next tech committee can run it

## Launch, adoption and open questions

The biggest risk is not technical: it is students continuing to complain in WhatsApp groups, and owners ignoring the portal. Adoption has to be designed as carefully as the code.

**Adoption plan**

- **Council first.** The President announces Sunwai as the official channel, and owners agree to the 48-hour rule before launch. Without this, deadlines mean nothing.
- **Seed it.** Launch with 10 to 15 real pending issues already posted (hot water first), so the feed is never empty.
- **Redirect the old channels.** Council members reply to WhatsApp complaints with the Sunwai link instead of answering there.
- **Show results.** A monthly "You said, we did" post lists issues closed, with photos.
- **Make it fast.** Raising an issue should take under 60 seconds on a phone.

**Open questions**

- [ ] What actually happened to the hot-water request: budget, institute approval, or nobody owning it?
- [ ] Will the council formally commit to the 48-hour acknowledgment rule?
- [ ] Who in Student Affairs receives Level 2 escalations, and will they accept email?
- [ ] How many hostels and hostel reps are there, and what are their inbox emails?
- [ ] Exact enrolled student count, which sets the 10% priority threshold (this spec assumes roughly 2,000 to 2,500)
- [ ] Can IIML IT provide role inboxes (mess.sec@…) or should Sunwai use a shared Gmail per role?
- [ ] Who is the admin, and who checks the admin?
- [ ] Overtures submission deadline, which fixes the end date of Sprint 1
