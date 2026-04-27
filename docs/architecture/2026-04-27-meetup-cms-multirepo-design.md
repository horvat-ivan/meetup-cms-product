---
title: Meetup CMS — Multirepo Workflow Design
date: 2026-04-27
status: approved
scope: meetup-cms-product, meetup-cms-design, meetup-cms-app
audience: presentation "specs to production — multirepo setup"
---

# Meetup CMS — Multirepo Workflow Design

## Headline

Domain experts wield AI as a tool. PMs know what *should* ship. Designers know what *good UX* looks like. Devs know what *belongs in prod*. Vibe-coded shortcuts skip all of that and produce things that don't survive contact with real users. **AI is the tool that lets each expert ask sharper questions inside their own domain.**

This workflow gives each expert their own AI-equipped workspace, then connects those workspaces with automation so collaboration doesn't bottleneck on hand-offs.

## Problem

A single product team typically consists of a PM, a designer, and developers. Today, hand-offs between roles happen via:

- Slack threads that get lost
- Figma comments that no one reads
- PRDs in Notion that drift from issues in Jira
- Mental telepathy

Each role has different tools, different vocabularies, different priorities. The "throw it over the wall" pattern is the default — and it produces drift, rework, and missed assumptions.

## Goal

Build a multirepo workflow where:

- **Each role has a dedicated repo** shaped to their work (PM writes specs; designer designs; dev codes).
- **Each repo has its own AI-equipped workspace** (Claude Code with role-specific skills and slash commands).
- **Cross-repo automation** propagates a feature from PRD to design to code without anyone leaving their repo.
- **A single dashboard** (unified GitHub Project) gives full visibility across all 3 repos.
- **Domain expertise is amplified, not replaced**, by AI tooling.

## Architecture overview

```
┌───────────────────────┐    ┌───────────────────────┐    ┌───────────────────────┐
│  meetup-cms-product   │    │  meetup-cms-design    │    │   meetup-cms-app      │
│  ──────────────────   │    │  ──────────────────   │    │   ──────────────────  │
│  PM's workspace       │    │  Designer's workspace │    │   Dev's workspace     │
│                       │    │                       │    │                       │
│  • PRDs in markdown   │    │  • .pen / Figma       │    │   • TanStack Start FE │
│  • slash commands:    │    │  • slash commands:    │    │   • NestJS BE         │
│    /draft-prd         │    │    /explore-design    │    │   • Postgres + Drizzle│
│    /grill (PM)        │    │    /grill (UX)        │    │   • slash commands:   │
│    /glossary          │    │    /split-issue       │    │     /design-doc       │
│    /zoom-out          │    │    /zoom-out          │    │     /grill (tech)     │
│                       │    │                       │    │     /split-issue      │
│  Dispatch + sync      │    │                       │    │     /tdd              │
│  GitHub Actions       │    │                       │    │     /zoom-out         │
└──────────┬────────────┘    └───────────┬───────────┘    └────────────┬──────────┘
           │                             │                             │
           │   PRD push                  │   issue created             │   issue created
           │      │                      │                             │
           │      ▼                      │                             │
           │   ┌────────────────────────────────────────────────────┐  │
           │   │   feature-dispatch action (in product repo)         │ │
           │   │   • parses PRD frontmatter                          │ │
           │   │   • creates parent issue in product                 │ │
           │   │   • creates seed issue in design                    │ │
           │   │   • creates seed issue in app                       │ │
           │   │   • patches PRD frontmatter status: dispatched      │ │
           │   └────────────────────────────────────────────────────┘  │
           │                                                           │
           ▼                                                           │
   ┌────────────────────────────────────────────────────────────┐     │
   │   feature-status-sync action (cron in product repo)        │     │
   │   • aggregates issues with feature:<slug> across all 3 repos◄────┘
   │   • rebuilds parent issue body (flat checklist)            │
   │   • updates PRD frontmatter progress + status              │
   └────────────────────────────────────────────────────────────┘
                              │
                              ▼
   ┌────────────────────────────────────────────────────────────┐
   │   Unified GitHub Project (user-level, project #1)          │
   │   "Vibecoder Meetup Board"                                 │
   │   • items added by dispatch action (programmatic)          │
   │   • saved views per role: PM / Design / Dev                │
   │   • status field: Backlog / In Design / In Dev / In Review │
   │     / Done / Blocked                                       │
   └────────────────────────────────────────────────────────────┘
```

## Repo structures

### `meetup-cms-product` (PM)

```
meetup-cms-product/
├── .claude/
│   ├── skills/                       (vendored from Pocock + superpowers)
│   │   ├── to-prd/                   (writes file, not a GH issue)
│   │   ├── grill-me/                 (PM-flavored: product questions only)
│   │   ├── ubiquitous-language/
│   │   ├── zoom-out/
│   │   └── caveman/
│   ├── commands/
│   │   ├── draft-prd.md
│   │   ├── grill.md
│   │   ├── glossary.md
│   │   └── zoom-out.md
│   └── settings.json
├── .github/
│   ├── workflows/
│   │   ├── feature-dispatch.yml
│   │   └── feature-status-sync.yml
│   ├── ISSUE_TEMPLATE/
│   │   └── feature-parent.yml
│   └── workflow-scripts/
│       ├── dispatch.mjs
│       ├── sync.mjs
│       └── lib/
│           ├── parse-prd.mjs
│           ├── format-issue.mjs
│           └── github.mjs
├── docs/
│   ├── prds/                         ← THE source of truth
│   │   ├── TEMPLATE.md
│   │   └── 2026-04-27-article-scheduling.md
│   ├── glossary.md
│   ├── architecture/                 ← this spec lives here
│   ├── presentation/
│   │   ├── outline.md
│   │   ├── demo-script.md
│   │   ├── backup-prd.md
│   │   └── faq.md
│   └── README.md
├── CLAUDE.md
└── README.md
```

### `meetup-cms-design` (Designer)

```
meetup-cms-design/
├── .claude/
│   ├── skills/
│   │   ├── design-an-interface/      (drives Pencil MCP)
│   │   ├── grill-me/                 (UX-flavored)
│   │   ├── to-issues/
│   │   ├── zoom-out/
│   │   └── caveman/
│   ├── commands/
│   │   ├── explore-design.md
│   │   ├── grill.md
│   │   ├── split-issue.md
│   │   └── zoom-out.md
│   └── settings.json
├── designs/
│   └── <slug>/                       ← per-feature folder
│       ├── README.md                 (rationale, decisions, a11y notes)
│       ├── source.pen                (Pencil — when used)
│       └── figma.url                 (Figma URL — when used)
├── docs/
│   └── tooling.md
├── CLAUDE.md
└── README.md
```

### `meetup-cms-app` (Dev)

```
meetup-cms-app/
├── .claude/
│   ├── skills/
│   │   ├── tdd/
│   │   ├── grill-me/                 (tech-flavored: SDD-style questions)
│   │   ├── to-issues/                (FE/BE split)
│   │   ├── triage-issue/
│   │   ├── github-triage/
│   │   ├── domain-model/
│   │   ├── improve-codebase-architecture/
│   │   ├── request-refactor-plan/
│   │   ├── qa/
│   │   ├── zoom-out/
│   │   └── caveman/
│   ├── commands/
│   │   ├── design-doc.md
│   │   ├── grill.md
│   │   ├── split-issue.md
│   │   ├── tdd.md
│   │   └── zoom-out.md
│   └── settings.json
├── apps/
│   ├── web/                          (TanStack Start FE)
│   └── api/                          (NestJS BE)
├── packages/
│   └── db/                           (drizzle schema + migrations)
├── docs/
│   ├── sdd/                          (software design docs, one per feature)
│   └── adr/                          (architecture decision records)
├── docker-compose.yml                (postgres for local dev)
├── .env.example
├── package.json                      (pnpm workspace root)
├── pnpm-workspace.yaml
├── turbo.json
├── CLAUDE.md
└── README.md
```

## Issue model

### Linked-issue model with seeds per repo

When a PRD is pushed to `main` in `meetup-cms-product`:

1. **Parent issue** in `meetup-cms-product` — the canonical "feature is X". Aggregates progress.
2. **Design seed issue** in `meetup-cms-design` — designer's entry point. Linked to parent.
3. **App seed issue** in `meetup-cms-app` — dev's entry point. Linked to parent.

Each role then **decomposes inside their own repo**:

- Designer can split the seed into N design sub-issues (e.g., date picker, empty state, badge). All carry `feature:<slug>` + `role:design`.
- Dev can split the seed into FE/BE sub-issues. Each carries `feature:<slug>` + `role:app` + `area:fe` or `area:be`.

The parent issue body is rewritten by the status sync action as a **flat checklist** of every issue (seed + sub-issues) across all 3 repos. Verbose by design — visibility over brevity.

### Sequencing — parallel by default

Both seeds (design + app) are created at PRD push. Dev can scaffold tech that doesn't depend on UX while design is still exploring. Real teams rarely have strict sequential gates; the workflow doesn't impose one.

### PRD shape

PRDs live in `meetup-cms-product/docs/prds/<YYYY-MM-DD>-<slug>.md`. They contain:

- YAML frontmatter (slug, status, dates, issue URLs)
- Summary
- User stories
- Acceptance criteria
- Scope (in / out)
- Constraints

PRDs **do not** contain per-role task breakdowns. PMs never define technical decomposition.

```markdown
---
feature: article-scheduling
status: draft | dispatched | in-progress | completed
created: 2026-04-27
dispatched: null
issues:
  product: null
  design: null
  app: null
---

# Article Scheduling

## Summary
Editors can schedule articles to publish at a future date and time.

## User Stories
- As an editor, I want to set a future publish time for a draft article.
- As an editor, I want to see which articles are scheduled and when.
- As an editor, I want to cancel or reschedule a pending publication.

## Acceptance Criteria
- A draft article can be assigned a future ISO timestamp.
- Articles auto-publish at the scheduled time (within ~1 minute).
- Scheduled articles are visible in a dedicated list view.
- Cancellation reverts the article to draft.

## Scope
- In: scheduling, cancellation, rescheduling, list view
- Out: recurring schedules, timezone selection (UTC only for v1)

## Constraints
- Must respect existing per-article author/editor permissions.
- Timezone defaults to UTC.
```

### Labels

Pre-created in all 3 repos before the demo:

| Label | Used for |
|---|---|
| `feature` | Bare label on every parent + seed + sub-issue. Used for project auto-add fallback. |
| `feature:<slug>` | Per-feature grouping label. Used by sync to aggregate. |
| `role:product` | Parent issue. |
| `role:design` | Design seed + design sub-issues. |
| `role:app` | App seed + dev sub-issues. |
| `seed` | Marks the auto-created seed issues (distinguishes them from sub-issues). |
| `area:fe` | FE sub-issues in app repo. |
| `area:be` | BE sub-issues in app repo. |

## Workflows

### Flow 1 — `feature-dispatch`

**Lives in:** `meetup-cms-product/.github/workflows/feature-dispatch.yml`
**Triggers:** Push to `main` touching `docs/prds/*.md`, plus manual `workflow_dispatch`.
**Auth:** `CROSS_REPO_TOKEN` (Classic PAT with `repo` + `project` + `workflow` scopes).

**Behavior:**

1. Detect changed PRD files (`git diff` HEAD~1 HEAD).
2. For each PRD where `status: draft`:
   - Parse YAML frontmatter and content.
   - Create parent issue in product (`role:product`, `feature`, `feature:<slug>`).
   - Create seed issue in design (`role:design`, `feature`, `feature:<slug>`, `seed`).
   - Create seed issue in app (`role:app`, `feature`, `feature:<slug>`, `seed`).
   - Add all 3 issues to user-level Project #1 via `gh project item-add`.
   - Patch PRD frontmatter with issue URLs and `status: dispatched`.
   - Auto-commit PRD update.
3. Idempotent: skips PRDs not in `status: draft`.

**Issue body templates:**

Parent issue body (initial):
```markdown
## Summary
<from PRD>

## Linked work
_This will be auto-populated by status sync._

## PRD
[docs/prds/2026-04-27-article-scheduling.md](link)
```

Design seed issue body:
```markdown
## Context
This is the design entry point for **[<feature>](link-to-PRD)**.

## Acceptance Criteria
<from PRD>

## What to do
- Open Claude Code in this repo and run `/explore-design`
- Split into sub-issues with `/split-issue` if scope warrants it
- Close this seed when design is approved

---
_Auto-generated from [PRD](link)_
```

App seed issue body:
```markdown
## Context
This is the app entry point for **[<feature>](link-to-PRD)**.

## Acceptance Criteria
<from PRD>

## What to do
- Open Claude Code in this repo and run `/design-doc`
- Split into FE/BE sub-issues with `/split-issue`
- Pick up sub-issues with `/tdd`

---
_Auto-generated from [PRD](link)_
```

### Flow 2 — `feature-status-sync`

**Lives in:** `meetup-cms-product/.github/workflows/feature-status-sync.yml`
**Triggers:** Cron (every hour) + manual `workflow_dispatch` (for live demo).
**Auth:** `CROSS_REPO_TOKEN`.

**Behavior:**

1. For each PRD with `status: dispatched | in-progress`:
   - Query GitHub API for all issues in all 3 repos with label `feature:<slug>`.
   - Aggregate counts (total, open, closed) and group by `role:`.
2. Rebuild parent issue body — flat checklist sorted by `role:product → role:design → role:app`, then by issue number:
   ```
   - [x] (closed) [role:design] meetup-cms-design#7 — Date picker exploration
   - [ ] (open)   [role:app][area:fe] meetup-cms-app#12 — Build scheduled-state badge
   ```
3. Update PRD frontmatter:
   - `status: dispatched → in-progress` when any issue is in-progress.
   - `status: → completed` when all closed.
   - Append `progress: 4/9` field.
4. Commit PRD changes back to product repo.

**Idempotent:** rebuilds from current state every run.

### Flow 3 — `pr-link` (optional polish)

**Lives in:** `meetup-cms-design/.github/workflows/pr-link.yml` and `meetup-cms-app/.github/workflows/pr-link.yml`
**Triggers:** New issue with `feature:<slug>` label.
**Auth:** built-in `GITHUB_TOKEN` (only commenting on parent issue, no cross-repo write needed beyond that).

**Behavior:** Posts a comment on the parent issue: *"📨 New {design|dev} sub-issue created: meetup-cms-{repo}#X — \"<title>\""*. Skips if a comment already exists for that issue number.

## Per-role brainstorming touch-points

### Product repo

- **`/draft-prd`** — wraps superpowers `brainstorming` + Pocock `to-prd` (modified to write `docs/prds/<slug>.md`, not file an issue). Refuses tech discussion.
- **`/grill`** — Pocock `grill-me`, PM-flavored. Asks product questions only (scope, edge cases, success criteria, who-uses-this).
- **`/glossary`** — Pocock `ubiquitous-language` writing to `docs/glossary.md`.
- **`/zoom-out`** — Pocock as-is.

### Design repo

- **`/explore-design`** — Pocock `design-an-interface` + Pencil MCP. Generates 3 UI variants in Pencil. For Figma users, falls back to written exploration in `designs/<slug>/README.md`.
- **`/grill`** — Pocock `grill-me`, UX-flavored. Asks about states, a11y, breakpoints, error/empty/loading.
- **`/split-issue`** — Pocock `to-issues`, fine-tuned: creates design sub-issues with `feature:<slug>` + `role:design` labels.
- **`/zoom-out`** — Pocock as-is.

### App repo

- **`/design-doc`** — `grill-me` + writes SDD to `docs/sdd/<slug>.md`. The dev equivalent of `/draft-prd`. Asks tech questions: data model, API, error paths, perf, auth, migrations.
- **`/grill`** — Pocock `grill-me`, tech-flavored.
- **`/split-issue`** — Pocock `to-issues`, fine-tuned: creates FE/BE sub-issues with `area:fe` or `area:be` labels.
- **`/tdd`** — Pocock `tdd` as-is. Picks up a sub-issue, drives red-green-refactor.
- **`/zoom-out`** — Pocock as-is.

### Universal (in every repo)

- **`/caveman`** — token saver.

### CLAUDE.md per repo enforces role boundaries

- Product `CLAUDE.md`: "You help write PRDs. You never write code or technical specifications. You ask product questions only."
- Design `CLAUDE.md`: "You help with UX exploration and visual design. You never write product strategy or backend code."
- App `CLAUDE.md`: "You write production-quality code. You always TDD. You never skip verification."

## Skill vendoring strategy

All skills are **vendored** (copied) into each repo's `.claude/skills/`, not installed via package manager. This gives full control: each repo's variants live and evolve in git, are editable by hand or by Claude when asked, and do not auto-update.

Source repos:

| Skill | Source | Action |
|---|---|---|
| `to-prd` | mattpocock/skills | Major fine-tune: write file, not GH issue |
| `grill-me` | mattpocock/skills | Three variants (PM/UX/tech) — different system prompts and question banks |
| `to-issues` | mattpocock/skills | Two variants (design/dev) — different label sets |
| `design-an-interface` | mattpocock/skills | Add Pencil MCP wiring |
| `ubiquitous-language` | mattpocock/skills | Configure to write `docs/glossary.md` |
| `zoom-out` | mattpocock/skills | As-is |
| `caveman` | mattpocock/skills | As-is |
| `tdd` | mattpocock/skills | As-is, plus reads PRD context from seed |
| `triage-issue`, `github-triage`, `qa`, `domain-model`, `improve-codebase-architecture`, `request-refactor-plan` | mattpocock/skills | App repo, as-is |
| `brainstorming`, `writing-plans`, `executing-plans`, `verification-before-completion`, `systematic-debugging` | superpowers | App repo, as-is |

## GitHub Project setup

- **Project**: user-level `Vibecoder Meetup Board` (project #1 under user `horvat-ivan`).
- **Visibility**: public.
- **Status field values**: `Backlog`, `In Design`, `In Dev`, `In Review`, `Done`, `Blocked`.
- **Saved views**: `PM` (filter `label:role:product`), `Design` (`label:role:design`), `Dev` (`label:role:app`).
- **Item addition**:
  - Parent + design seed + app seed: programmatic via `gh project item-add` from the dispatch action (uses `CROSS_REPO_TOKEN`).
  - Sub-issues created by designer/dev: added by the local `/split-issue` slash command, which calls `gh project item-add` after each `gh issue create` (uses the user's local `gh` CLI auth — no cross-repo token needed).
  - Auto-add UI workflows are **not** used (the user-level Projects auto-add UI is single-repo and clashes with our 3-repo setup).

## Auth & secrets

- **`CROSS_REPO_TOKEN`** — Classic PAT with `repo`, `project`, `workflow` scopes. Stored as a secret in `meetup-cms-product` repo only.
- All other repos use built-in `GITHUB_TOKEN` for their actions (only need same-repo access).

## Error handling

### Idempotency

- Dispatch keys off PRD frontmatter `status`. Re-running on `dispatched` PRD is a no-op.
- Sync rebuilds parent body from current state every run. 10x same as 1x.

### Failure modes

| Failure | Behavior |
|---|---|
| Issue creation fails partway | PRD stays `draft`. Orphan deleted manually. Re-run via `workflow_dispatch`. |
| PAT expired/scope insufficient | Action fails fast with clear error. No partial state. |
| PRD malformed | Parser error in logs. PRD stays `draft`. Fix and push again. |
| One repo returns 5xx during sync | Other repos still sync. Partial > nothing. |
| Sync commit fails (concurrent push) | `git pull --rebase` and retry once. Next cron catches up. |
| Issue deleted manually | Aggregator skips, logs warning. |

### Re-dispatch (intentional change)

PRD edits are allowed (typo fixes). For *structural* re-dispatch:

- Add `re-dispatch: true` to PRD frontmatter, OR
- Trigger `workflow_dispatch` with `force: true`

The action then closes existing seeds with a "superseded" comment and dispatches fresh ones.

### Retraction

`git rm` on a PRD file triggers `feature-retract`:

- Reads deleted file's frontmatter from previous commit
- Closes parent + design seed + app seed with retraction comment
- Does **not** close sub-issues (independent lifecycles)

## Demo storyline (15-minute talk)

| Beat | Time | What's on screen |
|---|---|---|
| 0. Cold open | 0:30 | Slide: "Specs to Production" |
| 1. The setup | 2:00 | Diagram of 3 repos + unified board |
| 2. PM scene | 3:00 | Terminal in product repo. `/draft-prd`. Brainstorm. Push to main. |
| 3. Magic moment | 1:00 | GitHub UI: 3 issues materialize, board lights up |
| 4. Designer scene | 3:00 | Design repo. `/explore-design` → Pencil. `/split-issue`. |
| 5. Dev scene | 3:00 | App repo. `/design-doc` → SDD. `/split-issue` → FE/BE. |
| 6. Status sync | 1:00 | Trigger sync. Parent issue refreshes. |
| 7. Closer | 1:30 | Pre-cooked PR. "TDD took it from here." |
| 8. Closing line | 0:30 | Slide: "AI is a tool. Domain experts wield it." |

**Total: ~14:30** + buffer.

## Demo prep checklist

- [ ] Pre-cook the article scheduling PR on a branch in app repo.
- [ ] Pre-create labels in all 3 repos.
- [ ] Pre-write a backup PRD on a branch (failure escape hatch).
- [ ] Run `docker-compose up -d` the night before (Postgres warm).
- [ ] Test dispatch flow end-to-end at least twice the day before.
- [ ] Test status sync manual trigger.
- [ ] Confirm Pencil MCP is responsive.
- [ ] Confirm `CROSS_REPO_TOKEN` hasn't expired.

## Conventions

- **Branch naming**: `feature/<slug>-<short-desc>`
- **Commit messages**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **PR titles**: `[area:fe] feat: scheduled-publish badge`

## Implementation order

1. **Repo skeletons** — CLAUDE.md, READMEs, .gitignore, .claude/ skeleton in all 3 repos.
2. **Skills vendoring** — Copy + role-tune skills into each repo's `.claude/skills/`. (Parallelizable per repo.)
3. **Slash commands** — Author `.claude/commands/*.md` per repo. (Parallelizable per repo.)
4. **Labels + Project setup** — Pre-create labels in all 3 repos. Configure Status field values + saved views.
5. **Dispatch + sync workflows** — Author YAML + JS scripts in product repo. Author optional `pr-link` workflow in design + app repos.
6. **App scaffold** — TanStack Start + NestJS + Postgres + Drizzle. (Parallelizable with 1–5.)
7. **End-to-end smoke test** — One full PRD → 3 issues → sub-issues → sync.
8. **Demo polish** — Pre-cooked PR, backup PRD, presentation notes, dry-run.

## Non-goals (explicitly out of scope)

- Cross-repo dependency enforcement
- Auto-assignment of issues to humans
- Slack / email notifications
- Webhook-based real-time sync (cron is enough; one PRD per push is the convention even if the action technically loops over changed files)
- A single PRD defining multiple features (one PRD = one feature)
- Localization / i18n
- Production deployment of the CMS (runs locally only)
- Authentication / authorization beyond demo-grade
- A real org-level GitHub Apps integration (mentioned as Q&A material)
- Backwards compatibility with the wez setup (this is a fresh design)

## Risks

| Risk | Mitigation |
|---|---|
| PAT expires mid-demo | Test the day before. Keep a backup PAT generated and ready. |
| GitHub Projects v2 UI changes | Programmatic item-add via `gh project item-add` is the contract; UI is not. |
| Pencil MCP hangs | Backup branch with pre-built design. Switch to written exploration. |
| Live brainstorm goes off-rails | Backup PRD on a branch. `git checkout` and continue. |
| Action runner queue delay | Use `workflow_dispatch` manual triggers — rarely queued. |
| Postgres won't start | Skip closer step. Workflow stands on its own. |
