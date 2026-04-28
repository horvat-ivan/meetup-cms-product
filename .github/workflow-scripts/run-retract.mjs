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
