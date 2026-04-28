import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildParentBody,
  buildDesignSeedBody,
  buildAppSeedBody,
} from './format-issue-body.mjs';

const PRD = {
  slug: 'article-scheduling',
  title: 'Article Scheduling',
  body: `# Article Scheduling

## Summary
Editors can schedule articles to publish at a future date.

## Acceptance Criteria
- A draft article can be assigned a future ISO timestamp.
- Articles auto-publish at the scheduled time.

## Scope
- In: scheduling, cancellation
`,
  frontmatter: { feature: 'article-scheduling' },
};

const PRD_PATH = 'docs/prds/2026-04-28-article-scheduling.md';

test('buildParentBody includes summary', () => {
  const body = buildParentBody(PRD, PRD_PATH);
  assert.match(body, /Editors can schedule articles/);
});

test('buildParentBody includes link to PRD', () => {
  const body = buildParentBody(PRD, PRD_PATH);
  assert.match(body, /docs\/prds\/2026-04-28-article-scheduling\.md/);
});

test('buildParentBody includes Linked work placeholder', () => {
  const body = buildParentBody(PRD, PRD_PATH);
  assert.match(body, /Linked work/);
  assert.match(body, /auto-populated by status sync/);
});

test('buildDesignSeedBody mentions design role', () => {
  const body = buildDesignSeedBody(PRD, PRD_PATH);
  assert.match(body, /design entry point/);
  assert.match(body, /\/explore-design/);
});

test('buildDesignSeedBody includes acceptance criteria', () => {
  const body = buildDesignSeedBody(PRD, PRD_PATH);
  assert.match(body, /A draft article can be assigned/);
});

test('buildAppSeedBody mentions app role', () => {
  const body = buildAppSeedBody(PRD, PRD_PATH);
  assert.match(body, /app entry point/);
  assert.match(body, /\/design-doc/);
  assert.match(body, /\/tdd/);
});

test('buildAppSeedBody includes acceptance criteria', () => {
  const body = buildAppSeedBody(PRD, PRD_PATH);
  assert.match(body, /Articles auto-publish/);
});

test('all bodies link back to PRD', () => {
  for (const fn of [buildParentBody, buildDesignSeedBody, buildAppSeedBody]) {
    const body = fn(PRD, PRD_PATH);
    assert.match(body, new RegExp(PRD_PATH.replace(/\//g, '\\/')));
  }
});

test('all bodies include feature slug', () => {
  for (const fn of [buildParentBody, buildDesignSeedBody, buildAppSeedBody]) {
    const body = fn(PRD, PRD_PATH);
    assert.match(body, /article-scheduling/);
  }
});
