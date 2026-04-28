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

test('addToProject uses GraphQL: lookup project, lookup issue, mutate', async () => {
  // Three sequential gh api graphql calls.
  let callIndex = 0;
  const responses = [
    JSON.stringify({ data: { user: { projectV2: { id: 'PROJ_NODE_ID' } } } }),
    JSON.stringify({ data: { repository: { issue: { id: 'ISSUE_NODE_ID' } } } }),
    JSON.stringify({ data: { addProjectV2ItemById: { item: { id: 'ITEM_NODE_ID' } } } }),
  ];
  const exec = async (cmd, args) => {
    const stdout = responses[callIndex++];
    return { stdout, stderr: '', code: 0 };
  };
  exec.calls = [];
  const wrapped = async (cmd, args) => {
    wrapped.calls.push([cmd, ...args].join(' '));
    return exec(cmd, args);
  };
  wrapped.calls = [];
  await addToProject(1, 'horvat-ivan', 'https://github.com/horvat-ivan/repo/issues/42', { exec: wrapped });
  assert.equal(wrapped.calls.length, 3);
  assert.match(wrapped.calls[0], /api graphql/);
  assert.match(wrapped.calls[0], /projectV2\(number: 1\)/);
  assert.match(wrapped.calls[1], /repository\(owner: "horvat-ivan", name: "repo"\)/);
  assert.match(wrapped.calls[1], /issue\(number: 42\)/);
  assert.match(wrapped.calls[2], /addProjectV2ItemById/);
  assert.match(wrapped.calls[2], /projectId: "PROJ_NODE_ID"/);
  assert.match(wrapped.calls[2], /contentId: "ISSUE_NODE_ID"/);
});

test('addToProject throws on bad issue URL', async () => {
  const exec = async () => ({ stdout: '', stderr: '', code: 0 });
  await assert.rejects(
    () => addToProject(1, 'horvat-ivan', 'not-a-real-url', { exec }),
    /bad issue URL/,
  );
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
