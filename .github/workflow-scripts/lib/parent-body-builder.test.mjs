import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildParentBody } from './parent-body-builder.mjs';

const PRD = {
  slug: 'article-scheduling',
  title: 'Article Scheduling',
};
const PRD_PATH = 'docs/prds/2026-04-28-article-scheduling.md';

const AGG = {
  product: [
    { number: 1, title: 'Article Scheduling', state: 'OPEN', url: 'u/p/1', labels: [{ name: 'role:product' }] },
  ],
  design: [
    { number: 1, title: '[design] AS', state: 'OPEN', url: 'u/d/1', labels: [{ name: 'role:design' }, { name: 'seed' }] },
    { number: 5, title: 'Date picker', state: 'CLOSED', url: 'u/d/5', labels: [{ name: 'role:design' }] },
  ],
  app: [
    { number: 1, title: '[app] AS', state: 'OPEN', url: 'u/a/1', labels: [{ name: 'role:app' }, { name: 'seed' }] },
    { number: 7, title: 'Migration', state: 'OPEN', url: 'u/a/7', labels: [{ name: 'role:app' }, { name: 'area:be' }] },
  ],
};

test('buildParentBody includes summary section', () => {
  const out = buildParentBody(PRD, PRD_PATH, AGG, 'Editors can schedule articles.');
  assert.match(out, /## Summary/);
  assert.match(out, /Editors can schedule articles/);
});

test('buildParentBody renders flat checklist sorted by role product/design/app', () => {
  const out = buildParentBody(PRD, PRD_PATH, AGG, 'sum');
  // The order should be: product first, then design, then app
  const productIdx = out.indexOf('role:product');
  const designIdx = out.indexOf('role:design');
  const appIdx = out.indexOf('role:app');
  assert.ok(productIdx < designIdx, 'product before design');
  assert.ok(designIdx < appIdx, 'design before app');
});

test('buildParentBody marks closed issues as checked', () => {
  const out = buildParentBody(PRD, PRD_PATH, AGG, 'sum');
  assert.match(out, /\[x\][^\n]*Date picker/);
});

test('buildParentBody marks open issues as unchecked', () => {
  const out = buildParentBody(PRD, PRD_PATH, AGG, 'sum');
  assert.match(out, /\[ \][^\n]*Migration/);
});

test('buildParentBody includes role labels in checklist lines', () => {
  const out = buildParentBody(PRD, PRD_PATH, AGG, 'sum');
  assert.match(out, /\[role:design\]/);
  assert.match(out, /\[role:app\]/);
});

test('buildParentBody includes area labels for app sub-issues', () => {
  const out = buildParentBody(PRD, PRD_PATH, AGG, 'sum');
  assert.match(out, /\[area:be\]/);
});

test('buildParentBody links to PRD', () => {
  const out = buildParentBody(PRD, PRD_PATH, AGG, 'sum');
  assert.match(out, /docs\/prds\/2026-04-28-article-scheduling\.md/);
});

test('buildParentBody handles empty aggregations gracefully', () => {
  const empty = { product: [], design: [], app: [] };
  const out = buildParentBody(PRD, PRD_PATH, empty, 'sum');
  assert.match(out, /No linked work yet/i);
});
