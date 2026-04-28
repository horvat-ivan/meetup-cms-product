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
