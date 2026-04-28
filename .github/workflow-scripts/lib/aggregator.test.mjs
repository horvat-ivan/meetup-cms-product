import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregate, deriveStatus, deriveProgress } from './aggregator.mjs';

const PRODUCT_ISSUES = [
  { number: 1, title: 'Article Scheduling', state: 'OPEN', url: 'u/p/1', labels: [{ name: 'feature' }, { name: 'role:product' }, { name: 'feature:article-scheduling' }] },
];
const DESIGN_ISSUES = [
  { number: 1, title: '[design] Article Scheduling', state: 'OPEN', url: 'u/d/1', labels: [{ name: 'feature' }, { name: 'role:design' }, { name: 'seed' }, { name: 'feature:article-scheduling' }] },
  { number: 2, title: 'Date picker', state: 'CLOSED', url: 'u/d/2', labels: [{ name: 'feature' }, { name: 'role:design' }, { name: 'feature:article-scheduling' }] },
];
const APP_ISSUES = [
  { number: 1, title: '[app] Article Scheduling', state: 'OPEN', url: 'u/a/1', labels: [{ name: 'feature' }, { name: 'role:app' }, { name: 'seed' }, { name: 'feature:article-scheduling' }] },
  { number: 2, title: 'Schema migration', state: 'OPEN', url: 'u/a/2', labels: [{ name: 'feature' }, { name: 'role:app' }, { name: 'area:be' }, { name: 'feature:article-scheduling' }] },
];

test('aggregate returns sorted, role-grouped issues', () => {
  const agg = aggregate(PRODUCT_ISSUES, DESIGN_ISSUES, APP_ISSUES);
  assert.equal(agg.product.length, 1);
  assert.equal(agg.design.length, 2);
  assert.equal(agg.app.length, 2);
});

test('aggregate sorts each group by issue number', () => {
  const agg = aggregate([], [DESIGN_ISSUES[1], DESIGN_ISSUES[0]], []);
  assert.equal(agg.design[0].number, 1);
  assert.equal(agg.design[1].number, 2);
});

test('deriveStatus returns dispatched when no issues started', () => {
  const all = [PRODUCT_ISSUES[0], DESIGN_ISSUES[0], APP_ISSUES[0]];
  assert.equal(deriveStatus(all), 'dispatched');
});

test('deriveStatus returns in-progress when any sub-issue closed', () => {
  const all = [PRODUCT_ISSUES[0], DESIGN_ISSUES[0], DESIGN_ISSUES[1]];
  assert.equal(deriveStatus(all), 'in-progress');
});

test('deriveStatus returns completed when all closed', () => {
  const allClosed = [
    { ...PRODUCT_ISSUES[0], state: 'CLOSED' },
    { ...DESIGN_ISSUES[0], state: 'CLOSED' },
    { ...DESIGN_ISSUES[1], state: 'CLOSED' },
    { ...APP_ISSUES[0], state: 'CLOSED' },
  ];
  assert.equal(deriveStatus(allClosed), 'completed');
});

test('deriveProgress returns "X/Y" string', () => {
  const all = [PRODUCT_ISSUES[0], DESIGN_ISSUES[0], DESIGN_ISSUES[1], APP_ISSUES[0], APP_ISSUES[1]];
  // 1 closed (DESIGN_ISSUES[1]), 5 total
  assert.equal(deriveProgress(all), '1/5');
});

test('aggregate ignores issues without seed/feature labels (defensive)', () => {
  const stray = { number: 99, title: 'unrelated', state: 'OPEN', url: 'u/x', labels: [{ name: 'something-else' }] };
  const agg = aggregate(PRODUCT_ISSUES, [...DESIGN_ISSUES, stray], APP_ISSUES);
  assert.equal(agg.design.length, 2); // stray excluded
});
