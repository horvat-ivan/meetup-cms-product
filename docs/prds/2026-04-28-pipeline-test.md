---
feature: pipeline-test
status: dispatched
created: '2026-04-28'
dispatched: '2026-04-28'
issues:
  product: 'https://github.com/horvat-ivan/meetup-cms-product/issues/2'
  design: 'https://github.com/horvat-ivan/meetup-cms-design/issues/2'
  app: 'https://github.com/horvat-ivan/meetup-cms-app/issues/2'
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
