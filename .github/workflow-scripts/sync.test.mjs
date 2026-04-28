import { test } from 'node:test';
import assert from 'node:assert/strict';
import { syncPrd } from './sync.mjs';

const DISPATCHED_PRD = `---
feature: article-scheduling
status: dispatched
created: 2026-04-28
dispatched: '2026-04-28'
issues:
  product: 'https://github.com/horvat-ivan/meetup-cms-product/issues/1'
  design: 'https://github.com/horvat-ivan/meetup-cms-design/issues/1'
  app: 'https://github.com/horvat-ivan/meetup-cms-app/issues/1'
---

# Article Scheduling

## Summary
Editors can schedule articles to publish at a future date.

## Acceptance Criteria
- A draft article can be assigned a future ISO timestamp.
`;

function fakeGh(issuesByRepo) {
  const patches = [];
  return {
    listIssuesByLabel: async (repo, label) => issuesByRepo[repo] || [],
    patchIssueBody: async (repo, n, body) => patches.push({ repo, n, body }),
    _patches: patches,
  };
}

test('syncPrd skips drafts', async () => {
  const draft = DISPATCHED_PRD.replace('status: dispatched', 'status: draft');
  const gh = fakeGh({});
  let written = null;
  const fs = {
    readFile: async () => draft,
    writeFile: async (p, c) => { written = c; },
  };
  const result = await syncPrd('docs/prds/x.md', { gh, fs });
  assert.equal(result.skipped, true);
  assert.equal(gh._patches.length, 0);
});

test('syncPrd patches parent issue body and PRD frontmatter', async () => {
  const issues = {
    'horvat-ivan/meetup-cms-product': [
      { number: 1, title: 'AS', state: 'OPEN', url: 'u/p/1', labels: [{ name: 'role:product' }, { name: 'feature:article-scheduling' }] },
    ],
    'horvat-ivan/meetup-cms-design': [
      { number: 1, title: '[design] AS', state: 'CLOSED', url: 'u/d/1', labels: [{ name: 'role:design' }, { name: 'seed' }, { name: 'feature:article-scheduling' }] },
    ],
    'horvat-ivan/meetup-cms-app': [
      { number: 1, title: '[app] AS', state: 'OPEN', url: 'u/a/1', labels: [{ name: 'role:app' }, { name: 'seed' }, { name: 'feature:article-scheduling' }] },
    ],
  };
  const gh = fakeGh(issues);
  let written = null;
  const fs = {
    readFile: async () => DISPATCHED_PRD,
    writeFile: async (p, c) => { written = c; },
  };
  const result = await syncPrd('docs/prds/x.md', { gh, fs });
  assert.equal(result.synced, true);
  assert.equal(gh._patches.length, 1); // parent issue patched
  assert.equal(gh._patches[0].n, 1);
  assert.match(gh._patches[0].body, /Linked work/);
  assert.match(written, /status: in-progress/); // 1 closed, 2 open => in-progress
  assert.match(written, /progress: 1\/3/);
});

test('syncPrd flips PRD to completed when all closed', async () => {
  const issues = {
    'horvat-ivan/meetup-cms-product': [{ number: 1, title: 'p', state: 'CLOSED', url: 'u/p/1', labels: [{ name: 'role:product' }, { name: 'feature:article-scheduling' }] }],
    'horvat-ivan/meetup-cms-design': [{ number: 1, title: 'd', state: 'CLOSED', url: 'u/d/1', labels: [{ name: 'role:design' }, { name: 'feature:article-scheduling' }] }],
    'horvat-ivan/meetup-cms-app': [{ number: 1, title: 'a', state: 'CLOSED', url: 'u/a/1', labels: [{ name: 'role:app' }, { name: 'feature:article-scheduling' }] }],
  };
  const gh = fakeGh(issues);
  let written = null;
  const fs = { readFile: async () => DISPATCHED_PRD, writeFile: async (p, c) => { written = c; } };
  await syncPrd('docs/prds/x.md', { gh, fs });
  assert.match(written, /status: completed/);
});
