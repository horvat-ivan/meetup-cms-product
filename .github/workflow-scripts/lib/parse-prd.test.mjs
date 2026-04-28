import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePrd, serializePrd, isDraft, extractSummary } from './parse-prd.mjs';

const SAMPLE = `---
feature: article-scheduling
status: draft
created: 2026-04-28
dispatched: null
issues:
  product: null
  design: null
  app: null
---

# Article Scheduling

## Summary
Editors can schedule articles to publish at a future date.

## User Stories
- As an editor, I want to set a future publish time.

## Acceptance Criteria
- A draft article can be assigned a future ISO timestamp.

## Scope
- In: scheduling, cancellation
- Out: timezone selection

## Constraints
- UTC only.
`;

test('parsePrd extracts frontmatter', () => {
  const prd = parsePrd(SAMPLE);
  assert.equal(prd.frontmatter.feature, 'article-scheduling');
  assert.equal(prd.frontmatter.status, 'draft');
  assert.equal(prd.frontmatter.created, '2026-04-28');
});

test('parsePrd extracts slug from frontmatter', () => {
  const prd = parsePrd(SAMPLE);
  assert.equal(prd.slug, 'article-scheduling');
});

test('parsePrd extracts title from first H1', () => {
  const prd = parsePrd(SAMPLE);
  assert.equal(prd.title, 'Article Scheduling');
});

test('parsePrd preserves body content', () => {
  const prd = parsePrd(SAMPLE);
  assert.match(prd.body, /## Summary/);
  assert.match(prd.body, /## User Stories/);
});

test('isDraft returns true for status:draft', () => {
  const prd = parsePrd(SAMPLE);
  assert.equal(isDraft(prd), true);
});

test('isDraft returns false for status:dispatched', () => {
  const prd = parsePrd(SAMPLE.replace('status: draft', 'status: dispatched'));
  assert.equal(isDraft(prd), false);
});

test('serializePrd round-trips correctly', () => {
  const prd = parsePrd(SAMPLE);
  const out = serializePrd(prd);
  const reparsed = parsePrd(out);
  assert.deepEqual(reparsed.frontmatter, prd.frontmatter);
});

test('serializePrd includes updated frontmatter', () => {
  const prd = parsePrd(SAMPLE);
  prd.frontmatter.status = 'dispatched';
  prd.frontmatter.dispatched = '2026-04-28';
  const out = serializePrd(prd);
  assert.match(out, /status: dispatched/);
  assert.match(out, /dispatched: '?2026-04-28'?/);
});

test('extractSummary pulls just the Summary section', () => {
  const prd = parsePrd(SAMPLE);
  const summary = extractSummary(prd);
  assert.match(summary, /Editors can schedule articles/);
  assert.doesNotMatch(summary, /User Stories/);
});

test('parsePrd throws on missing frontmatter', () => {
  assert.throws(() => parsePrd('# No frontmatter'), /frontmatter/i);
});

test('parsePrd throws on missing feature slug', () => {
  const bad = SAMPLE.replace('feature: article-scheduling', 'feature:');
  assert.throws(() => parsePrd(bad), /feature/i);
});
