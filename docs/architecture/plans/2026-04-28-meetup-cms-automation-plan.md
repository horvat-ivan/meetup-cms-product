# Meetup CMS — Plan 2: Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the cross-repo automation: `feature-dispatch` (PRD push → issues in 3 repos), `feature-status-sync` (cron aggregation back to parent issue + PRD progress), `pr-link` (instant comment to parent when sub-issues are created in design/app). After this plan, pushing a PRD to `meetup-cms-product` automatically materializes a parent issue + 2 seed issues + project board cards.

**Architecture:** All scripts are plain Node.js ESM modules in `meetup-cms-product/.github/workflow-scripts/`. Pure functions (parsers, formatters, aggregators) are TDD'd. I/O glue (gh CLI subprocess wrappers) uses dependency injection so it's testable. Workflows are thin GitHub Actions YAML that call Node entry points.

**Tech Stack:**
- Node 22 (LTS)
- ESM (`.mjs`)
- Native test runner (`node --test`)
- `gray-matter` for YAML frontmatter parsing
- `gh` CLI shelled out via `node:child_process` (no `@octokit/*` — keeps deps minimal)
- GitHub Actions (cron + push triggers)

**Spec reference:** `docs/architecture/2026-04-27-meetup-cms-multirepo-design.md`.

**State at start:**
- Plan 1 complete: skeletons, skills, slash commands, labels, project board.
- `CROSS_REPO_TOKEN` exists in `meetup-cms-product` repo secrets.
- All 3 repos public, on `main`, no PRDs yet.

**Definition of done for Plan 2:**
- All scripts written and unit-tested. `node --test` passes from product repo.
- `feature-dispatch.yml`, `feature-status-sync.yml` pushed to product repo `main`.
- `pr-link.yml` pushed to design + app repos.
- Smoke test passes: a test PRD is dispatched, issues appear in all 3 repos, sub-issue triggers pr-link, manual sync rebuilds parent body, retraction closes seeds.

**Plan sequence:**
- Plan 1 (done): Foundations
- **Plan 2 (this):** Automation
- Plan 3: App scaffold (TanStack + NestJS + Postgres) + demo polish

---

## File map

### `meetup-cms-product`

**Created:**
- `package.json` (root, type=module)
- `.nvmrc`
- `.github/workflow-scripts/lib/parse-prd.mjs`
- `.github/workflow-scripts/lib/parse-prd.test.mjs`
- `.github/workflow-scripts/lib/format-issue-body.mjs`
- `.github/workflow-scripts/lib/format-issue-body.test.mjs`
- `.github/workflow-scripts/lib/github.mjs`
- `.github/workflow-scripts/lib/github.test.mjs`
- `.github/workflow-scripts/lib/aggregator.mjs`
- `.github/workflow-scripts/lib/aggregator.test.mjs`
- `.github/workflow-scripts/lib/parent-body-builder.mjs`
- `.github/workflow-scripts/lib/parent-body-builder.test.mjs`
- `.github/workflow-scripts/dispatch.mjs`
- `.github/workflow-scripts/dispatch.test.mjs`
- `.github/workflow-scripts/sync.mjs`
- `.github/workflow-scripts/sync.test.mjs`
- `.github/workflow-scripts/run-dispatch.mjs`
- `.github/workflow-scripts/run-sync.mjs`
- `.github/workflow-scripts/run-retract.mjs`
- `.github/workflows/feature-dispatch.yml`
- `.github/workflows/feature-status-sync.yml`

### `meetup-cms-design`

**Created:**
- `.github/workflows/pr-link.yml`
- `.github/workflow-scripts/run-pr-link.mjs`
- `package.json` (minimal; only needed if we want `node` to find ESM correctly)
- `.nvmrc`

### `meetup-cms-app`

**Created:** same three files as design repo.

---

## Constants used everywhere

The implementer should use these literals (do **not** parameterize for the demo):

```
PRODUCT_REPO  = "horvat-ivan/meetup-cms-product"
DESIGN_REPO   = "horvat-ivan/meetup-cms-design"
APP_REPO      = "horvat-ivan/meetup-cms-app"
PROJECT_OWNER = "horvat-ivan"
PROJECT_NUM   = 1
```

---

## Phase A — Node project setup in product repo

### Task A1: Initialize Node project

**Files:**
- Create: `meetup-cms-product/package.json`
- Create: `meetup-cms-product/.nvmrc`

- [ ] **Step 1: Write `.nvmrc`**

```
22
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "meetup-cms-product",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=22"
  },
  "scripts": {
    "test": "node --test --test-reporter=spec '.github/workflow-scripts/**/*.test.mjs'"
  },
  "dependencies": {
    "gray-matter": "^4.0.3"
  }
}
```

- [ ] **Step 3: Install dependencies**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-product
npm install
```

Expected: creates `node_modules/` and `package-lock.json`.

- [ ] **Step 4: Update `.gitignore`** to ignore `node_modules`

Append to existing `.gitignore`:

```
node_modules/
```

- [ ] **Step 5: Verify test runner works (sanity)**

Create a temp test file `temp.test.mjs` at the repo root:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('sanity', () => assert.equal(1 + 1, 2));
```

Run: `node --test --test-reporter=spec temp.test.mjs`

Expected: 1 test passing.

- [ ] **Step 6: Delete `temp.test.mjs`**

```bash
rm temp.test.mjs
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .nvmrc .gitignore
git commit -m "chore: initialize Node project for workflow scripts"
git push
```

---

## Phase B — Pure libraries (TDD)

### Task B1: `parse-prd.mjs`

The parser turns a PRD file into `{ frontmatter, body, slug, title }`. Uses `gray-matter`. Pure function.

**Files:**
- Create: `meetup-cms-product/.github/workflow-scripts/lib/parse-prd.mjs`
- Create: `meetup-cms-product/.github/workflow-scripts/lib/parse-prd.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `.github/workflow-scripts/lib/parse-prd.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run tests, confirm they fail**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-product
node --test --test-reporter=spec .github/workflow-scripts/lib/parse-prd.test.mjs
```

Expected: 11 tests, all failing with "Cannot find module './parse-prd.mjs'".

- [ ] **Step 3: Implement `parse-prd.mjs`**

Create `.github/workflow-scripts/lib/parse-prd.mjs`:

```javascript
import matter from 'gray-matter';

function stringifyDates(obj) {
  // YAML 1.1 (used by gray-matter via js-yaml) auto-coerces unquoted dates
  // like `2026-04-28` to JS Date objects. Coerce them back to ISO date strings
  // so downstream code (and serializePrd round-trips) stays predictable.
  for (const [k, v] of Object.entries(obj)) {
    if (v instanceof Date) {
      obj[k] = v.toISOString().slice(0, 10);
    }
  }
  return obj;
}

export function parsePrd(content) {
  const parsed = matter(content);
  if (!parsed.data || Object.keys(parsed.data).length === 0) {
    throw new Error('PRD missing YAML frontmatter');
  }
  if (!parsed.data.feature) {
    throw new Error('PRD frontmatter missing required field: feature');
  }

  stringifyDates(parsed.data);

  const titleMatch = parsed.content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : parsed.data.feature;

  return {
    frontmatter: parsed.data,
    body: parsed.content,
    slug: parsed.data.feature,
    title,
  };
}

export function serializePrd(prd) {
  return matter.stringify(prd.body, prd.frontmatter);
}

export function isDraft(prd) {
  return prd.frontmatter.status === 'draft';
}

export function extractSummary(prd) {
  const match = prd.body.match(/## Summary\s*\n([\s\S]*?)(?=\n## |$)/);
  return match ? match[1].trim() : '';
}
```

- [ ] **Step 4: Run tests, confirm they pass**

```bash
node --test --test-reporter=spec .github/workflow-scripts/lib/parse-prd.test.mjs
```

Expected: 11 tests, all passing.

- [ ] **Step 5: Commit**

```bash
git add .github/workflow-scripts/lib/parse-prd.mjs .github/workflow-scripts/lib/parse-prd.test.mjs
git commit -m "feat(workflow-scripts): add parse-prd.mjs with frontmatter + body parsing"
git push
```

---

### Task B2: `format-issue-body.mjs`

Pure functions that produce the markdown body for parent issue, design seed, app seed.

**Files:**
- Create: `meetup-cms-product/.github/workflow-scripts/lib/format-issue-body.mjs`
- Create: `meetup-cms-product/.github/workflow-scripts/lib/format-issue-body.test.mjs`

- [ ] **Step 1: Write the failing test**

```javascript
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
```

- [ ] **Step 2: Run, confirm fails**

```bash
node --test --test-reporter=spec .github/workflow-scripts/lib/format-issue-body.test.mjs
```

- [ ] **Step 3: Implement**

Create `.github/workflow-scripts/lib/format-issue-body.mjs`:

```javascript
import { extractSummary } from './parse-prd.mjs';

const PRODUCT_REPO_URL = 'https://github.com/horvat-ivan/meetup-cms-product';

function prdLink(prdPath) {
  return `${PRODUCT_REPO_URL}/blob/main/${prdPath}`;
}

function extractSection(body, heading) {
  const re = new RegExp(`## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = body.match(re);
  return match ? match[1].trim() : '';
}

export function buildParentBody(prd, prdPath) {
  const summary = extractSummary(prd) || '_(no summary in PRD)_';
  return `## Summary

${summary}

## Linked work

_This will be auto-populated by status sync._

## PRD

[${prdPath}](${prdLink(prdPath)})

---
_Feature: \`${prd.slug}\`_
`;
}

export function buildDesignSeedBody(prd, prdPath) {
  const ac = extractSection(prd.body, 'Acceptance Criteria') || '_(see PRD)_';
  return `## Context

This is the design entry point for **[${prd.title}](${prdLink(prdPath)})**.

Feature: \`${prd.slug}\`

## Acceptance Criteria

${ac}

## What to do

- Open Claude Code in this repo and run \`/explore-design\`
- Split into sub-issues with \`/split-issue\` if scope warrants it
- Close this seed when design is approved

---
_Auto-generated from [PRD](${prdLink(prdPath)})._
`;
}

export function buildAppSeedBody(prd, prdPath) {
  const ac = extractSection(prd.body, 'Acceptance Criteria') || '_(see PRD)_';
  return `## Context

This is the app entry point for **[${prd.title}](${prdLink(prdPath)})**.

Feature: \`${prd.slug}\`

## Acceptance Criteria

${ac}

## What to do

- Open Claude Code in this repo and run \`/design-doc\`
- Split into FE/BE sub-issues with \`/split-issue\`
- Pick up sub-issues with \`/tdd\`

---
_Auto-generated from [PRD](${prdLink(prdPath)})._
`;
}
```

- [ ] **Step 4: Run, confirm passes**

```bash
node --test --test-reporter=spec .github/workflow-scripts/lib/format-issue-body.test.mjs
```

Expected: 9 tests, all passing.

- [ ] **Step 5: Commit**

```bash
git add .github/workflow-scripts/lib/format-issue-body.mjs .github/workflow-scripts/lib/format-issue-body.test.mjs
git commit -m "feat(workflow-scripts): add format-issue-body with parent/design/app templates"
git push
```

---

### Task B3: `github.mjs` — gh CLI wrappers (DI-friendly)

Thin wrappers around `gh` subprocess. Tests inject a fake `exec` so we never actually call `gh`.

**Files:**
- Create: `meetup-cms-product/.github/workflow-scripts/lib/github.mjs`
- Create: `meetup-cms-product/.github/workflow-scripts/lib/github.test.mjs`

- [ ] **Step 1: Write the failing test**

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createIssue,
  addToProject,
  listIssuesByLabel,
  patchIssueBody,
  commentOnIssue,
  closeIssue,
} from './github.mjs';

function mockExec(scripts) {
  // scripts is { commandSubstring: stdoutString }
  const calls = [];
  const fn = async (cmd, args) => {
    const full = [cmd, ...args].join(' ');
    calls.push(full);
    for (const [needle, response] of Object.entries(scripts)) {
      if (full.includes(needle)) {
        return { stdout: response, stderr: '', code: 0 };
      }
    }
    throw new Error(`mockExec: no match for "${full}"`);
  };
  fn.calls = calls;
  return fn;
}

test('createIssue calls gh issue create with correct args', async () => {
  const exec = mockExec({
    'issue create': 'https://github.com/horvat-ivan/meetup-cms-design/issues/42\n',
  });
  const url = await createIssue(
    'horvat-ivan/meetup-cms-design',
    { title: 'T', body: 'B', labels: ['feature', 'role:design'] },
    { exec },
  );
  assert.equal(url, 'https://github.com/horvat-ivan/meetup-cms-design/issues/42');
  assert.match(exec.calls[0], /issue create/);
  assert.match(exec.calls[0], /--repo horvat-ivan\/meetup-cms-design/);
  assert.match(exec.calls[0], /--label feature,role:design/);
});

test('addToProject calls gh project item-add', async () => {
  const exec = mockExec({ 'project item-add': '' });
  await addToProject(1, 'horvat-ivan', 'https://github.com/horvat-ivan/x/issues/1', { exec });
  assert.match(exec.calls[0], /project item-add 1/);
  assert.match(exec.calls[0], /--owner horvat-ivan/);
});

test('listIssuesByLabel parses JSON output', async () => {
  const exec = mockExec({
    'issue list': JSON.stringify([
      { number: 1, title: 'A', state: 'OPEN', url: 'u1', labels: [{ name: 'feature:x' }] },
      { number: 2, title: 'B', state: 'CLOSED', url: 'u2', labels: [{ name: 'feature:x' }] },
    ]),
  });
  const issues = await listIssuesByLabel('horvat-ivan/repo', 'feature:x', { exec });
  assert.equal(issues.length, 2);
  assert.equal(issues[0].number, 1);
  assert.equal(issues[1].state, 'CLOSED');
  assert.match(exec.calls[0], /--label feature:x/);
  assert.match(exec.calls[0], /--state all/);
});

test('patchIssueBody calls gh issue edit', async () => {
  const exec = mockExec({ 'issue edit': '' });
  await patchIssueBody('horvat-ivan/repo', 42, 'new body', { exec });
  assert.match(exec.calls[0], /issue edit 42/);
  assert.match(exec.calls[0], /--repo horvat-ivan\/repo/);
});

test('commentOnIssue calls gh issue comment', async () => {
  const exec = mockExec({ 'issue comment': '' });
  await commentOnIssue('horvat-ivan/repo', 42, 'hello', { exec });
  assert.match(exec.calls[0], /issue comment 42/);
});

test('closeIssue calls gh issue close', async () => {
  const exec = mockExec({ 'issue close': '' });
  await closeIssue('horvat-ivan/repo', 42, 'reason', { exec });
  assert.match(exec.calls[0], /issue close 42/);
});
```

- [ ] **Step 2: Run, confirm fails**

```bash
node --test --test-reporter=spec .github/workflow-scripts/lib/github.test.mjs
```

- [ ] **Step 3: Implement**

Create `.github/workflow-scripts/lib/github.mjs`:

```javascript
import { spawn } from 'node:child_process';

async function defaultExec(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr, code });
      else reject(new Error(`${cmd} ${args.join(' ')} exited ${code}\n${stderr}`));
    });
    proc.on('error', reject);
  });
}

function gh(args, { exec = defaultExec } = {}) {
  return exec('gh', args);
}

export async function createIssue(repo, { title, body, labels = [] }, opts = {}) {
  const args = [
    'issue', 'create',
    '--repo', repo,
    '--title', title,
    '--body', body,
  ];
  if (labels.length) args.push('--label', labels.join(','));
  const { stdout } = await gh(args, opts);
  return stdout.trim();
}

export async function addToProject(projectNumber, owner, issueUrl, opts = {}) {
  await gh(
    ['project', 'item-add', String(projectNumber), '--owner', owner, '--url', issueUrl],
    opts,
  );
}

export async function listIssuesByLabel(repo, label, opts = {}) {
  const { stdout } = await gh(
    [
      'issue', 'list',
      '--repo', repo,
      '--label', label,
      '--state', 'all',
      '--limit', '500',
      '--json', 'number,title,state,url,labels',
    ],
    opts,
  );
  return JSON.parse(stdout);
}

export async function patchIssueBody(repo, number, body, opts = {}) {
  await gh(
    ['issue', 'edit', String(number), '--repo', repo, '--body', body],
    opts,
  );
}

export async function commentOnIssue(repo, number, body, opts = {}) {
  await gh(
    ['issue', 'comment', String(number), '--repo', repo, '--body', body],
    opts,
  );
}

export async function getIssueComments(repo, number, opts = {}) {
  const { stdout } = await gh(
    ['issue', 'view', String(number), '--repo', repo, '--json', 'comments'],
    opts,
  );
  return JSON.parse(stdout).comments || [];
}

export async function closeIssue(repo, number, reason, opts = {}) {
  await gh(
    ['issue', 'close', String(number), '--repo', repo, '--comment', reason],
    opts,
  );
}
```

- [ ] **Step 4: Run, confirm passes**

```bash
node --test --test-reporter=spec .github/workflow-scripts/lib/github.test.mjs
```

Expected: 6 tests passing.

- [ ] **Step 5: Commit**

```bash
git add .github/workflow-scripts/lib/github.mjs .github/workflow-scripts/lib/github.test.mjs
git commit -m "feat(workflow-scripts): add github.mjs gh CLI wrappers (DI-friendly)"
git push
```

---

### Task B4: `aggregator.mjs` — group issues by feature for sync

Pure function. Takes lists of issues from each repo and a feature slug; returns aggregated structure.

**Files:**
- Create: `meetup-cms-product/.github/workflow-scripts/lib/aggregator.mjs`
- Create: `meetup-cms-product/.github/workflow-scripts/lib/aggregator.test.mjs`

- [ ] **Step 1: Write the failing test**

```javascript
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
```

- [ ] **Step 2: Run, confirm fails**

- [ ] **Step 3: Implement**

Create `.github/workflow-scripts/lib/aggregator.mjs`:

```javascript
function hasLabel(issue, name) {
  return (issue.labels || []).some((l) => l.name === name);
}

function filterFeature(issues, slug) {
  return issues.filter((i) => hasLabel(i, `feature:${slug}`)).sort((a, b) => a.number - b.number);
}

function filterRole(issues, role) {
  return issues.filter((i) => hasLabel(i, `role:${role}`));
}

export function aggregate(productIssues, designIssues, appIssues, slug) {
  // If slug not given, fall back to all (used by tests where input is already filtered).
  const filterIfSlug = slug ? (xs) => filterFeature(xs, slug) : (xs) => xs.slice().sort((a, b) => a.number - b.number);
  return {
    product: filterRole(filterIfSlug(productIssues), 'product'),
    design: filterRole(filterIfSlug(designIssues), 'design'),
    app: filterRole(filterIfSlug(appIssues), 'app'),
  };
}

export function deriveStatus(allIssues) {
  if (allIssues.length === 0) return 'dispatched';
  const allClosed = allIssues.every((i) => i.state === 'CLOSED');
  if (allClosed) return 'completed';
  const anyClosed = allIssues.some((i) => i.state === 'CLOSED');
  if (anyClosed) return 'in-progress';
  return 'dispatched';
}

export function deriveProgress(allIssues) {
  const closed = allIssues.filter((i) => i.state === 'CLOSED').length;
  return `${closed}/${allIssues.length}`;
}
```

- [ ] **Step 4: Run, confirm passes**

Expected: 7 tests passing.

- [ ] **Step 5: Commit**

```bash
git add .github/workflow-scripts/lib/aggregator.mjs .github/workflow-scripts/lib/aggregator.test.mjs
git commit -m "feat(workflow-scripts): add aggregator with role grouping + status/progress derivation"
git push
```

---

### Task B5: `parent-body-builder.mjs`

Pure function: turns aggregated issue data into the parent issue body markdown.

**Files:**
- Create: `meetup-cms-product/.github/workflow-scripts/lib/parent-body-builder.mjs`
- Create: `meetup-cms-product/.github/workflow-scripts/lib/parent-body-builder.test.mjs`

- [ ] **Step 1: Write the failing test**

```javascript
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
```

- [ ] **Step 2: Run, confirm fails**

- [ ] **Step 3: Implement**

Create `.github/workflow-scripts/lib/parent-body-builder.mjs`:

```javascript
const PRODUCT_REPO_URL = 'https://github.com/horvat-ivan/meetup-cms-product';

function prdLink(prdPath) {
  return `${PRODUCT_REPO_URL}/blob/main/${prdPath}`;
}

function getAreaLabel(issue) {
  const area = (issue.labels || []).find((l) => l.name.startsWith('area:'));
  return area ? `[${area.name}]` : '';
}

function getRoleLabel(issue) {
  const role = (issue.labels || []).find((l) => l.name.startsWith('role:'));
  return role ? `[${role.name}]` : '';
}

function shortRepo(issueUrl) {
  // url like https://github.com/horvat-ivan/meetup-cms-design/issues/5
  const m = issueUrl.match(/github\.com\/[^/]+\/([^/]+)\/issues\/(\d+)/);
  return m ? `${m[1]}#${m[2]}` : issueUrl;
}

function renderChecklistLine(issue) {
  const checked = issue.state === 'CLOSED' ? '[x]' : '[ ]';
  const role = getRoleLabel(issue);
  const area = getAreaLabel(issue);
  const ref = shortRepo(issue.url);
  return `- ${checked} ${role}${area ? area : ''} ${ref} — ${issue.title}`;
}

export function buildParentBody(prd, prdPath, agg, summary) {
  const lines = [];
  for (const issue of agg.product) lines.push(renderChecklistLine(issue));
  for (const issue of agg.design) lines.push(renderChecklistLine(issue));
  for (const issue of agg.app) lines.push(renderChecklistLine(issue));

  const checklist = lines.length ? lines.join('\n') : '_No linked work yet._';

  return `## Summary

${summary || '_(see PRD)_'}

## Linked work

${checklist}

## PRD

[${prdPath}](${prdLink(prdPath)})

---
_Feature: \`${prd.slug}\` — last synced ${new Date().toISOString()}_
`;
}
```

- [ ] **Step 4: Run, confirm passes**

Expected: 8 tests passing.

- [ ] **Step 5: Commit**

```bash
git add .github/workflow-scripts/lib/parent-body-builder.mjs .github/workflow-scripts/lib/parent-body-builder.test.mjs
git commit -m "feat(workflow-scripts): add parent-body-builder with flat role-grouped checklist"
git push
```

---

## Phase C — Dispatch orchestrator

### Task C1: `dispatch.mjs` (orchestration)

Wires up parse-prd + format-issue-body + github wrappers. Tested with mocked GitHub.

**Files:**
- Create: `meetup-cms-product/.github/workflow-scripts/dispatch.mjs`
- Create: `meetup-cms-product/.github/workflow-scripts/dispatch.test.mjs`

- [ ] **Step 1: Write the failing test**

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dispatchPrd, retractPrd } from './dispatch.mjs';

function makeFakeGh() {
  const created = [];
  const projectAdds = [];
  return {
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
    _state: { created, projectAdds },
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
```

- [ ] **Step 2: Run, confirm fails**

- [ ] **Step 3: Implement `dispatch.mjs`**

```javascript
import { parsePrd, serializePrd, isDraft } from './lib/parse-prd.mjs';
import {
  buildParentBody,
  buildDesignSeedBody,
  buildAppSeedBody,
} from './lib/format-issue-body.mjs';
import * as ghDefault from './lib/github.mjs';
import { promises as fsDefault } from 'node:fs';

const PRODUCT_REPO = 'horvat-ivan/meetup-cms-product';
const DESIGN_REPO = 'horvat-ivan/meetup-cms-design';
const APP_REPO = 'horvat-ivan/meetup-cms-app';
const PROJECT_OWNER = 'horvat-ivan';
const PROJECT_NUM = 1;

export async function dispatchPrd(prdPath, { gh = ghDefault, fs = fsDefault } = {}) {
  const content = await fs.readFile(prdPath, 'utf8');
  const prd = parsePrd(content);

  if (!isDraft(prd)) {
    return { skipped: true, reason: `status is ${prd.frontmatter.status}` };
  }

  const slug = prd.slug;
  const baseLabels = ['feature', `feature:${slug}`];

  // 1. Parent in product
  const parentUrl = await gh.createIssue(PRODUCT_REPO, {
    title: prd.title,
    body: buildParentBody(prd, prdPath),
    labels: [...baseLabels, 'role:product'],
  });

  // 2. Design seed
  const designUrl = await gh.createIssue(DESIGN_REPO, {
    title: `[design] ${prd.title}`,
    body: buildDesignSeedBody(prd, prdPath),
    labels: [...baseLabels, 'role:design', 'seed'],
  });

  // 3. App seed
  const appUrl = await gh.createIssue(APP_REPO, {
    title: `[app] ${prd.title}`,
    body: buildAppSeedBody(prd, prdPath),
    labels: [...baseLabels, 'role:app', 'seed'],
  });

  // 4. Add all 3 to project
  for (const url of [parentUrl, designUrl, appUrl]) {
    try {
      await gh.addToProject(PROJECT_NUM, PROJECT_OWNER, url);
    } catch (err) {
      console.warn(`project item-add failed for ${url}: ${err.message}`);
    }
  }

  // 5. Patch PRD frontmatter
  prd.frontmatter.status = 'dispatched';
  prd.frontmatter.dispatched = new Date().toISOString().slice(0, 10);
  prd.frontmatter.issues = {
    product: parentUrl,
    design: designUrl,
    app: appUrl,
  };
  await fs.writeFile(prdPath, serializePrd(prd));

  return {
    dispatched: true,
    urls: { product: parentUrl, design: designUrl, app: appUrl },
  };
}

export async function retractPrd(prdContent, { gh = ghDefault } = {}) {
  const prd = parsePrd(prdContent);
  const reason = `Feature retracted via PRD removal: \`${prd.slug}\``;
  const issues = prd.frontmatter.issues || {};

  const tasks = [];
  if (issues.product) tasks.push({ repo: PRODUCT_REPO, url: issues.product });
  if (issues.design) tasks.push({ repo: DESIGN_REPO, url: issues.design });
  if (issues.app) tasks.push({ repo: APP_REPO, url: issues.app });

  for (const { repo, url } of tasks) {
    const m = url.match(/\/issues\/(\d+)$/);
    if (!m) continue;
    try {
      await gh.closeIssue(repo, Number(m[1]), reason);
    } catch (err) {
      console.warn(`close failed for ${url}: ${err.message}`);
    }
  }

  return { retracted: tasks.length };
}
```

- [ ] **Step 4: Run, confirm passes**

Expected: 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add .github/workflow-scripts/dispatch.mjs .github/workflow-scripts/dispatch.test.mjs
git commit -m "feat(workflow-scripts): add dispatch orchestrator (PRD -> 3 issues + project add)"
git push
```

---

### Task C2: Entry points — `run-dispatch.mjs` and `run-retract.mjs`

These are the scripts the GitHub Action calls.

**Files:**
- Create: `meetup-cms-product/.github/workflow-scripts/run-dispatch.mjs`
- Create: `meetup-cms-product/.github/workflow-scripts/run-retract.mjs`

- [ ] **Step 1: Write `run-dispatch.mjs`**

```javascript
#!/usr/bin/env node
import { dispatchPrd } from './dispatch.mjs';

const prdPath = process.env.FEATURE_PATH;
if (!prdPath) {
  console.error('FEATURE_PATH env var required');
  process.exit(1);
}

try {
  const result = await dispatchPrd(prdPath);
  console.log('[dispatch]', JSON.stringify(result, null, 2));
} catch (err) {
  console.error('[dispatch] FAIL:', err.message);
  process.exit(1);
}
```

- [ ] **Step 2: Write `run-retract.mjs`**

```javascript
#!/usr/bin/env node
import { retractPrd } from './dispatch.mjs';
import { promises as fs } from 'node:fs';
import { execSync } from 'node:child_process';

const prdPath = process.env.FEATURE_PATH;
if (!prdPath) {
  console.error('FEATURE_PATH env var required');
  process.exit(1);
}

// Try to read the deleted file from the previous commit.
let content;
try {
  content = execSync(`git show HEAD~1:${prdPath}`, { encoding: 'utf8' });
} catch {
  // Maybe the file still exists (manual workflow_dispatch)?
  try {
    content = await fs.readFile(prdPath, 'utf8');
  } catch (err) {
    console.error(`[retract] cannot find PRD content: ${err.message}`);
    process.exit(1);
  }
}

try {
  const result = await retractPrd(content);
  console.log('[retract]', JSON.stringify(result, null, 2));
} catch (err) {
  console.error('[retract] FAIL:', err.message);
  process.exit(1);
}
```

- [ ] **Step 3: Verify the entry points run** (sanity)

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-product
FEATURE_PATH= node .github/workflow-scripts/run-dispatch.mjs 2>&1 | head -3
```

Expected: prints `FEATURE_PATH env var required` and exits non-zero. (Confirms the script runs without parse errors.)

- [ ] **Step 4: Commit**

```bash
git add .github/workflow-scripts/run-dispatch.mjs .github/workflow-scripts/run-retract.mjs
git commit -m "feat(workflow-scripts): add entry points run-dispatch.mjs and run-retract.mjs"
git push
```

---

### Task C3: `feature-dispatch.yml` workflow

**Files:**
- Create: `meetup-cms-product/.github/workflows/feature-dispatch.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: Feature Dispatch

on:
  push:
    branches: [main]
    paths:
      - 'docs/prds/**/*.md'
  workflow_dispatch:
    inputs:
      feature_file:
        description: 'Path to PRD file (e.g. docs/prds/2026-04-28-article-scheduling.md)'
        required: true
      action:
        description: 'Action to perform'
        required: true
        default: 'dispatch'
        type: choice
        options:
          - dispatch
          - retract

permissions:
  contents: write
  issues: write

concurrency:
  group: feature-dispatch
  cancel-in-progress: false

jobs:
  dispatch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
          token: ${{ secrets.CROSS_REPO_TOKEN }}

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'

      - name: Install deps
        run: npm ci

      - name: Detect changed PRD files
        id: detect
        run: |
          if [ -n "${{ inputs.feature_file }}" ]; then
            echo "added=${{ inputs.feature_file }}" >> "$GITHUB_OUTPUT"
            echo "deleted=" >> "$GITHUB_OUTPUT"
          else
            ADDED=$(git diff --name-only --diff-filter=AM HEAD~1 HEAD -- 'docs/prds/*.md' | grep -v TEMPLATE.md | tr '\n' ' ')
            DELETED=$(git diff --name-only --diff-filter=D HEAD~1 HEAD -- 'docs/prds/*.md' | grep -v TEMPLATE.md | tr '\n' ' ')
            echo "added=$ADDED" >> "$GITHUB_OUTPUT"
            echo "deleted=$DELETED" >> "$GITHUB_OUTPUT"
          fi

      - name: Dispatch new features
        if: steps.detect.outputs.added != '' && inputs.action != 'retract'
        env:
          GH_TOKEN: ${{ secrets.CROSS_REPO_TOKEN }}
        run: |
          for FILE in ${{ steps.detect.outputs.added }}; do
            FEATURE_PATH="$FILE" node .github/workflow-scripts/run-dispatch.mjs
          done

      - name: Retract deleted features
        if: steps.detect.outputs.deleted != '' || inputs.action == 'retract'
        env:
          GH_TOKEN: ${{ secrets.CROSS_REPO_TOKEN }}
        run: |
          if [ -n "${{ steps.detect.outputs.deleted }}" ]; then
            for FILE in ${{ steps.detect.outputs.deleted }}; do
              FEATURE_PATH="$FILE" node .github/workflow-scripts/run-retract.mjs
            done
          fi
          if [ "${{ inputs.action }}" = "retract" ] && [ -n "${{ inputs.feature_file }}" ]; then
            FEATURE_PATH="${{ inputs.feature_file }}" node .github/workflow-scripts/run-retract.mjs
          fi

      - name: Commit updated PRD files
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add docs/prds/
          if ! git diff --cached --quiet; then
            git commit -m "chore: update PRD frontmatter after dispatch"
            git pull --rebase
            git push
          fi
```

- [ ] **Step 2: Commit + push**

```bash
git add .github/workflows/feature-dispatch.yml
git commit -m "feat(workflow): add feature-dispatch GitHub Action"
git push
```

After the push, GitHub will register the workflow but it won't have anything to dispatch yet (no PRD changes in this commit). The `workflow_dispatch` button is now available in the Actions tab as a manual trigger.

---

## Phase D — Sync orchestrator

### Task D1: `sync.mjs`

Reads all PRDs in `docs/prds/`, queries issues across the 3 repos, rebuilds parent body, updates PRD frontmatter.

**Files:**
- Create: `meetup-cms-product/.github/workflow-scripts/sync.mjs`
- Create: `meetup-cms-product/.github/workflow-scripts/sync.test.mjs`

- [ ] **Step 1: Write the failing test**

```javascript
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
```

- [ ] **Step 2: Run, confirm fails**

- [ ] **Step 3: Implement `sync.mjs`**

```javascript
import { parsePrd, serializePrd, extractSummary } from './lib/parse-prd.mjs';
import { aggregate, deriveStatus, deriveProgress } from './lib/aggregator.mjs';
import { buildParentBody } from './lib/parent-body-builder.mjs';
import * as ghDefault from './lib/github.mjs';
import { promises as fsDefault } from 'node:fs';

const PRODUCT_REPO = 'horvat-ivan/meetup-cms-product';
const DESIGN_REPO = 'horvat-ivan/meetup-cms-design';
const APP_REPO = 'horvat-ivan/meetup-cms-app';

const SYNCABLE = new Set(['dispatched', 'in-progress']);

export async function syncPrd(prdPath, { gh = ghDefault, fs = fsDefault } = {}) {
  const content = await fs.readFile(prdPath, 'utf8');
  const prd = parsePrd(content);

  if (!SYNCABLE.has(prd.frontmatter.status)) {
    return { skipped: true, reason: `status is ${prd.frontmatter.status}` };
  }

  const featureLabel = `feature:${prd.slug}`;
  const [productIssues, designIssues, appIssues] = await Promise.all([
    gh.listIssuesByLabel(PRODUCT_REPO, featureLabel),
    gh.listIssuesByLabel(DESIGN_REPO, featureLabel),
    gh.listIssuesByLabel(APP_REPO, featureLabel),
  ]);

  const agg = aggregate(productIssues, designIssues, appIssues, prd.slug);
  const all = [...agg.product, ...agg.design, ...agg.app];

  // Patch parent issue body
  const parent = agg.product[0];
  if (parent) {
    const summary = extractSummary(prd);
    const newBody = buildParentBody(prd, prdPath, agg, summary);
    await gh.patchIssueBody(PRODUCT_REPO, parent.number, newBody);
  }

  // Update PRD frontmatter
  const newStatus = deriveStatus(all);
  const newProgress = deriveProgress(all);
  prd.frontmatter.status = newStatus;
  prd.frontmatter.progress = newProgress;
  await fs.writeFile(prdPath, serializePrd(prd));

  return {
    synced: true,
    feature: prd.slug,
    status: newStatus,
    progress: newProgress,
  };
}
```

- [ ] **Step 4: Run, confirm passes**

Expected: 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add .github/workflow-scripts/sync.mjs .github/workflow-scripts/sync.test.mjs
git commit -m "feat(workflow-scripts): add sync orchestrator (rebuild parent body + PRD frontmatter)"
git push
```

---

### Task D2: `run-sync.mjs` entry point

**Files:**
- Create: `meetup-cms-product/.github/workflow-scripts/run-sync.mjs`

- [ ] **Step 1: Write `run-sync.mjs`**

```javascript
#!/usr/bin/env node
import { syncPrd } from './sync.mjs';
import { promises as fs } from 'node:fs';
import { glob } from 'node:fs/promises';

const prdDir = 'docs/prds';
const entries = await fs.readdir(prdDir);
const prds = entries.filter((e) => e.endsWith('.md') && e !== 'TEMPLATE.md');

let okCount = 0;
let skipCount = 0;
let failCount = 0;
for (const file of prds) {
  const path = `${prdDir}/${file}`;
  try {
    const result = await syncPrd(path);
    if (result.skipped) {
      console.log(`[sync] skipped ${file}: ${result.reason}`);
      skipCount++;
    } else {
      console.log(`[sync] synced ${file}: ${result.status} (${result.progress})`);
      okCount++;
    }
  } catch (err) {
    console.error(`[sync] FAIL ${file}: ${err.message}`);
    failCount++;
  }
}

console.log(`[sync] done — ok=${okCount} skip=${skipCount} fail=${failCount}`);
process.exit(failCount > 0 ? 1 : 0);
```

- [ ] **Step 2: Verify it runs** (no PRDs yet, so it just iterates over an empty list)

```bash
mkdir -p docs/prds  # ensure exists
node .github/workflow-scripts/run-sync.mjs
```

Expected: `[sync] done — ok=0 skip=0 fail=0` (or similar — if `TEMPLATE.md` exists it's filtered out).

- [ ] **Step 3: Commit**

```bash
git add .github/workflow-scripts/run-sync.mjs
git commit -m "feat(workflow-scripts): add run-sync.mjs entry point"
git push
```

---

### Task D3: `feature-status-sync.yml` workflow

**Files:**
- Create: `meetup-cms-product/.github/workflows/feature-status-sync.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: Feature Status Sync

on:
  schedule:
    - cron: '0 * * * *'  # hourly
  workflow_dispatch: {}

permissions:
  contents: write
  issues: write

concurrency:
  group: feature-status-sync
  cancel-in-progress: false

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.CROSS_REPO_TOKEN }}

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'

      - name: Install deps
        run: npm ci

      - name: Run sync
        env:
          GH_TOKEN: ${{ secrets.CROSS_REPO_TOKEN }}
        run: node .github/workflow-scripts/run-sync.mjs

      - name: Commit updated PRD files
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add docs/prds/
          if ! git diff --cached --quiet; then
            git commit -m "chore: update PRD frontmatter after status sync"
            git pull --rebase
            git push
          fi
```

- [ ] **Step 2: Commit + push**

```bash
git add .github/workflows/feature-status-sync.yml
git commit -m "feat(workflow): add feature-status-sync GitHub Action (cron + manual)"
git push
```

---

## Phase E — PR-link in design and app repos

This is a smaller workflow: when a sub-issue is created in design or app with the `feature:` label, post a comment to the parent issue in product. Uses the **default `GITHUB_TOKEN`** for the comment (cross-repo write). Wait — `GITHUB_TOKEN` only has same-repo access, so for the comment on a *different* repo's issue, we need `CROSS_REPO_TOKEN` here too.

**Decision:** Add `CROSS_REPO_TOKEN` as a secret in the design + app repos as well. PR-link uses it.

### Task E1: Add `CROSS_REPO_TOKEN` to design + app repo secrets

**Files:** none (GitHub state).

- [ ] **Step 1: User must do this manually** (cannot be done by an agent).

Visit:
- `https://github.com/horvat-ivan/meetup-cms-design/settings/secrets/actions`
- `https://github.com/horvat-ivan/meetup-cms-app/settings/secrets/actions`

For each:
1. Click **New repository secret**.
2. Name: `CROSS_REPO_TOKEN`
3. Value: paste the same Classic PAT used in product repo.
4. Save.

**Verification:** the secret appears in the secrets list.

If the agent runs this plan, it should ASK the user to do this step before proceeding to E2/E3, since it cannot inject secrets.

---

### Task E2: PR-link script + workflow in design repo

**Files:**
- Create: `meetup-cms-design/.github/workflow-scripts/run-pr-link.mjs`
- Create: `meetup-cms-design/.github/workflows/pr-link.yml`
- Create: `meetup-cms-design/package.json`
- Create: `meetup-cms-design/.nvmrc`

- [ ] **Step 1: Write `.nvmrc`**

```
22
```

- [ ] **Step 2: Write minimal `package.json`**

```json
{
  "name": "meetup-cms-design",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=22"
  }
}
```

- [ ] **Step 3: Write `.github/workflow-scripts/run-pr-link.mjs`**

```javascript
#!/usr/bin/env node
import { spawn } from 'node:child_process';

const ISSUE_NUMBER = process.env.ISSUE_NUMBER;
const ISSUE_TITLE = process.env.ISSUE_TITLE || '';
const ISSUE_LABELS = (process.env.ISSUE_LABELS || '').split(',').map((s) => s.trim());
const REPO = process.env.GITHUB_REPOSITORY; // e.g. horvat-ivan/meetup-cms-design
const PRODUCT_REPO = 'horvat-ivan/meetup-cms-product';

if (!ISSUE_NUMBER || !REPO) {
  console.error('ISSUE_NUMBER and GITHUB_REPOSITORY env vars required');
  process.exit(1);
}

const featureLabel = ISSUE_LABELS.find((l) => l.startsWith('feature:'));
if (!featureLabel) {
  console.log('[pr-link] no feature: label, skipping');
  process.exit(0);
}

// Seeds are auto-created by dispatch and ARE the parent's children;
// commenting on the parent about its own seed would be noise.
if (ISSUE_LABELS.includes('seed')) {
  console.log('[pr-link] seed issue, skipping (parent is already linked via dispatch)');
  process.exit(0);
}

// We need to find the parent issue in product. Cheapest: list issues in product
// with the same feature: label and role:product, then comment on the first match.

async function gh(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('gh', args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    proc.stdout.on('data', (d) => { out += d.toString(); });
    proc.stderr.on('data', (d) => { err += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve(out.trim());
      else reject(new Error(`gh ${args.join(' ')} -> ${code}\n${err}`));
    });
  });
}

const parentJson = await gh([
  'issue', 'list',
  '--repo', PRODUCT_REPO,
  '--label', `${featureLabel},role:product`,
  '--state', 'all',
  '--json', 'number,comments',
  '--limit', '5',
]);
const parents = JSON.parse(parentJson);
if (parents.length === 0) {
  console.log('[pr-link] no parent issue found, skipping');
  process.exit(0);
}
const parent = parents[0];

// Idempotency: skip if a comment already mentions this sub-issue.
const subRef = `${REPO}#${ISSUE_NUMBER}`;
const dupe = (parent.comments || []).some((c) => c.body && c.body.includes(subRef));
if (dupe) {
  console.log(`[pr-link] comment for ${subRef} already exists, skipping`);
  process.exit(0);
}

const repoShort = REPO.split('/')[1];
const role = repoShort.includes('design') ? 'design' : 'app';
const commentBody = `📨 New ${role} sub-issue created: ${REPO}#${ISSUE_NUMBER} — "${ISSUE_TITLE}"`;

await gh([
  'issue', 'comment', String(parent.number),
  '--repo', PRODUCT_REPO,
  '--body', commentBody,
]);
console.log(`[pr-link] commented on ${PRODUCT_REPO}#${parent.number}`);
```

- [ ] **Step 4: Write `.github/workflows/pr-link.yml`**

```yaml
name: PR-Link

on:
  issues:
    types: [opened, labeled]

permissions:
  contents: read
  issues: read

jobs:
  link:
    runs-on: ubuntu-latest
    if: contains(toJson(github.event.issue.labels), '"feature:')
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'

      - name: Comment on parent issue
        env:
          GH_TOKEN: ${{ secrets.CROSS_REPO_TOKEN }}
          ISSUE_NUMBER: ${{ github.event.issue.number }}
          ISSUE_TITLE: ${{ github.event.issue.title }}
          ISSUE_LABELS: ${{ join(github.event.issue.labels.*.name, ',') }}
          GITHUB_REPOSITORY: ${{ github.repository }}
        run: node .github/workflow-scripts/run-pr-link.mjs
```

- [ ] **Step 5: Commit + push**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-design
git add .nvmrc package.json .github/workflow-scripts/run-pr-link.mjs .github/workflows/pr-link.yml
git commit -m "feat(workflow): add pr-link action — comment on product parent on sub-issue creation"
git push
```

---

### Task E3: PR-link in app repo (same logic)

**Files:**
- Create: `meetup-cms-app/.github/workflow-scripts/run-pr-link.mjs`
- Create: `meetup-cms-app/.github/workflows/pr-link.yml`
- The app repo already has a `package.json` (from Plan 3 in the future), but we need one now too. Add minimal one if missing.
- Create: `meetup-cms-app/.nvmrc` (if not yet present)

- [ ] **Step 1: Add `.nvmrc`**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app
echo "22" > .nvmrc
```

- [ ] **Step 2: Add minimal `package.json` if not present**

If `package.json` doesn't yet exist (it shouldn't — Plan 3 hasn't run), create it:

```json
{
  "name": "meetup-cms-app",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=22"
  }
}
```

If it does exist, leave it alone — the existing config is fine for pr-link, and Plan 3 will fully populate it later.

- [ ] **Step 3: Copy `run-pr-link.mjs` from design repo (identical logic)**

Same script content as Task E2 Step 3. The script reads `GITHUB_REPOSITORY` to determine whether the role is "design" or "app", so it's reusable verbatim.

```bash
cp /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-design/.github/workflow-scripts/run-pr-link.mjs \
   /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app/.github/workflow-scripts/run-pr-link.mjs
```

(Create the directory first if needed: `mkdir -p .github/workflow-scripts`.)

- [ ] **Step 4: Copy `pr-link.yml` from design repo**

```bash
cp /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-design/.github/workflows/pr-link.yml \
   /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app/.github/workflows/pr-link.yml
```

- [ ] **Step 5: Commit + push**

```bash
git add .nvmrc package.json .github/workflow-scripts/run-pr-link.mjs .github/workflows/pr-link.yml
git commit -m "feat(workflow): add pr-link action — comment on product parent on sub-issue creation"
git push
```

---

## Phase F — End-to-end smoke test (manual)

Goal: confirm the full pipeline works by pushing a real test PRD and observing.

### Task F1: Create a test PRD

**Files:**
- Create: `meetup-cms-product/docs/prds/2026-04-28-test-feature.md`

- [ ] **Step 1: Write the test PRD**

```markdown
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
A throwaway feature used to verify the dispatch + sync pipeline works end-to-end. Will be retracted at the end of the smoke test.

## User Stories
- As a developer testing the pipeline, I want to push a PRD and see issues materialize.

## Acceptance Criteria
- Dispatch action fires on push.
- 1 parent issue + 2 seed issues are created across the 3 repos.
- All 3 issues land on the unified Project board.
- PRD frontmatter is auto-updated to status:dispatched with issue URLs.

## Scope
- In: pipeline verification
- Out: anything real

## Constraints
- Must be retractable cleanly.
```

- [ ] **Step 2: Push it**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-product
git add docs/prds/2026-04-28-test-feature.md
git commit -m "feat(prd): add test-feature for pipeline smoke test"
git push
```

- [ ] **Step 3: Watch the Action**

Visit https://github.com/horvat-ivan/meetup-cms-product/actions and watch the `Feature Dispatch` run. Should complete in ~30-60 sec.

Expected: green check.

---

### Task F2: Verify the issues exist

- [ ] **Step 1: Check each repo via gh**

```bash
gh issue list --repo horvat-ivan/meetup-cms-product --label feature:test-feature
gh issue list --repo horvat-ivan/meetup-cms-design --label feature:test-feature
gh issue list --repo horvat-ivan/meetup-cms-app --label feature:test-feature
```

Expected: 1 issue per repo. Title matches "Test Feature" / "[design] Test Feature" / "[app] Test Feature".

- [ ] **Step 2: Check the project board**

Visit https://github.com/users/horvat-ivan/projects/1.

Expected: all 3 issues are on the board.

- [ ] **Step 3: Check the PRD was patched**

```bash
git pull
cat docs/prds/2026-04-28-test-feature.md | head -15
```

Expected: `status: dispatched`, `issues:` populated with 3 URLs, `dispatched:` field set.

---

### Task F3: Verify status sync works

- [ ] **Step 1: Close one of the seed issues manually**

Pick one (e.g. design seed):

```bash
DESIGN_NUM=$(gh issue list --repo horvat-ivan/meetup-cms-design --label feature:test-feature --json number --jq '.[0].number')
gh issue close $DESIGN_NUM --repo horvat-ivan/meetup-cms-design
```

- [ ] **Step 2: Trigger sync manually**

Visit https://github.com/horvat-ivan/meetup-cms-product/actions/workflows/feature-status-sync.yml.

Click **Run workflow** → **Run workflow** (use defaults).

Wait ~30 sec.

- [ ] **Step 3: Verify the parent issue body updated**

```bash
PARENT_NUM=$(gh issue list --repo horvat-ivan/meetup-cms-product --label feature:test-feature --json number --jq '.[0].number')
gh issue view $PARENT_NUM --repo horvat-ivan/meetup-cms-product
```

Expected: body has a "Linked work" checklist, with the closed design issue showing `[x]`.

- [ ] **Step 4: Verify PRD frontmatter updated to in-progress**

```bash
git pull
cat docs/prds/2026-04-28-test-feature.md | head -15
```

Expected: `status: in-progress`, `progress: 1/3`.

---

### Task F4: Verify pr-link works

- [ ] **Step 1: Create a fake sub-issue in design repo**

```bash
gh issue create \
  --repo horvat-ivan/meetup-cms-design \
  --title "Test sub-issue" \
  --body "Smoke test sub-issue" \
  --label "feature,feature:test-feature,role:design"
```

- [ ] **Step 2: Wait ~30 sec, then check the parent issue comments**

```bash
PARENT_NUM=$(gh issue list --repo horvat-ivan/meetup-cms-product --label feature:test-feature --json number --jq '.[0].number')
gh issue view $PARENT_NUM --repo horvat-ivan/meetup-cms-product --comments
```

Expected: a new comment posted by `github-actions[bot]` saying:
> 📨 New design sub-issue created: horvat-ivan/meetup-cms-design#X — "Test sub-issue"

---

### Task F5: Retract test PRD

- [ ] **Step 1: Delete the test PRD file**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-product
git rm docs/prds/2026-04-28-test-feature.md
git commit -m "chore: retract test-feature smoke test"
git push
```

- [ ] **Step 2: Watch the Feature Dispatch action run again** (this time on the deletion)

Visit Actions tab. The retract path should fire and close the parent + seeds.

- [ ] **Step 3: Verify all 3 issues are closed**

```bash
gh issue view <parent_num> --repo horvat-ivan/meetup-cms-product
gh issue view <design_num> --repo horvat-ivan/meetup-cms-design
gh issue view <app_num> --repo horvat-ivan/meetup-cms-app
```

Expected: all show `state: CLOSED` and a comment with "Feature retracted".

- [ ] **Step 4: Manually close the design sub-issue created in F4** (it doesn't get auto-closed)

```bash
SUB_NUM=$(gh issue list --repo horvat-ivan/meetup-cms-design --search "Test sub-issue" --json number --jq '.[0].number')
gh issue close $SUB_NUM --repo horvat-ivan/meetup-cms-design --comment "Smoke test cleanup"
```

---

## Definition of done — Plan 2

- [ ] Node project initialized in product repo with `gray-matter` dep.
- [ ] All 5 pure libraries have unit tests; `npm test` passes.
- [ ] `dispatch.mjs` and `sync.mjs` orchestrators have unit tests; tests pass.
- [ ] `feature-dispatch.yml` and `feature-status-sync.yml` exist on `main` in product repo.
- [ ] `pr-link.yml` + `run-pr-link.mjs` exist on `main` in design + app repos.
- [ ] `CROSS_REPO_TOKEN` exists as a secret in all 3 repos.
- [ ] Smoke test (Phase F) ran clean: PRD push → 3 issues + project, manual sub-issue → pr-link comment, manual close → sync update, file delete → retraction.
- [ ] Test PRD and test sub-issue cleaned up.

After Plan 2 the workflow is fully operational. Plan 3 builds the actual demo CMS app and prepares the presentation.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| `gh` CLI version mismatch on runner vs. local | Pin via `actions/setup-node` + use whatever `gh` ships on `ubuntu-latest`. If issues, add `actions-rs/install` or set `GH_VERSION`. |
| The auto-commit step in `feature-dispatch.yml` re-triggers itself | The trigger filter `paths: docs/prds/**/*.md` matches; but the script only modifies files for PRDs in `status: draft`, and after dispatch they're `status: dispatched`. Re-run is a no-op. |
| Project add fails (PAT scope wrong) | Wrapped in try/catch; logged but doesn't fail the action. Issues are still created. Re-add manually if needed. |
| `gh issue list --search` is slow with many issues | Plan 2 is for a demo project with <100 issues. Won't hit this. |
| `git pull --rebase` in auto-commit conflicts | Concurrency group serializes runs. Worst case: one cron run skips, next one catches up (sync is idempotent). |
| Test PRD smoke leaves orphaned sub-issue | F5 step 4 explicitly cleans it up. |
