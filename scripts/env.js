#!/usr/bin/env node
// Kiểm tra / đồng bộ file .env với .env.example cho backend & frontend.
//   node scripts/env.js check  -> báo biến thiếu / thừa / bắt buộc nhưng trống (exit 1 nếu có lỗi)
//   node scripts/env.js sync   -> dựng lại .env theo thứ tự example, giữ giá trị cũ, sinh secret còn trống
import { copyFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { APPS, buildSyncedEnv, diffEnv, parseEnv, readIfExists } from './lib/envFile.js';

const mode = process.argv[2] ?? 'check';
const color = (code) => (text) => `\x1b[${code}m${text}\x1b[0m`;
const red = color(31);
const yellow = color(33);
const green = color(32);

function check() {
  let hasError = false;
  for (const app of APPS) {
    const example = readIfExists(path.join(app.dir, '.env.example'));
    const env = readIfExists(path.join(app.dir, '.env'));
    if (!example) continue;
    if (env === null) {
      console.log(red(`✖ ${app.name}/.env chưa tồn tại -> chạy: npm run setup`));
      hasError = true;
      continue;
    }

    const { missing, extra, emptyRequired } = diffEnv(example, env);
    if (missing.length === 0 && extra.length === 0 && emptyRequired.length === 0) {
      console.log(green(`✔ ${app.name}/.env đồng bộ với .env.example`));
      continue;
    }
    if (missing.length > 0) {
      hasError = true;
      console.log(red(`✖ ${app.name}/.env thiếu: ${missing.join(', ')}`));
    }
    if (emptyRequired.length > 0) {
      hasError = true;
      console.log(
        red(`✖ ${app.name}/.env có biến bắt buộc đang trống: ${emptyRequired.join(', ')}`),
      );
    }
    if (extra.length > 0) {
      console.log(
        yellow(`⚠ ${app.name}/.env có biến không khai báo trong .env.example: ${extra.join(', ')}`),
      );
    }
  }
  if (hasError) console.log(yellow('→ Chạy `npm run env:sync` để tự bổ sung biến còn thiếu.'));
  process.exitCode = hasError ? 1 : 0;
}

function sync() {
  for (const app of APPS) {
    const examplePath = path.join(app.dir, '.env.example');
    const envPath = path.join(app.dir, '.env');
    const example = readIfExists(examplePath);
    if (!example) continue;

    const current = readIfExists(envPath);
    const { content, generated, extras } = buildSyncedEnv(example, parseEnv(current ?? ''));
    if (current === content) {
      console.log(green(`✔ ${app.name}/.env đã đồng bộ, không thay đổi`));
      continue;
    }
    if (current !== null) copyFileSync(envPath, `${envPath}.backup`);
    writeFileSync(envPath, content);
    console.log(green(`✔ ${app.name}/.env đã ${current === null ? 'được tạo' : 'đồng bộ'}`));
    if (current !== null) console.log(`  (bản cũ lưu tại ${app.name}/.env.backup)`);
    if (generated.length > 0) console.log(`  • Tự sinh giá trị: ${generated.join(', ')}`);
    if (extras.length > 0)
      console.log(yellow(`  ⚠ Giữ lại biến thừa ở cuối file: ${extras.join(', ')}`));
  }
}

if (mode === 'check') check();
else if (mode === 'sync') sync();
else {
  console.error(`Lệnh không hợp lệ: ${mode}. Dùng: check | sync`);
  process.exitCode = 1;
}
