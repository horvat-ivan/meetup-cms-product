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
