#!/usr/bin/env node
// Xoá thư mục sinh ra (node_modules, dist, coverage) ở root và các workspace.
//   npm run clean  -> sau đó chạy lại `npm install`
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/envFile.js';

const TARGETS = [
  'node_modules',
  'backend/node_modules',
  'backend/coverage',
  'frontend/node_modules',
  'frontend/dist',
  'frontend/coverage',
];

for (const target of TARGETS) {
  const fullPath = path.join(ROOT, target);
  if (!existsSync(fullPath)) continue;
  rmSync(fullPath, { recursive: true, force: true });
  console.log(`🗑  Đã xoá ${target}`);
}
console.log('✔ Xong. Chạy `npm install` để cài lại dependencies.');
