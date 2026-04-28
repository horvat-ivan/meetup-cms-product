#!/usr/bin/env node
import { syncPrd } from './sync.mjs';
import { promises as fs } from 'node:fs';

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
