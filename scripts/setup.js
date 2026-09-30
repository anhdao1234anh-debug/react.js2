#!/usr/bin/env node
// Thiết lập lần đầu sau khi clone: kiểm tra Node, tạo .env từ .env.example (tự sinh secret).
//   npm install && npm run setup
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { APPS, buildSyncedEnv, parseEnv, readIfExists } from './lib/envFile.js';

const [major] = process.versions.node.split('.').map(Number);
if (major < 22) {
  console.error(`✖ Cần Node.js >= 22 (hiện tại ${process.versions.node}). Xem .nvmrc`);
  process.exit(1);
}

console.log('⚙  Thiết lập môi trường...\n');

for (const app of APPS) {
  const example = readIfExists(path.join(app.dir, '.env.example'));
  if (!example) continue;
  const envPath = path.join(app.dir, '.env');
  const current = readIfExists(envPath);
  const { content, generated } = buildSyncedEnv(example, parseEnv(current ?? ''));

  if (current === null) {
    writeFileSync(envPath, content);
    console.log(`✔ Tạo ${app.name}/.env`);
  } else if (current !== content) {
    console.log(
      `• ${app.name}/.env đã tồn tại -> giữ nguyên. Chạy \`npm run env:sync\` nếu cần bổ sung.`,
    );
    continue;
  } else {
    console.log(`✔ ${app.name}/.env đã đầy đủ`);
    continue;
  }
  if (generated.length > 0) console.log(`  • Tự sinh: ${generated.join(', ')}`);
}

console.log(`
Bước tiếp theo:
  1. Mở backend/.env -> điền MONGODB_URI (MongoDB local hoặc Atlas)
  2. npm run seed        (tạo tài khoản superAdmin; mật khẩu xem SUPER_ADMIN_PASSWORD trong backend/.env)
  3. npm run dev         (chạy backend + frontend)
Tài liệu: docs/README.md
`);
