# Meetup CMS — Plan 1: Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold all three repos (`meetup-cms-product`, `meetup-cms-design`, `meetup-cms-app`) with role-aware Claude Code setup — CLAUDE.md, vendored skills, slash commands, GitHub labels — so each repo has working role-specific AI tooling before the cross-repo automation lands in Plan 2.

**Architecture:** Three independent public GitHub repos under `horvat-ivan`. Each has a `.claude/` directory with vendored skills (sourced from `mattpocock/skills` and `superpowers`), role-specific CLAUDE.md, and slash commands. No cross-repo automation in this plan — that's Plan 2.

**Tech Stack:** Markdown skills + slash commands, `gh` CLI for label/repo operations, plain git for commits.

**Spec reference:** `docs/architecture/2026-04-27-meetup-cms-multirepo-design.md` (in this repo).

**Plan sequence:**
- **Plan 1 (this plan):** Foundations — repo skeletons, skills, commands, labels.
- Plan 2: Automation — dispatch + sync + pr-link GitHub Actions.
- Plan 3: App scaffold + demo polish — TanStack + NestJS + Postgres + presentation prep.

**Repo paths (assumed throughout):**
- Product: `/Users/ivanhorvat/Documents/Development/Personal/meetup-cms-product`
- Design: `/Users/ivanhorvat/Documents/Development/Personal/meetup-cms-design`
- App: `/Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app`

**State at start of Plan 1:**
- All 3 repos exist on GitHub (public, empty).
- Local clones have remote `origin` set, branch `main`, **zero commits**.
- The spec for this plan is *uncommitted* in the product repo at `docs/architecture/2026-04-27-meetup-cms-multirepo-design.md`. Plan 1 will commit it.

**Definition of done for Plan 1:**
- All 3 repos have an initial commit pushed to `main` containing CLAUDE.md, README.md, .gitignore, .claude/ skeleton.
- Skills are vendored and role-tuned in each repo.
- Slash commands exist and work locally.
- All required GitHub labels exist in all 3 repos.
- GitHub Project status field is configured.
- Manual verification: `/draft-prd` runs in product repo without error.

---

## File map

### `meetup-cms-product`

**Created in this plan:**
- `CLAUDE.md`
- `README.md`
- `.gitignore`
- `.claude/settings.json`
- `.claude/skills/to-prd/SKILL.md` (vendored + fine-tuned)
- `.claude/skills/grill-me/SKILL.md` (vendored + PM-tuned)
- `.claude/skills/ubiquitous-language/SKILL.md` (vendored)
- `.claude/skills/zoom-out/SKILL.md` (vendored)
- `.claude/skills/caveman/SKILL.md` (vendored)
- `.claude/commands/draft-prd.md`
- `.claude/commands/grill.md`
- `.claude/commands/glossary.md`
- `.claude/commands/zoom-out.md`
- `docs/prds/TEMPLATE.md`
- `docs/glossary.md` (empty stub)

**Already exists:**
- `docs/architecture/2026-04-27-meetup-cms-multirepo-design.md` (the spec, uncommitted)

### `meetup-cms-design`

**Created:**
- `CLAUDE.md`
- `README.md`
- `.gitignore`
- `.claude/settings.json`
- `.claude/skills/design-an-interface/SKILL.md` (vendored + Pencil-tuned)
- `.claude/skills/grill-me/SKILL.md` (vendored + UX-tuned)
- `.claude/skills/to-issues/SKILL.md` (vendored + design-tuned)
- `.claude/skills/zoom-out/SKILL.md` (vendored)
- `.claude/skills/caveman/SKILL.md` (vendored)
- `.claude/commands/explore-design.md`
- `.claude/commands/grill.md`
- `.claude/commands/split-issue.md`
- `.claude/commands/zoom-out.md`
- `docs/tooling.md`

### `meetup-cms-app`

**Created:**
- `CLAUDE.md`
- `README.md`
- `.gitignore`
- `.claude/settings.json`
- `.claude/skills/grill-me/SKILL.md` (vendored + tech-tuned)
- `.claude/skills/to-issues/SKILL.md` (vendored + dev-tuned)
- `.claude/skills/tdd/SKILL.md` + bundled refs (vendored)
- `.claude/skills/triage-issue/SKILL.md` (vendored)
- `.claude/skills/github-triage/SKILL.md` (vendored)
- `.claude/skills/domain-model/SKILL.md` (vendored)
- `.claude/skills/improve-codebase-architecture/SKILL.md` (vendored)
- `.claude/skills/request-refactor-plan/SKILL.md` (vendored)
- `.claude/skills/qa/SKILL.md` (vendored)
- `.claude/skills/zoom-out/SKILL.md` (vendored)
- `.claude/skills/caveman/SKILL.md` (vendored)
- `.claude/commands/design-doc.md`
- `.claude/commands/grill.md`
- `.claude/commands/split-issue.md`
- `.claude/commands/tdd.md`
- `.claude/commands/zoom-out.md`

---

## Phase A — Initial repo skeletons + first commits

Goal: each repo has a baseline initial commit pushed to GitHub. After this phase, all 3 repos are non-empty on GitHub, with sensible README and .gitignore.

### Task A1: Product repo — write skeleton files

**Files:**
- Create: `meetup-cms-product/CLAUDE.md`
- Create: `meetup-cms-product/README.md`
- Create: `meetup-cms-product/.gitignore`
- Create: `meetup-cms-product/.claude/settings.json`
- Create: `meetup-cms-product/docs/prds/TEMPLATE.md`
- Create: `meetup-cms-product/docs/glossary.md`

- [ ] **Step 1: Write `CLAUDE.md`**

```markdown
# CLAUDE.md — Product Repo

## Role

You are operating in the **product** repo of a multirepo workflow. Your role is **product manager**.

## What you do

- Help write Product Requirements Documents (PRDs) in `docs/prds/`.
- Probe scope, user stories, acceptance criteria, edge cases.
- Maintain a feature glossary in `docs/glossary.md`.
- Ask product questions only.

## What you NEVER do

- Write code.
- Write technical specifications, software design docs, or architecture decisions.
- Discuss data models, APIs, frameworks, or implementation details.
- Commit anything outside `docs/prds/`, `docs/glossary.md`, or `docs/presentation/`.

If a user asks you to make a technical decision, redirect them to the app repo:

> "That's a technical question — open `meetup-cms-app` and run `/design-doc`."

## How to use this repo

- `/draft-prd` — start a new PRD via brainstorming.
- `/grill` — interrogate an open PRD for gaps.
- `/glossary` — extract domain terms into the glossary.
- `/zoom-out` — step back, see the big picture.

## Spec reference

The full multirepo workflow design is in `docs/architecture/`.
```

- [ ] **Step 2: Write `README.md`**

```markdown
# meetup-cms-product

The **product** repo in the Meetup CMS multirepo workflow.

This is where:
- Product Requirements Documents (PRDs) are written.
- The feature glossary lives.
- Cross-repo dispatch & status sync GitHub Actions are defined.

## Quickstart for PMs

1. Clone this repo.
2. Open in Claude Code.
3. Run `/draft-prd` to start a new feature.
4. Push the resulting PRD to `main` — it auto-creates issues in `meetup-cms-design` and `meetup-cms-app`.

## Spec

See `docs/architecture/2026-04-27-meetup-cms-multirepo-design.md` for the full workflow design.

## Companion repos

- `meetup-cms-design` — designer's repo (Pencil/Figma + UX exploration)
- `meetup-cms-app` — engineering repo (TanStack + NestJS + Postgres)
```

- [ ] **Step 3: Write `.gitignore`**

```gitignore
# OS
.DS_Store

# Claude Code local state
.claude/local/
.claude/session/
```

- [ ] **Step 4: Write `.claude/settings.json`**

```json
{
  "permissions": {
    "allow": [
      "Bash(git:*)",
      "Bash(gh issue *)",
      "Bash(gh project *)",
      "Bash(gh label *)"
    ]
  }
}
```

- [ ] **Step 5: Write `docs/prds/TEMPLATE.md`**

```markdown
---
feature: <slug>
status: draft
created: <YYYY-MM-DD>
dispatched: null
issues:
  product: null
  design: null
  app: null
---

# <Feature Title>

## Summary

<One-paragraph description.>

## User Stories

- As a <role>, I want <action>, so that <benefit>.

## Acceptance Criteria

- <Specific, testable behavior.>

## Scope

- In: <what's included>
- Out: <what's deliberately excluded>

## Constraints

- <Hard constraints (security, performance, compliance).>
```

- [ ] **Step 6: Write `docs/glossary.md`** (empty stub)

```markdown
# Feature Glossary

Domain terms used across PRDs. Updated incrementally via `/glossary`.

| Term | Definition |
|---|---|
```

- [ ] **Step 7: Verify all files exist**

```bash
ls -la /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-product/{CLAUDE.md,README.md,.gitignore,.claude/settings.json,docs/prds/TEMPLATE.md,docs/glossary.md}
```

Expected: 6 files listed, no errors.

- [ ] **Step 8: Commit**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-product
git add CLAUDE.md README.md .gitignore .claude/settings.json docs/prds/TEMPLATE.md docs/glossary.md docs/architecture/2026-04-27-meetup-cms-multirepo-design.md
git commit -m "chore: initial repo skeleton with CLAUDE.md, README, PRD template, and design spec"
git push -u origin main
```

Expected: push succeeds; commit visible on GitHub.

---

### Task A2: Design repo — write skeleton files

**Files:**
- Create: `meetup-cms-design/CLAUDE.md`
- Create: `meetup-cms-design/README.md`
- Create: `meetup-cms-design/.gitignore`
- Create: `meetup-cms-design/.claude/settings.json`
- Create: `meetup-cms-design/docs/tooling.md`

- [ ] **Step 1: Write `CLAUDE.md`**

```markdown
# CLAUDE.md — Design Repo

## Role

You are operating in the **design** repo of a multirepo workflow. Your role is **product designer**.

## What you do

- Help with UX exploration and visual design.
- Drive the Pencil app via MCP when generating designs.
- For Figma users: produce written design exploration the designer translates manually.
- Maintain per-feature design rationale in `designs/<slug>/README.md`.
- Ask UX questions: states, accessibility, breakpoints, error/empty/loading.

## What you NEVER do

- Write code.
- Write product strategy or business decisions.
- Make technical architecture decisions.
- Touch files outside `designs/` and `docs/`.

## How to use this repo

- `/explore-design` — generate UI variants for the active design seed issue.
- `/grill` — interrogate the design for UX gaps.
- `/split-issue` — break the design seed into sub-issues.
- `/zoom-out` — step back, see the big picture.

## Tooling

See `docs/tooling.md` for Pencil vs. Figma instructions.
```

- [ ] **Step 2: Write `README.md`**

```markdown
# meetup-cms-design

The **design** repo in the Meetup CMS multirepo workflow.

This is where designs live — `.pen` files (Pencil) or `.url` link files (Figma), plus per-feature design rationale.

## Quickstart for designers

1. Clone this repo.
2. Open in Claude Code.
3. When a design seed issue arrives, run `/explore-design` for the active feature.
4. Push committed designs back to `main`.

## Folder convention

```
designs/
  <feature-slug>/
    README.md          <- rationale, decisions, a11y notes
    source.pen         <- Pencil source (if used)
    figma.url          <- Figma URL (if used)
```

## Spec

Full multirepo workflow: `meetup-cms-product/docs/architecture/`.
```

- [ ] **Step 3: Write `.gitignore`**

```gitignore
.DS_Store
.claude/local/
.claude/session/

# Pencil temp files
*.pen.bak
```

- [ ] **Step 4: Write `.claude/settings.json`**

```json
{
  "permissions": {
    "allow": [
      "Bash(git:*)",
      "Bash(gh issue *)",
      "Bash(gh project *)",
      "Bash(gh label *)"
    ]
  }
}
```

- [ ] **Step 5: Write `docs/tooling.md`**

```markdown
# Design Tooling

This repo is **tool-agnostic**. Designers can use Pencil or Figma.

## Pencil

Pencil files (`.pen`) live in `designs/<slug>/source.pen` and are accessed via the Pencil MCP.

To explore a new feature:
1. Run `/explore-design` from Claude Code.
2. Pencil opens automatically. Three variants are generated as parallel sub-agents.

## Figma

Figma source-of-truth lives in Figma cloud. In this repo, commit `designs/<slug>/figma.url` containing the URL.

To explore a new feature:
1. Open Figma directly.
2. Run `/explore-design` for written exploration; translate manually into Figma frames.
3. Commit the URL to `figma.url`.

## Per-feature folder

Every feature gets a folder under `designs/<slug>/` containing:
- `README.md` — rationale, decisions, a11y notes
- `source.pen` OR `figma.url` (whichever is the source of truth)
```

- [ ] **Step 6: Verify all files exist**

```bash
ls -la /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-design/{CLAUDE.md,README.md,.gitignore,.claude/settings.json,docs/tooling.md}
```

Expected: 5 files listed, no errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-design
git add CLAUDE.md README.md .gitignore .claude/settings.json docs/tooling.md
git commit -m "chore: initial repo skeleton with CLAUDE.md, README, and tooling docs"
git push -u origin main
```

Expected: push succeeds; commit visible on GitHub.

---

### Task A3: App repo — write skeleton files

**Files:**
- Create: `meetup-cms-app/CLAUDE.md`
- Create: `meetup-cms-app/README.md`
- Create: `meetup-cms-app/.gitignore`
- Create: `meetup-cms-app/.claude/settings.json`

- [ ] **Step 1: Write `CLAUDE.md`**

```markdown
# CLAUDE.md — App Repo

## Role

You are operating in the **app** repo of a multirepo workflow. Your role is **software engineer**.

## What you do

- Write production-quality code for the Meetup CMS.
- Always TDD (red → green → refactor).
- Always run verification before claiming completion.
- Author Software Design Documents (SDDs) in `docs/sdd/` before splitting work.
- Ask technical questions: data model, API contracts, error paths, performance, auth, migrations, deployment.

## What you NEVER do

- Skip tests.
- Skip verification before claiming success.
- Make product or UX decisions (those live in the product/design repos).
- Commit code without a passing test.

## How to use this repo

- `/design-doc` — interrogate the technical approach via grill-me, write SDD.
- `/grill` — interrogate any plan or design for tech gaps.
- `/split-issue` — break the seed into FE/BE sub-issues.
- `/tdd` — pick up a sub-issue, drive red-green-refactor.
- `/zoom-out` — step back, see the big picture.

## Stack (added in Plan 3)

- FE: TanStack Start
- BE: NestJS
- DB: Postgres + Drizzle
- Workspace: pnpm + turbo

## Spec

Full multirepo workflow: `meetup-cms-product/docs/architecture/`.
```

- [ ] **Step 2: Write `README.md`**

```markdown
# meetup-cms-app

The **app** repo in the Meetup CMS multirepo workflow. This is where production code lives.

## Quickstart for developers

(Coming in Plan 3 — once the app shell is scaffolded.)

For now, this repo only contains role-aware Claude Code tooling.

## Stack

- FE: TanStack Start
- BE: NestJS
- DB: Postgres (via docker-compose)
- ORM: Drizzle
- Workspace: pnpm + turbo

## Spec

Full multirepo workflow: `meetup-cms-product/docs/architecture/`.
```

- [ ] **Step 3: Write `.gitignore`**

```gitignore
# OS
.DS_Store

# Claude Code local state
.claude/local/
.claude/session/

# Node
node_modules/
.turbo/
.next/
.tanstack/
dist/
build/

# Env
.env
.env.local

# Postgres data
data/postgres/
```

- [ ] **Step 4: Write `.claude/settings.json`**

```json
{
  "permissions": {
    "allow": [
      "Bash(git:*)",
      "Bash(gh issue *)",
      "Bash(gh project *)",
      "Bash(gh label *)",
      "Bash(pnpm:*)",
      "Bash(npx:*)",
      "Bash(docker-compose:*)"
    ]
  }
}
```

- [ ] **Step 5: Verify all files exist**

```bash
ls -la /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app/{CLAUDE.md,README.md,.gitignore,.claude/settings.json}
```

Expected: 4 files listed, no errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app
git add CLAUDE.md README.md .gitignore .claude/settings.json
git commit -m "chore: initial repo skeleton with CLAUDE.md and README"
git push -u origin main
```

Expected: push succeeds; commit visible on GitHub.

---

## Phase B — Vendor skills

Goal: copy raw `SKILL.md` files from `mattpocock/skills` into each repo's `.claude/skills/` folder. No tuning yet — straight copies. Tuning happens in Phase C.

We use `gh api` to fetch the raw content (saves typing + ensures we get the canonical version).

### Task B1: Vendor skills into product repo

**Files:**
- Create: `meetup-cms-product/.claude/skills/to-prd/SKILL.md`
- Create: `meetup-cms-product/.claude/skills/grill-me/SKILL.md`
- Create: `meetup-cms-product/.claude/skills/ubiquitous-language/SKILL.md`
- Create: `meetup-cms-product/.claude/skills/zoom-out/SKILL.md`
- Create: `meetup-cms-product/.claude/skills/caveman/SKILL.md`

- [ ] **Step 1: Vendor skills via gh api**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-product

for skill in to-prd grill-me ubiquitous-language zoom-out caveman; do
  mkdir -p ".claude/skills/$skill"
  gh api "repos/mattpocock/skills/contents/$skill/SKILL.md" --jq '.content' \
    | base64 -d > ".claude/skills/$skill/SKILL.md"
  echo "Vendored: $skill"
done
```

Expected output:
```
Vendored: to-prd
Vendored: grill-me
Vendored: ubiquitous-language
Vendored: zoom-out
Vendored: caveman
```

- [ ] **Step 2: Verify file content**

```bash
head -10 /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-product/.claude/skills/to-prd/SKILL.md
```

Expected: a YAML frontmatter starting with `---` and a `name: to-prd` line.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/
git commit -m "feat: vendor product-side skills (to-prd, grill-me, ubiquitous-language, zoom-out, caveman)"
git push
```

Expected: push succeeds.

---

### Task B2: Vendor skills into design repo

**Files:**
- Create: `meetup-cms-design/.claude/skills/design-an-interface/SKILL.md`
- Create: `meetup-cms-design/.claude/skills/grill-me/SKILL.md`
- Create: `meetup-cms-design/.claude/skills/to-issues/SKILL.md`
- Create: `meetup-cms-design/.claude/skills/zoom-out/SKILL.md`
- Create: `meetup-cms-design/.claude/skills/caveman/SKILL.md`

- [ ] **Step 1: Vendor skills**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-design

for skill in design-an-interface grill-me to-issues zoom-out caveman; do
  mkdir -p ".claude/skills/$skill"
  gh api "repos/mattpocock/skills/contents/$skill/SKILL.md" --jq '.content' \
    | base64 -d > ".claude/skills/$skill/SKILL.md"
  echo "Vendored: $skill"
done
```

Expected: 5 lines of "Vendored: <name>".

- [ ] **Step 2: Verify**

```bash
ls /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-design/.claude/skills/
```

Expected: `caveman  design-an-interface  grill-me  to-issues  zoom-out`.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/
git commit -m "feat: vendor design-side skills (design-an-interface, grill-me, to-issues, zoom-out, caveman)"
git push
```

---

### Task B3: Vendor skills into app repo

**Files:**
- Create: `meetup-cms-app/.claude/skills/grill-me/SKILL.md`
- Create: `meetup-cms-app/.claude/skills/to-issues/SKILL.md`
- Create: `meetup-cms-app/.claude/skills/tdd/SKILL.md` + bundled refs
- Create: `meetup-cms-app/.claude/skills/triage-issue/SKILL.md`
- Create: `meetup-cms-app/.claude/skills/github-triage/SKILL.md`
- Create: `meetup-cms-app/.claude/skills/domain-model/SKILL.md`
- Create: `meetup-cms-app/.claude/skills/improve-codebase-architecture/SKILL.md`
- Create: `meetup-cms-app/.claude/skills/request-refactor-plan/SKILL.md`
- Create: `meetup-cms-app/.claude/skills/qa/SKILL.md`
- Create: `meetup-cms-app/.claude/skills/zoom-out/SKILL.md`
- Create: `meetup-cms-app/.claude/skills/caveman/SKILL.md`

- [ ] **Step 1: Vendor single-file skills**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app

for skill in grill-me to-issues triage-issue github-triage domain-model improve-codebase-architecture request-refactor-plan qa zoom-out caveman; do
  mkdir -p ".claude/skills/$skill"
  gh api "repos/mattpocock/skills/contents/$skill/SKILL.md" --jq '.content' \
    | base64 -d > ".claude/skills/$skill/SKILL.md"
  echo "Vendored: $skill"
done
```

Expected: 10 lines of "Vendored: <name>".

- [ ] **Step 2: Vendor `tdd` (multi-file)**

```bash
mkdir -p .claude/skills/tdd
for file in SKILL.md deep-modules.md interface-design.md mocking.md refactoring.md tests.md; do
  gh api "repos/mattpocock/skills/contents/tdd/$file" --jq '.content' \
    | base64 -d > ".claude/skills/tdd/$file"
  echo "Vendored: tdd/$file"
done
```

Expected: 6 lines of "Vendored: tdd/<file>".

- [ ] **Step 3: Verify**

```bash
ls /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app/.claude/skills/
ls /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app/.claude/skills/tdd/
```

Expected:
- First: 11 directories listed.
- Second: 6 markdown files listed.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/
git commit -m "feat: vendor dev-side skills (tdd, grill-me, to-issues, triage-issue, github-triage, domain-model, qa, etc.)"
git push
```

---

## Phase C — Role-tune skills

Goal: customize the vendored skills so they behave appropriately per role. The most important fine-tunes are:
1. **`to-prd` in product:** writes to `docs/prds/<slug>.md` instead of filing a GitHub issue.
2. **`grill-me` in each repo:** asks role-appropriate questions (PM/UX/tech).
3. **`to-issues` in design + app:** uses correct labels (`role:design` vs `role:app` + `area:fe|be`).
4. **`design-an-interface` in design:** invokes Pencil MCP for variant generation.
5. **`ubiquitous-language` in product:** writes to `docs/glossary.md`.

### Task C1: Fine-tune `to-prd` in product

**Files:**
- Modify: `meetup-cms-product/.claude/skills/to-prd/SKILL.md`

- [ ] **Step 1: Read current vendored content**

```bash
cat /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-product/.claude/skills/to-prd/SKILL.md
```

Note: read the existing structure so you preserve it.

- [ ] **Step 2: Replace with the role-tuned version**

Overwrite `.claude/skills/to-prd/SKILL.md` with:

```markdown
---
name: to-prd
description: Synthesize the current Claude Code conversation into a Product Requirements Document and write it to docs/prds/<YYYY-MM-DD>-<slug>.md. Does NOT file a GitHub issue — that's handled by the cross-repo dispatch action when the file is pushed. Use when user says "draft a PRD", "/draft-prd", or asks to formalize what we've been brainstorming.
---

# Synthesize Conversation → PRD File

You are in the **product** repo. Your job is to take the discussion that has happened in this conversation so far and write it as a PRD file in `docs/prds/`. You do **not** file a GitHub issue. The cross-repo dispatch action takes over once this file is committed and pushed to `main`.

## Output location

`docs/prds/<YYYY-MM-DD>-<slug>.md`

Slug rules:
- Lowercase, hyphenated.
- Derived from the feature name discussed.
- Example: "Article scheduling" → `article-scheduling`.

## Output format

Use the template at `docs/prds/TEMPLATE.md`. Required sections:

- YAML frontmatter (feature slug, status: draft, created date, dispatched: null, issues: empty)
- `# <Feature Title>`
- `## Summary` — one paragraph
- `## User Stories` — bulleted list, "As a / I want / so that"
- `## Acceptance Criteria` — testable behaviors
- `## Scope` — explicit In / Out
- `## Constraints` — hard limits

## What you are NOT doing

- You are not writing technical specs or SDDs.
- You are not enumerating per-role tasks (no "backend: …", no "fe: …").
- You are not filing a GitHub issue.

If the user asks you to include implementation details, decline:

> "Implementation details belong in the app repo's SDD. I can include constraints (perf budgets, security requirements) but not data model or API design."

## Process

1. Synthesize the conversation. Pull out: the user need, the user stories, acceptance criteria, scope boundaries, constraints.
2. If the conversation is sparse, ask brief clarifying questions before drafting (max 3, one at a time).
3. Generate the slug.
4. Write the file at the exact path: `docs/prds/<YYYY-MM-DD>-<slug>.md`.
5. Confirm the path back to the user.
6. Suggest next steps:
   > "PRD written to `docs/prds/<...>.md`. Next: `/grill` to interrogate it for gaps, or commit and push to dispatch issues to design + app."
```

- [ ] **Step 3: Verify the new content**

```bash
head -20 /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-product/.claude/skills/to-prd/SKILL.md
```

Expected: starts with `---`, `name: to-prd`, description mentions writing to `docs/prds/`.

- [ ] **Step 4: Commit**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-product
git add .claude/skills/to-prd/SKILL.md
git commit -m "feat(skills): tune to-prd to write file at docs/prds/<slug>.md (no GH issue)"
git push
```

---

### Task C2: Fine-tune `grill-me` in product (PM-flavored)

**Files:**
- Modify: `meetup-cms-product/.claude/skills/grill-me/SKILL.md`

- [ ] **Step 1: Replace with PM-tuned version**

Overwrite `.claude/skills/grill-me/SKILL.md`:

```markdown
---
name: grill-me
description: Interrogate the active PRD relentlessly for product gaps. Walks every branch of the product decision tree — user stories, edge cases, scope, success criteria, observability, rollout. Refuses to discuss tech. Use when user says "grill me", "/grill", or asks to stress-test a PRD.
disable-model-invocation: true
---

# PM Grill

Interview the user about the open PRD until every branch of the **product** decision tree is resolved.

## Scope

You are in the **product** repo. You ask **product questions only**:

- User stories: who, what, why? Are there edge users we're forgetting?
- Acceptance criteria: how will we know it works? What's the test?
- Scope: what's in, what's out, what's deferred?
- Edge cases: empty state, error state, offline, concurrency, data deletion.
- Success metrics: how do we know it shipped successfully? Adoption? NPS? Funnel?
- Rollout: feature flag? Gradual? All-at-once? Reversible?
- Observability: what do we measure? What alerts do we need?
- Compliance: privacy, accessibility, regulatory.

## What you NEVER ask

- Data model questions ("what columns does the table have?")
- API design questions ("what endpoints?")
- Framework or library questions
- Infrastructure questions
- Anything about how the code will be structured

If a tech question feels relevant, redirect:

> "That's a tech question — it goes in the app repo's SDD. Let me note it as a constraint instead: <reframe>."

## Process

For each question:
1. Ask the question.
2. Provide your **recommended answer** based on the PRD context.
3. Wait for the user to accept, redirect, or expand.
4. Update the PRD inline (open the active file in `docs/prds/`).
5. Move to the next branch.

Never ask a question without a recommended answer. The user's job is to validate or correct, not to do all the thinking.

## Order

Walk the tree in this order: user stories → acceptance criteria → scope → edge cases → success metrics → rollout → observability → compliance.

Stop when you've completed every branch with no open ambiguity.
```

- [ ] **Step 2: Verify**

```bash
head -5 /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-product/.claude/skills/grill-me/SKILL.md
```

Expected: starts with `---`, `name: grill-me`, description mentions "PRD" and "product gaps".

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/grill-me/SKILL.md
git commit -m "feat(skills): tune grill-me for PM (refuses tech questions)"
git push
```

---

### Task C3: Fine-tune `ubiquitous-language` in product

**Files:**
- Modify: `meetup-cms-product/.claude/skills/ubiquitous-language/SKILL.md`

- [ ] **Step 1: Replace with file-targeted version**

Overwrite `.claude/skills/ubiquitous-language/SKILL.md`:

```markdown
---
name: ubiquitous-language
description: Extract domain terms from the current conversation or active PRD and append them to docs/glossary.md. Maintains a shared vocabulary across product, design, and dev. Use when user says "/glossary" or "extract the terms".
disable-model-invocation: true
---

# Ubiquitous Language Glossary

Extract domain terms used in the active PRD (or the current conversation) and add them to `docs/glossary.md`.

## What's a "domain term"?

A term that:
- Has a specific meaning in this product (not generic English).
- Could be misinterpreted if used loosely (e.g., "scheduled" vs "drafted" vs "queued" vs "published").
- Will be referenced by designers and devs downstream.

Skip generic words like "user", "page", "click" — only capture terms with **product-specific weight**.

## Output

Append to `docs/glossary.md`. Use the existing table format:

```markdown
| Term | Definition |
|---|---|
| Scheduled article | An article with a future publish timestamp; not visible to readers until that timestamp passes. |
| ... | ... |
```

If a term already exists in the glossary, **update** the definition only if the new context refines it. Do not duplicate rows.

## Process

1. Read the active PRD (find latest `docs/prds/*.md`).
2. List candidate terms (5-15 max).
3. Show the user the candidates with proposed definitions.
4. User accepts/edits/removes.
5. Append accepted rows to `docs/glossary.md`.
6. Confirm path and row count to the user.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/ubiquitous-language/SKILL.md
git commit -m "feat(skills): tune ubiquitous-language to write docs/glossary.md"
git push
```

---

### Task C4: Fine-tune `grill-me` in design (UX-flavored)

**Files:**
- Modify: `meetup-cms-design/.claude/skills/grill-me/SKILL.md`

- [ ] **Step 1: Replace with UX-tuned version**

Overwrite `.claude/skills/grill-me/SKILL.md` in the design repo:

```markdown
---
name: grill-me
description: Interrogate the active design relentlessly for UX gaps. Walks every branch of the design decision tree — states, accessibility, breakpoints, error/empty/loading. Use when user says "grill me", "/grill", or asks to stress-test a design.
disable-model-invocation: true
---

# UX Grill

Interview the user about the active design until every branch of the **UX** decision tree is resolved.

## Scope

You are in the **design** repo. You ask **UX questions only**:

- States: empty, loading, error, success, partial-data.
- Edge cases: never-used, just-deleted, offline, slow connection.
- Accessibility: keyboard navigation, screen reader, color contrast, focus order.
- Breakpoints: mobile (< 640px), tablet (640-1024px), desktop (> 1024px).
- Internationalization: long strings, RTL, pluralization.
- Interaction model: hover/focus/active states, animations, transitions.
- Error recovery: how does the user undo? Retry? Get help?
- Touch targets: minimum 44px tap target on mobile.

## What you NEVER ask

- Product strategy ("should we even build this?" — that's the PM's repo).
- Tech implementation ("what component library?" — that's the app repo's SDD).

## Process

For each question:
1. Ask the question.
2. Provide your **recommended answer** based on the design context.
3. Wait for the user to accept, redirect, or expand.
4. Update `designs/<slug>/README.md` with the decision.
5. Move to the next branch.

## Order

States → accessibility → breakpoints → i18n → interaction → error recovery → touch targets.
```

- [ ] **Step 2: Commit**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-design
git add .claude/skills/grill-me/SKILL.md
git commit -m "feat(skills): tune grill-me for designer (UX questions only)"
git push
```

---

### Task C5: Fine-tune `to-issues` in design

**Files:**
- Modify: `meetup-cms-design/.claude/skills/to-issues/SKILL.md`

- [ ] **Step 1: Replace with design-tuned version**

Overwrite `.claude/skills/to-issues/SKILL.md` in design repo:

```markdown
---
name: to-issues
description: Split the active design seed issue into smaller design sub-issues. Each gets labels feature:<slug>, role:design. Use when user says "/split-issue" or asks to break down a design.
disable-model-invocation: true
---

# Split Design Seed → Sub-Issues

You are in the **design** repo. The user has a design seed issue open (auto-created by the cross-repo dispatch action). The seed has scope larger than a single design task. Split it.

## Sub-issue characteristics

Each sub-issue should:
- Be **vertically sliced** — one user-visible outcome each (e.g., "empty state", "date picker component", "scheduled badge in list").
- Be **independently designable** — no implicit dependencies on another sub-issue.
- Be small enough that one design session resolves it.

## Required labels

Every sub-issue created MUST have:
- `feature:<slug>` (same as the seed)
- `role:design`
- `feature` (bare label, for project board auto-add)

## Required body

```markdown
## Context
Sub-task of the design seed: meetup-cms-design#<seed-number>
Feature: meetup-cms-product PRD <link>

## Acceptance Criteria
- <specific, demoable design outcome>

## Notes
- <any UX constraints surfaced during /grill>
```

## Process

1. Read the seed issue (use `gh issue view <number>`).
2. Read the related PRD (linked from the seed body).
3. Propose 2-5 sub-issue titles + scopes. Show the user.
4. User accepts/edits.
5. For each accepted sub-issue:
   ```bash
   ISSUE_URL=$(gh issue create \
     --repo horvat-ivan/meetup-cms-design \
     --title "<title>" \
     --body "<body>" \
     --label "feature:<slug>,role:design,feature")
   gh project item-add 1 --owner horvat-ivan --url "$ISSUE_URL"
   ```
6. Comment on the seed: "Split into N sub-issues: #X, #Y, #Z"
7. Report back the issue numbers + URLs to the user.

## What you NEVER do

- Create sub-issues in `meetup-cms-app` (that's the dev's job).
- Create issues without the required label set.
- Skip adding to the project board.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/to-issues/SKILL.md
git commit -m "feat(skills): tune to-issues for design (role:design labels, project add)"
git push
```

---

### Task C6: Fine-tune `design-an-interface` in design

**Files:**
- Modify: `meetup-cms-design/.claude/skills/design-an-interface/SKILL.md`

- [ ] **Step 1: Read current vendored content** (note the existing structure)

```bash
cat /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-design/.claude/skills/design-an-interface/SKILL.md
```

- [ ] **Step 2: Replace with Pencil-aware version**

Overwrite `.claude/skills/design-an-interface/SKILL.md`:

```markdown
---
name: design-an-interface
description: Generate multiple radically different UI variants for the active feature. Uses Pencil MCP if a .pen file is the source-of-truth; falls back to written exploration for Figma users. Dispatches parallel sub-agents per variant. Use when user says "/explore-design".
---

# Explore Design Variants

You are in the **design** repo. The user has just picked up a design seed issue and wants to explore UI variants for the feature.

## Detect the tool

Check `designs/<slug>/`:
- If `source.pen` exists → **Pencil mode** (use `mcp__pencil__*` tools).
- If `figma.url` exists → **Figma mode** (written exploration only — designer translates to Figma manually).
- If neither → ask the user: "Pencil or Figma for this feature?"

## Pencil mode

1. Read the seed issue body (PRD context + acceptance criteria).
2. Open the `.pen` file via `mcp__pencil__open_document`.
3. Dispatch **3 parallel sub-agents** via the Agent tool, each generating a radically different variant:
   - Variant 1: minimal / utilitarian
   - Variant 2: visual / expressive
   - Variant 3: dense / power-user
4. Each sub-agent uses `mcp__pencil__batch_design` to lay out a frame in the .pen file.
5. After all 3 finish, write `designs/<slug>/README.md` with rationale for each variant + tradeoffs.
6. Show the user the three frame names and ask which to refine.

## Figma mode

1. Read the seed issue body.
2. Generate **3 written variants** in `designs/<slug>/README.md`:
   - Each variant: layout description, primary interactions, tradeoffs.
3. Tell the user: "Translate variant <N> into Figma. Update `figma.url` when done."

## Output structure

```
designs/<slug>/
├── README.md          (this file — rationale, decisions, a11y notes)
├── source.pen         (Pencil mode — modified by you)
└── figma.url          (Figma mode — written by designer)
```

## What you NEVER do

- Generate variants without reading the PRD context first.
- Skip the README.md write — rationale is as important as the visuals.
- Make product strategy decisions ("should we even include this feature?").
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/design-an-interface/SKILL.md
git commit -m "feat(skills): tune design-an-interface for Pencil + Figma modes"
git push
```

---

### Task C7: Fine-tune `grill-me` in app (tech-flavored)

**Files:**
- Modify: `meetup-cms-app/.claude/skills/grill-me/SKILL.md`

- [ ] **Step 1: Replace with tech-tuned version**

Overwrite `.claude/skills/grill-me/SKILL.md` in app repo:

```markdown
---
name: grill-me
description: Interrogate the active SDD relentlessly for technical gaps. Walks every branch of the technical decision tree — data model, API contracts, error paths, perf, auth, migrations, deployment. Use when user says "grill me", "/grill", or asks to stress-test a technical approach.
disable-model-invocation: true
---

# Tech Grill

Interview the user about the active technical approach until every branch of the **technical** decision tree is resolved.

## Scope

You are in the **app** repo. You ask **technical questions only**:

- Data model: schema, indexes, foreign keys, nullable columns, default values.
- API contracts: endpoints, methods, request/response shapes, status codes, error codes.
- Validation: server-side, client-side, what happens on bad input.
- Auth: who can perform this action? Resource ownership? Multi-tenancy?
- Errors: timeout? Retry? Circuit breaker? User-facing message?
- Performance: query plan, N+1 risk, caching layer, expected QPS.
- Concurrency: race conditions, locking, idempotency keys.
- Migrations: schema change strategy, backfill, rollback plan.
- Deployment: feature flag? Gradual rollout? Blast radius if it breaks?
- Observability: logs, metrics, traces, alerts. What's the SLO?
- Testing: unit boundary, integration scope, e2e necessity.

## What you NEVER ask

- Product strategy questions.
- UX/design questions.

## Process

For each question:
1. Ask the question.
2. Provide your **recommended answer** based on the SDD context, the PRD, and the existing codebase patterns.
3. Wait for the user to accept, redirect, or expand.
4. Update `docs/sdd/<slug>.md` inline with the decision.
5. Move to the next branch.

## Order

Data model → API contracts → validation → auth → errors → perf → concurrency → migrations → deployment → observability → testing.
```

- [ ] **Step 2: Commit**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app
git add .claude/skills/grill-me/SKILL.md
git commit -m "feat(skills): tune grill-me for dev (SDD-style tech questions)"
git push
```

---

### Task C8: Fine-tune `to-issues` in app

**Files:**
- Modify: `meetup-cms-app/.claude/skills/to-issues/SKILL.md`

- [ ] **Step 1: Replace with dev-tuned version**

Overwrite `.claude/skills/to-issues/SKILL.md`:

```markdown
---
name: to-issues
description: Split the active app seed issue into FE/BE sub-issues based on the SDD. Each gets labels feature:<slug>, role:app, and area:fe or area:be. Use when user says "/split-issue".
disable-model-invocation: true
---

# Split App Seed → FE/BE Sub-Issues

You are in the **app** repo. The user has a seed issue open (auto-created by dispatch) and an SDD written. Split the work.

## Sub-issue characteristics

Each sub-issue should:
- Be **vertically sliced** for FE (one user-visible outcome).
- Be **horizontally sliced** for BE (one endpoint, one job, one schema change).
- Be **independently testable**.
- Have an explicit `area:fe` OR `area:be` label.

## Required labels

Every sub-issue MUST have:
- `feature:<slug>` (same as seed)
- `role:app`
- `area:fe` OR `area:be` (exactly one)
- `feature` (bare, for project)

## Required body

```markdown
## Context
Sub-task of the app seed: meetup-cms-app#<seed-number>
SDD: docs/sdd/<slug>.md
Feature: meetup-cms-product PRD <link>

## Acceptance Criteria
- <specific, testable behavior>

## Technical Notes
- <data model, API contract, perf budget — referenced from SDD>
```

## Process

1. Read the seed issue (`gh issue view <number>`).
2. Read the SDD (`docs/sdd/<slug>.md`).
3. Propose sub-issues, separating FE from BE:
   - BE first (data model + API + jobs).
   - FE second (UI components, state mgmt, screen wiring).
4. Show the user the proposed split.
5. For each accepted sub-issue:
   ```bash
   AREA_LABEL="area:fe"  # or area:be
   ISSUE_URL=$(gh issue create \
     --repo horvat-ivan/meetup-cms-app \
     --title "[$AREA_LABEL] <title>" \
     --body "<body>" \
     --label "feature:<slug>,role:app,$AREA_LABEL,feature")
   gh project item-add 1 --owner horvat-ivan --url "$ISSUE_URL"
   ```
6. Comment on the seed listing the sub-issues.
7. Report back to user.

## What you NEVER do

- Create sub-issues in design or product.
- Create a sub-issue without `area:fe` or `area:be`.
- Skip the project board add.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/to-issues/SKILL.md
git commit -m "feat(skills): tune to-issues for dev (FE/BE split with area: labels)"
git push
```

---

## Phase D — Slash commands

Slash commands are markdown files in `.claude/commands/`. Each is a thin wrapper that invokes the relevant skill.

### Task D1: Product repo slash commands

**Files:**
- Create: `meetup-cms-product/.claude/commands/draft-prd.md`
- Create: `meetup-cms-product/.claude/commands/grill.md`
- Create: `meetup-cms-product/.claude/commands/glossary.md`
- Create: `meetup-cms-product/.claude/commands/zoom-out.md`

- [ ] **Step 1: Write `draft-prd.md`**

```markdown
---
description: Brainstorm a feature with me, then synthesize the conversation into a PRD file at docs/prds/<slug>.md
---

You are about to help the user draft a Product Requirements Document.

Workflow:
1. First, run the **superpowers:brainstorming** skill to elicit the feature definition through clarifying questions.
2. Once you have enough context (purpose, user stories, acceptance criteria, scope, constraints), run the **to-prd** skill to synthesize the conversation into a PRD file.
3. The output goes to `docs/prds/<YYYY-MM-DD>-<slug>.md`.

Remember: this repo is for **product**, not technical. Refuse any tech questions and redirect them to the app repo's `/design-doc`.

User input: $ARGUMENTS
```

- [ ] **Step 2: Write `grill.md`**

```markdown
---
description: Interrogate the active PRD for product gaps (user stories, edge cases, scope, success metrics, rollout)
---

Run the **grill-me** skill on the active (most recently modified) PRD in `docs/prds/`. Walk every branch of the product decision tree.

If no PRD is active, ask the user which PRD to grill.

User input: $ARGUMENTS
```

- [ ] **Step 3: Write `glossary.md`**

```markdown
---
description: Extract domain terms from the active PRD or conversation and append them to docs/glossary.md
---

Run the **ubiquitous-language** skill. Extract domain terms (product-specific vocabulary) and append them to `docs/glossary.md`.

User input: $ARGUMENTS
```

- [ ] **Step 4: Write `zoom-out.md`**

```markdown
---
description: Step back to a higher level of abstraction and explain how the current work fits into the bigger picture
---

Run the **zoom-out** skill.

User input: $ARGUMENTS
```

- [ ] **Step 5: Verify**

```bash
ls /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-product/.claude/commands/
```

Expected: `draft-prd.md  glossary.md  grill.md  zoom-out.md`.

- [ ] **Step 6: Commit**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-product
git add .claude/commands/
git commit -m "feat: add product slash commands (/draft-prd, /grill, /glossary, /zoom-out)"
git push
```

---

### Task D2: Design repo slash commands

**Files:**
- Create: `meetup-cms-design/.claude/commands/explore-design.md`
- Create: `meetup-cms-design/.claude/commands/grill.md`
- Create: `meetup-cms-design/.claude/commands/split-issue.md`
- Create: `meetup-cms-design/.claude/commands/zoom-out.md`

- [ ] **Step 1: Write `explore-design.md`**

```markdown
---
description: Generate UI variants for the active design seed issue, using Pencil MCP or Figma fallback
---

Run the **design-an-interface** skill. Detect Pencil vs Figma based on `designs/<slug>/source.pen` or `figma.url`.

If the active design seed isn't obvious, ask the user which feature to explore.

User input: $ARGUMENTS
```

- [ ] **Step 2: Write `grill.md`**

```markdown
---
description: Interrogate the active design for UX gaps (states, accessibility, breakpoints, error/empty/loading)
---

Run the **grill-me** skill. Walk every branch of the UX decision tree.

If no design is active, ask the user which feature to grill.

User input: $ARGUMENTS
```

- [ ] **Step 3: Write `split-issue.md`**

```markdown
---
description: Split the active design seed into smaller design sub-issues with feature/role labels
---

Run the **to-issues** skill. Read the seed issue and the linked PRD, propose sub-issues, get user approval, then create them with the required labels and add to the project board.

User input: $ARGUMENTS
```

- [ ] **Step 4: Write `zoom-out.md`**

```markdown
---
description: Step back to a higher level of abstraction
---

Run the **zoom-out** skill.

User input: $ARGUMENTS
```

- [ ] **Step 5: Commit**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-design
git add .claude/commands/
git commit -m "feat: add design slash commands (/explore-design, /grill, /split-issue, /zoom-out)"
git push
```

---

### Task D3: App repo slash commands

**Files:**
- Create: `meetup-cms-app/.claude/commands/design-doc.md`
- Create: `meetup-cms-app/.claude/commands/grill.md`
- Create: `meetup-cms-app/.claude/commands/split-issue.md`
- Create: `meetup-cms-app/.claude/commands/tdd.md`
- Create: `meetup-cms-app/.claude/commands/zoom-out.md`

- [ ] **Step 1: Write `design-doc.md`**

```markdown
---
description: Interrogate the technical approach via grill-me and write a Software Design Document at docs/sdd/<slug>.md
---

You are about to help the user write a Software Design Document.

Workflow:
1. Read the active app seed issue (most recently created `seed`-labeled issue in this repo).
2. Read the linked PRD from the issue body.
3. Run the **grill-me** skill in tech-flavor — walk every branch (data model, API, validation, auth, errors, perf, concurrency, migrations, deployment, observability, testing).
4. As decisions are made, write them to `docs/sdd/<YYYY-MM-DD>-<slug>.md`.
5. The SDD becomes the contract for the FE/BE sub-issue split.

User input: $ARGUMENTS
```

- [ ] **Step 2: Write `grill.md`**

```markdown
---
description: Interrogate any plan, SDD, or design for technical gaps
---

Run the **grill-me** skill (tech-flavored).

If no SDD or plan is active, ask the user what to grill.

User input: $ARGUMENTS
```

- [ ] **Step 3: Write `split-issue.md`**

```markdown
---
description: Split the active app seed into FE/BE sub-issues based on the SDD
---

Run the **to-issues** skill. Read the seed and the SDD, propose FE and BE sub-issues, get user approval, create them with `area:fe` or `area:be` labels, add to project board.

User input: $ARGUMENTS
```

- [ ] **Step 4: Write `tdd.md`**

```markdown
---
description: Pick up an open sub-issue and drive red-green-refactor implementation
---

Run the **tdd** skill on the sub-issue specified by the user (or the highest-priority open `area:*`-labeled issue if not specified).

User input: $ARGUMENTS
```

- [ ] **Step 5: Write `zoom-out.md`**

```markdown
---
description: Step back to a higher level of abstraction
---

Run the **zoom-out** skill.

User input: $ARGUMENTS
```

- [ ] **Step 6: Commit**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app
git add .claude/commands/
git commit -m "feat: add app slash commands (/design-doc, /grill, /split-issue, /tdd, /zoom-out)"
git push
```

---

## Phase E — Pre-create GitHub labels

Goal: every label our actions and skills will use exists in all 3 repos before any feature dispatch happens.

### Task E1: Create labels in all 3 repos

**Files:** none (only GitHub state).

- [ ] **Step 1: Define labels in a script-friendly form**

Labels to create in each repo:

| Name | Color | Description |
|---|---|---|
| `feature` | `0E8A16` (green) | Bare label for project board auto-add |
| `role:product` | `1D76DB` (blue) | Issue lives in the PM/product flow |
| `role:design` | `B60205` (red) | Issue lives in the design flow |
| `role:app` | `FBCA04` (yellow) | Issue lives in the app flow |
| `seed` | `D4C5F9` (lavender) | Auto-created seed issue (vs sub-issue) |
| `area:fe` | `C5DEF5` (light blue) | Frontend sub-issue (app repo only) |
| `area:be` | `BFD4F2` (light blue) | Backend sub-issue (app repo only) |

- [ ] **Step 2: Run label creation for all 3 repos**

```bash
for repo in meetup-cms-product meetup-cms-design meetup-cms-app; do
  echo "=== $repo ==="
  gh label create "feature" --repo "horvat-ivan/$repo" --color "0E8A16" --description "Bare label for project board auto-add" --force
  gh label create "role:product" --repo "horvat-ivan/$repo" --color "1D76DB" --description "Issue lives in the PM/product flow" --force
  gh label create "role:design" --repo "horvat-ivan/$repo" --color "B60205" --description "Issue lives in the design flow" --force
  gh label create "role:app" --repo "horvat-ivan/$repo" --color "FBCA04" --description "Issue lives in the app flow" --force
  gh label create "seed" --repo "horvat-ivan/$repo" --color "D4C5F9" --description "Auto-created seed issue (vs sub-issue)" --force
done
```

`--force` updates the label if it already exists (safe to re-run).

- [ ] **Step 3: Add area labels (app repo only)**

```bash
gh label create "area:fe" --repo "horvat-ivan/meetup-cms-app" --color "C5DEF5" --description "Frontend sub-issue" --force
gh label create "area:be" --repo "horvat-ivan/meetup-cms-app" --color "BFD4F2" --description "Backend sub-issue" --force
```

- [ ] **Step 4: Verify all labels exist**

```bash
for repo in meetup-cms-product meetup-cms-design meetup-cms-app; do
  echo "=== $repo ==="
  gh label list --repo "horvat-ivan/$repo"
done
```

Expected:
- product + design: `feature`, `role:app`, `role:design`, `role:product`, `seed`
- app: same 5 + `area:fe`, `area:be` (7 total)

Note: there's no commit step here — labels are GitHub state, not files.

---

## Phase F — Configure GitHub Project board

Goal: customize the project board's Status field and create role-specific saved views.

### Task F1: Configure Status field values

**Files:** none (GitHub state only).

- [ ] **Step 1: Get project ID**

```bash
gh project view 1 --owner horvat-ivan --format json | jq -r '.id'
```

Expected: a string like `PVT_kwHO...`. Save it for the next steps. Call it `PROJECT_ID`.

- [ ] **Step 2: Get the Status field ID and its current option IDs**

```bash
gh project field-list 1 --owner horvat-ivan --format json | jq '.fields[] | select(.name == "Status")'
```

Expected: a JSON object with `id` (the field ID) and `options` (the current option list). Note the field ID; call it `STATUS_FIELD_ID`.

- [ ] **Step 3: Replace Status options manually via the UI**

Programmatic option editing on Projects v2 is awkward (requires GraphQL mutations). For a 6-value list, do it through the UI:

1. Visit https://github.com/users/horvat-ivan/projects/1
2. Click on a card or click into the Status column header.
3. Click **Edit values**.
4. Replace the existing values with:
   - `Backlog`
   - `In Design`
   - `In Dev`
   - `In Review`
   - `Done`
   - `Blocked`
5. Save.

(Note: this is a one-time manual step. Subsequent automation handles status transitions, not creation.)

- [ ] **Step 4: Verify**

```bash
gh project field-list 1 --owner horvat-ivan --format json | jq '.fields[] | select(.name == "Status") | .options[].name'
```

Expected output:
```
Backlog
In Design
In Dev
In Review
Done
Blocked
```

---

### Task F2: Create saved views per role

**Files:** none (GitHub state only).

- [ ] **Step 1: Create the PM view**

Visit https://github.com/users/horvat-ivan/projects/1.

1. Click `+ New view` next to existing tab(s).
2. Layout: **Board** (or **Table** — pick the one you'll demo with).
3. Name: `PM`.
4. Filter: `label:role:product`
5. Save.

- [ ] **Step 2: Create the Design view**

1. Click `+ New view`.
2. Layout: same as above.
3. Name: `Design`.
4. Filter: `label:role:design`
5. Save.

- [ ] **Step 3: Create the Dev view**

1. Click `+ New view`.
2. Layout: same.
3. Name: `Dev`.
4. Filter: `label:role:app`
5. Save.

- [ ] **Step 4: Verify**

You should now have at least 3 named views (`PM`, `Design`, `Dev`) plus any defaults. Each filtered correctly.

Manual visual check: click each view, expect it to show no items (we haven't created any feature issues yet — that's Plan 2). The empty state confirms the filter is correct.

---

## Phase G — End-to-end smoke test (manual)

Goal: confirm Phase A–F worked by exercising the slash commands locally in Claude Code. No code is written here — just verification.

### Task G1: Verify product repo

**Files:** none.

- [ ] **Step 1: Open a fresh Claude Code session in product repo**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-product
# Start Claude Code (or your IDE Claude integration)
```

- [ ] **Step 2: Run `/draft-prd` with a tiny feature**

In Claude Code, type:
```
/draft-prd let's add a basic ping endpoint that returns OK
```

Expected behavior:
- Claude invokes the brainstorming skill, asks 1-3 clarifying product questions.
- Refuses to discuss endpoint implementation details (says "that's a tech question").
- Eventually offers to write a PRD file at `docs/prds/<date>-ping-endpoint.md`.

If the model tries to give technical details, the CLAUDE.md fine-tune isn't being read — debug.

- [ ] **Step 3: Discard test PRD**

If a test file got written, delete it (don't push):
```bash
rm docs/prds/<date>-ping-endpoint.md  # if created
```

- [ ] **Step 4: Run `/zoom-out`**

```
/zoom-out what's the structure of this repo?
```

Expected: a high-level tour of the product repo's purpose and folders.

---

### Task G2: Verify design repo

**Files:** none.

- [ ] **Step 1: Open Claude Code in design repo**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-design
```

- [ ] **Step 2: Run `/grill` with a fake design context**

```
/grill imagine I'm designing a date picker for scheduling articles. Grill me.
```

Expected:
- UX questions only (states, a11y, breakpoints).
- No tech questions ("what library?" etc.).
- Refuses if you push it toward product strategy ("should we even build this?").

- [ ] **Step 3: Verify the role gate**

```
/grill what's the right database schema for this?
```

Expected: refuses, redirects to the app repo.

---

### Task G3: Verify app repo

**Files:** none.

- [ ] **Step 1: Open Claude Code in app repo**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app
```

- [ ] **Step 2: Run `/grill` with a fake tech context**

```
/grill imagine I'm building a scheduled-publish background job for articles. Grill me.
```

Expected:
- Tech questions only (data model, concurrency, error recovery, observability).
- Provides a recommended answer per question.

- [ ] **Step 3: Verify the role gate**

```
/grill should we even build article scheduling?
```

Expected: refuses, redirects to product repo.

---

## Definition of done — Plan 1

After all phases complete, the following are true:

- [ ] All 3 repos on GitHub have at least one commit on `main`.
- [ ] Each repo has CLAUDE.md with role-specific guardrails.
- [ ] Each repo has a fully populated `.claude/skills/` with role-tuned skills.
- [ ] Each repo has slash commands invoking the skills.
- [ ] All 3 repos have the `feature`, `role:*`, and `seed` labels (app also has `area:*`).
- [ ] GitHub Project #1's Status field has 6 values (`Backlog`, `In Design`, `In Dev`, `In Review`, `Done`, `Blocked`).
- [ ] GitHub Project has 3 role-filtered saved views (`PM`, `Design`, `Dev`).
- [ ] Manual smoke test passed for each repo's slash commands.

**Plan 2 starts here:** with this foundation in place, Plan 2 builds the cross-repo `feature-dispatch`, `feature-status-sync`, and `pr-link` GitHub Actions, plus their backing JS scripts. After Plan 2, pushing a PRD will materialize issues in all 3 repos automatically.

**Plan 3 starts after Plan 2:** scaffolds the TanStack Start + NestJS + Postgres app shell, then preps the demo (pre-cooked PR, presentation notes, dry-run).
