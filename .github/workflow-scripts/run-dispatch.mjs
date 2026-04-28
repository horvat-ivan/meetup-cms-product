#!/usr/bin/env node
import { dispatchPrd } from './dispatch.mjs';

const prdPath = process.env.FEATURE_PATH;
if (!prdPath) {
  console.error('FEATURE_PATH env var required');
  process.exit(1);
}

try {
  const result = await dispatchPrd(prdPath);
  console.log('[dispatch]', JSON.stringify(result, null, 2));
} catch (err) {
  console.error('[dispatch] FAIL:', err.message);
  process.exit(1);
}
