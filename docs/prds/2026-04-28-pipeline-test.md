---
feature: pipeline-test
status: draft
created: 2026-04-28
dispatched: null
issues:
  product: null
  design: null
  app: null
---

# Pipeline Test

## Summary
Validate the dispatch + project-add pipeline end-to-end after the GraphQL fix. Throwaway feature; will be retracted once verified.

## User Stories
- As the workflow author, I want a fresh PRD push to land 3 issues across 3 repos and add all of them to project #1, with no manual steps.

## Acceptance Criteria
- Dispatch action fires on push.
- Parent + design seed + app seed issues created.
- All 3 issues appear on the unified project board automatically (via GraphQL).
- PRD frontmatter is patched to `status: dispatched` with all 3 URLs.
- Auto-commit pushes the PRD update back to main.

## Scope
- In: pipeline verification
- Out: anything real

## Constraints
- Retractable cleanly via `git rm`.
