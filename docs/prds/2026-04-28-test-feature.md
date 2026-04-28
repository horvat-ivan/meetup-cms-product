---
feature: test-feature
status: dispatched
created: '2026-04-28'
dispatched: '2026-04-28'
issues:
  product: 'https://github.com/horvat-ivan/meetup-cms-product/issues/1'
  design: 'https://github.com/horvat-ivan/meetup-cms-design/issues/1'
  app: 'https://github.com/horvat-ivan/meetup-cms-app/issues/1'
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
