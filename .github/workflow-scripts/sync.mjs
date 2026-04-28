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
