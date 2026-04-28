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
