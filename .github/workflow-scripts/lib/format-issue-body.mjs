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
