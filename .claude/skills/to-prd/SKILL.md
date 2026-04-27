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
