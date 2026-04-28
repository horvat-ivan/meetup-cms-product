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

// `gh project item-add` fails with "unknown owner type" when authenticated via
// GH_TOKEN env var (as in GitHub Actions). The GraphQL API works reliably
// in both interactive and token-auth contexts, so we use that instead.
export async function addToProject(projectNumber, owner, issueUrl, opts = {}) {
  const m = issueUrl.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
  if (!m) throw new Error(`addToProject: bad issue URL ${issueUrl}`);
  const [, repoOwner, repoName, issueNum] = m;

  // 1. Project ID (user-level project)
  const { stdout: projRaw } = await gh(
    [
      'api', 'graphql',
      '-f', `query=query { user(login: "${owner}") { projectV2(number: ${projectNumber}) { id } } }`,
    ],
    opts,
  );
  const projectId = JSON.parse(projRaw)?.data?.user?.projectV2?.id;
  if (!projectId) throw new Error(`addToProject: project not found (${owner}/${projectNumber})`);

  // 2. Issue node ID
  const { stdout: issueRaw } = await gh(
    [
      'api', 'graphql',
      '-f', `query=query { repository(owner: "${repoOwner}", name: "${repoName}") { issue(number: ${issueNum}) { id } } }`,
    ],
    opts,
  );
  const contentId = JSON.parse(issueRaw)?.data?.repository?.issue?.id;
  if (!contentId) throw new Error(`addToProject: issue not found (${issueUrl})`);

  // 3. Add via mutation
  await gh(
    [
      'api', 'graphql',
      '-f', `query=mutation { addProjectV2ItemById(input: { projectId: "${projectId}", contentId: "${contentId}" }) { item { id } } }`,
    ],
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
