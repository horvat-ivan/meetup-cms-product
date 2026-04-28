import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dispatchPrd, retractPrd } from './dispatch.mjs';

function makeFakeGh() {
  const created = [];
  const projectAdds = [];
  const labelEnsures = [];
  return {
    ensureLabel: async (repo, name, opts) => {
      labelEnsures.push({ repo, name, opts });
    },
    createIssue: async (repo, opts) => {
      const num = created.length + 1;
      const url = `https://github.com/${repo}/issues/${num}`;
      created.push({ repo, ...opts, url });
      return url;
    },
    addToProject: async (n, owner, url) => {
      projectAdds.push({ n, owner, url });
    },
    closeIssue: async (repo, number, reason) => {
      created.push({ closed: { repo, number, reason } });
    },
    _state: { created, projectAdds, labelEnsures },
  };
}

const PRD_CONTENT = `---
feature: ping-test
status: draft
created: 2026-04-28
issues:
  product: null
  design: null
  app: null
---

# Ping Test

## Summary
A trivial test feature.

## Acceptance Criteria
- It pings.
`;

test('dispatchPrd creates 3 issues + 3 project adds + patches PRD', async () => {
  const gh = makeFakeGh();
  let written = null;
  const fs = {
    readFile: async () => PRD_CONTENT,
    writeFile: async (path, content) => { written = { path, content }; },
  };
  const result = await dispatchPrd('docs/prds/2026-04-28-ping-test.md', { gh, fs });
  assert.equal(result.dispatched, true);
  assert.equal(gh._state.created.length, 3);
  assert.equal(gh._state.projectAdds.length, 3);
  // PRD should be rewritten with status:dispatched
  assert.match(written.content, /status: dispatched/);
  assert.match(written.content, /product: 'https/);
});

test('dispatchPrd is idempotent — skips status:dispatched', async () => {
  const dispatched = PRD_CONTENT.replace('status: draft', 'status: dispatched');
  const gh = makeFakeGh();
  const fs = { readFile: async () => dispatched, writeFile: async () => {} };
  const result = await dispatchPrd('docs/prds/x.md', { gh, fs });
  assert.equal(result.skipped, true);
  assert.equal(gh._state.created.length, 0);
});

test('dispatchPrd applies feature: + role:* + seed labels correctly', async () => {
  const gh = makeFakeGh();
  const fs = { readFile: async () => PRD_CONTENT, writeFile: async () => {} };
  await dispatchPrd('docs/prds/x.md', { gh, fs });
  const labels = gh._state.created.map((c) => c.labels);
  // First call = parent (role:product, no seed)
  assert.ok(labels[0].includes('role:product'));
  assert.ok(!labels[0].includes('seed'));
  // Second call = design seed
  assert.ok(labels[1].includes('role:design'));
  assert.ok(labels[1].includes('seed'));
  // Third = app seed
  assert.ok(labels[2].includes('role:app'));
  assert.ok(labels[2].includes('seed'));
  // All carry feature + feature:<slug>
  for (const ls of labels) {
    assert.ok(ls.includes('feature'));
    assert.ok(ls.includes('feature:ping-test'));
  }
});

test('dispatchPrd ensures feature:<slug> label in all 3 repos before issue creation', async () => {
  const gh = makeFakeGh();
  const fs = { readFile: async () => PRD_CONTENT, writeFile: async () => {} };
  await dispatchPrd('docs/prds/x.md', { gh, fs });
  const ensured = gh._state.labelEnsures;
  assert.equal(ensured.length, 3);
  const repos = ensured.map((e) => e.repo).sort();
  assert.deepEqual(repos, [
    'horvat-ivan/meetup-cms-app',
    'horvat-ivan/meetup-cms-design',
    'horvat-ivan/meetup-cms-product',
  ]);
  for (const e of ensured) assert.equal(e.name, 'feature:ping-test');
});

test('retractPrd closes parent + design + app seeds with reason', async () => {
  const dispatched = PRD_CONTENT
    .replace('status: draft', 'status: dispatched')
    .replace('product: null', "product: 'https://github.com/horvat-ivan/meetup-cms-product/issues/9'")
    .replace('design: null', "design: 'https://github.com/horvat-ivan/meetup-cms-design/issues/3'")
    .replace('app: null', "app: 'https://github.com/horvat-ivan/meetup-cms-app/issues/4'");
  const gh = makeFakeGh();
  await retractPrd(dispatched, { gh });
  // 3 closes total
  const closes = gh._state.created.filter((c) => c.closed);
  assert.equal(closes.length, 3);
});
