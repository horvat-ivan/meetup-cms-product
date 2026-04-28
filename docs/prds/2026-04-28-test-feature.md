---
feature: test-feature
status: draft
created: 2026-04-28
dispatched: null
issues:
  product: null
  design: null
  app: null
---

# Test Feature

## Summary
A throwaway feature used to verify the dispatch + sync pipeline works end-to-end.

## User Stories
- As a developer testing the pipeline, I want to push a PRD and see issues materialize.

## Acceptance Criteria
- Dispatch action fires on push.
- 1 parent issue + 2 seed issues are created across the 3 repos.
- All 3 issues land on the unified Project board.
- PRD frontmatter is auto-updated to status:dispatched.

## Scope
- In: pipeline verification
- Out: anything real

## Constraints
- Must be retractable cleanly.
