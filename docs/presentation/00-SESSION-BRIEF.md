# Specs to Production — Session Brief

> **Read this first.** This is the entry point for the presentation-creation session. It compresses everything that was built in the prior multi-day building sessions into one page so future work can focus on the **talk**, not the implementation.

---

## What this presentation is about

**Headline (one sentence, repeat at start and end of talk):**

> Domain experts wield AI as a tool. The workflow's job is to amplify expertise — not replace it.

**What it is NOT about:**
- A specific CMS app. The blog CMS in `meetup-cms-app` is just a stage. Mention it in passing; do not demo CRUD features.
- AI replacing humans. The framing is anti-vibe-coding: AI as a sharpener for domain experts, not a substitute for them.
- Multirepo vs. monorepo religion. The point is **role-shaped workspaces**, however many repos that takes.

**What it IS about:**
- How a small product team (PM + designer + dev) can collaborate on a feature without forcing each role to context-switch into the others' tools.
- How automation propagates a feature from a written spec all the way to actionable engineering work without manual handoffs.
- How the same AI primitive (interrogation, decomposition, exploration) shows up in three role-specific lenses across three workspaces.

---

## The audience problem (open the talk with this)

Pick whichever of these resonates with the audience:

- **Hand-offs leak.** Slack threads die, Figma comments are unread, Notion PRDs drift from Jira tickets. The PM's intent rarely survives the trip to a shipped feature.
- **Context-switching kills focus.** A designer has to navigate around dev branches; a PM has to learn Github Projects to track design progress; a dev has to read Notion. Nobody works in their own home base.
- **AI hype skips expertise.** "Just vibe-code it." Then it ships, then it breaks, then someone with actual product/UX/engineering judgment has to clean up.

The workflow is the answer to all three.

---

## The one-diagram explanation

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   PRODUCT REPO   │  │   DESIGN REPO    │  │     APP REPO     │
│                  │  │                  │  │                  │
│  PM workspace    │  │ Designer space   │  │   Dev workspace  │
│  • PRD markdown  │  │ • Pencil/Figma   │  │   • Real code    │
│  • PM-grill skill│  │ • UX-grill skill │  │   • Tech-grill   │
│  • /draft-prd    │  │ • /explore-design│  │   • /design-doc  │
│                  │  │ • /split-issue   │  │   • /split-issue │
│  + dispatch +    │  │                  │  │   • /tdd         │
│    sync actions  │  │                  │  │                  │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                     │
         │   GitHub Actions automation               │
         └────────────────┬────┴───────────┬─────────┘
                          ▼                ▼
                ┌──────────────────────────────────┐
                │  Unified GitHub Project (board)  │
                │  • PM view  • Design view        │
                │  • Dev view  • One source of truth│
                └──────────────────────────────────┘
```

Three role-shaped repos, one shared dashboard, automation in the middle. Each role lives in their own repo and never has to touch another's working files. The board is the only place where everyone sees the same thing.

---

## What was built (compressed)

**Three GitHub repos** under `horvat-ivan`, all public:
- `meetup-cms-product` — PRDs, glossary, dispatch + status-sync GitHub Actions, all presentation docs.
- `meetup-cms-design` — per-feature design folders (`designs/<slug>/`), Pencil/Figma agnostic.
- `meetup-cms-app` — pnpm workspace with TanStack Start FE + NestJS API + Drizzle/Postgres backing a working blog CMS.

**Cross-repo automation** (the magic moment of the talk):
- `feature-dispatch.yml` — push a PRD → a parent issue, a design seed, an app seed appear automatically across the three repos and land on the project board.
- `feature-status-sync.yml` — hourly cron rebuilds the parent issue's checklist from current state, updates PRD frontmatter (`status: in-progress` / `completed`, `progress: X/Y`).
- `pr-link.yml` — when designer or dev splits work into sub-issues, a comment auto-posts on the parent for instant PM visibility.

**Per-role AI tooling** vendored from `mattpocock/skills` and tuned per repo:
- Same primitive (`grill-me`), three lenses: PM-grill (user stories, edge cases), UX-grill (states, a11y), tech-grill (data model, perf, migrations).
- Slash commands wrap the skills: `/draft-prd`, `/explore-design`, `/design-doc`, `/split-issue`, `/grill`, etc.
- `CLAUDE.md` per repo enforces role boundaries — PM repo refuses tech questions, app repo refuses product strategy.

**A working CMS** (the stage, not the show):
- Blog CMS that runs locally with `docker-compose up -d && pnpm install && pnpm db:migrate && pnpm db:seed && pnpm dev`.
- Three seeded articles, full CRUD UI.
- Tag `v0-baseline` marks the state before the demo feature would land.

**What's NOT yet built (deferred for the presentation session):**
- Pre-cooked `feature/article-scheduling` branch (the talk's closing beat — "and TDD took it from here").
- The presentation materials themselves: outline, demo-script, backup-prd, FAQ.
- A dry-run rehearsal.

---

## Architectural decisions worth knowing on stage

These are likely Q&A topics. Have crisp answers ready.

| Decision | Why | When asked |
|---|---|---|
| Three repos, not a monorepo | Roles are real; each role gets a workspace shaped to their tools and pacing | "Don't you want a monorepo?" |
| One PRD = one feature, no per-role task list in the PRD | PMs don't define technical decomposition; each role decomposes inside their own repo | "Why doesn't the PRD spell out backend tasks?" |
| Parallel seeds (design + app spawn at PRD push) | Devs can scaffold non-UI work in parallel with design exploration | "Doesn't dev have to wait for design?" |
| Flat checklist on the parent issue (not grouped) | Verbose by design; visibility over brevity | "Won't the parent issue get long?" |
| Cron status sync (not webhooks) | No infrastructure to maintain; hourly is fine for human pace | "Why not real-time?" |
| Vendored skills (copied, not installed via package manager) | Full control, no surprise updates, role-specific tuning lives in git | "Why not import the skills?" |
| Tool-agnostic design (Pencil OR Figma) | Designers shouldn't be forced into a tool because of the workflow | "What if the designer uses Sketch?" |

---

## What we learned during construction (use as side-bar moments in the talk)

These were real bugs found during implementation. Each one is a small story you can drop in if pacing allows.

- **YAML date auto-coercion** silently broke the PRD parser until we coerced `Date` instances back to strings. Lesson: silent type coercion in DSLs always finds you.
- **gray-matter shallow-copy mutation** poisoned subsequent calls because the same `PRD_CONTENT` string returned the same shared object. Fixed with a deep-clone. Lesson: defensive immutability matters for libs that look pure.
- **`gh project item-add` doesn't work with `GH_TOKEN`** in GitHub Actions ("unknown owner type"). Fixed by switching to GraphQL. Lesson: the polished CLI command isn't always the most reliable in non-interactive contexts.
- **Per-feature labels need to exist before issues use them.** Added an `ensureLabel` step before issue creation. Lesson: GitHub validates labels at issue-create time.
- **TanStack Start API drifted significantly** between when the plan was written and when it was executed (`@tanstack/start` → `@tanstack/react-start`, Vinxi dropped, etc.). Lesson: bleeding-edge tooling means the plan is a starting point, not a contract.

These don't have to be in the talk — but if you want a humble "things weren't easy" beat, pick one or two.

---

## Presentation craft notes (use these)

Best practices to apply when designing the actual deck and demo flow:

- **One headline. Repeat it at minute 0 and minute 14.** The headline is at the top of this doc.
- **Three things, max.** Audiences remember three. Pick three: e.g. "role-shaped repos", "AI as a sharpener", "automation as the connective tissue".
- **Demo > slides.** A live (or near-live) workflow demo is worth ten bullet points. The talk is structured around eight beats; six of them are demos, two are slides.
- **Cold open with a moment.** Don't start with "thanks for having me." Start with the magic moment (issues materialize) or with a punchy contradiction ("Most product teams don't have a workflow problem. They have a hand-off problem.").
- **Don't apologize for missing things.** If Pencil hangs, say "in the interest of time" — don't say "sorry, this isn't working."
- **End with the headline, not Q&A.** The last line they hear should be the headline reprised. Q&A comes after that.
- **Backup paths everywhere.** Pre-cooked PRD, pre-cooked PR, screenshots in the deck for any UI you'll show. Live failure on stage is forgivable; stalling is not.
- **Time the talk twice in private before the day.** Once for content, once for pacing. Cut, don't compress.

---

## Where the canonical sources live

If a future session needs depth, these are the files to read first:

- `meetup-cms-product/docs/architecture/2026-04-27-meetup-cms-multirepo-design.md` — the spec. The "why" behind every decision.
- `meetup-cms-product/docs/architecture/plans/2026-04-27-meetup-cms-foundations-plan.md` — Plan 1: skeletons, skills, commands, labels.
- `meetup-cms-product/docs/architecture/plans/2026-04-28-meetup-cms-automation-plan.md` — Plan 2: dispatch + sync + pr-link Actions.
- `meetup-cms-product/docs/architecture/plans/2026-04-28-meetup-cms-app-scaffold-plan.md` — Plan 3: app scaffold (A–E done) + pre-cooked feature (F, pending) + presentation materials (G, pending) + dry-run (H, pending).
- `meetup-cms-product/docs/prds/TEMPLATE.md` — PRD shape PM uses with `/draft-prd`.

External references worth citing if asked:
- `mattpocock/skills` (GitHub) — source of the vendored skills.
- TanStack Start docs — only for "why TanStack" questions; the talk doesn't dwell on stack choices.

---

## Suggested next-session focus (in priority order)

1. **Write the slide deck.** Headline slide, 3-key-points slide, "before/after" slide, closing slide. Keep it minimal — slides support the demo, they are not the demo.
2. **Write `outline.md`.** Beat-by-beat with timing, reusing the structure already drafted in the spec under "Demo storyline."
3. **Write `demo-script.md`.** Exact commands for each beat. Read verbatim if needed.
4. **Build the pre-cooked `feature/article-scheduling` branch** (Plan 3 Phase F). This is the closing beat of the talk; without it, beat 7 has nothing to show.
5. **Write `backup-prd.md`** so live brainstorming has a fallback if it derails.
6. **Write `faq.md`** to anticipate questions and prep crisp answers.
7. **Dry-run twice in private.** Time it. Cut anything that doesn't earn its seconds.

That's the work. Everything from steps 1-7 is **content authoring + rehearsal**, not engineering. The engineering side is done.

---

## Talk metadata

- **Working title:** "Specs to Production — Multirepo Setup"
- **Duration target:** 15-20 minutes
- **Demo style:** walkthrough-only (pre-cooked PR shown at the end, no live coding)
- **Audience:** product engineers, PMs, designers — anyone shipping features in small teams
- **Author:** Ivan Horvat (Reactor.studio)
