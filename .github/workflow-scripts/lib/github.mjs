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

export async function ensureLabel(repo, name, { color = 'EDEDED', description = '' } = {}, opts = {}) {
  // gh label create with --force creates if missing, updates if exists.
  // Required because `gh issue create --label` rejects unknown labels.
  const args = ['label', 'create', name, '--repo', repo, '--color', color, '--force'];
  if (description) args.push('--description', description);
  await gh(args, opts);
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
