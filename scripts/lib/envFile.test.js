import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT, buildSyncedEnv, diffEnv, generateValue, parseEnv, parseExample } from './envFile.js';

const EXAMPLE = `# HEADER
# ============

# APP_NAME
#   Mức độ   : [RECOMMENDED]
APP_NAME=Demo

# SECRET_KEY
#   Mức độ   : [SECRET] [auto-generate]
SECRET_KEY=

# DB_URL
#   Mức độ   : [REQUIRED]
DB_URL=mongodb://localhost/demo

# OAUTH_URL
#   Mức độ   : [REQUIRED] (khi bật OAuth)
OAUTH_URL=
`;

describe('parseExample', () => {
  it('đọc key, giá trị mẫu và mức độ quan trọng từ dòng "Mức độ"', () => {
    expect(parseExample(EXAMPLE)).toEqual([
      { key: 'APP_NAME', value: 'Demo', required: false, autoGenerate: false },
      { key: 'SECRET_KEY', value: '', required: true, autoGenerate: true },
      { key: 'DB_URL', value: 'mongodb://localhost/demo', required: true, autoGenerate: false },
      { key: 'OAUTH_URL', value: '', required: false, autoGenerate: false },
    ]);
  });
});

describe('buildSyncedEnv', () => {
  it('giữ giá trị cũ, sinh secret còn trống, giữ thứ tự & comment của example', () => {
    const current = new Map([
      ['DB_URL', 'mongodb+srv://user:pass@cluster/db?w=majority'],
      ['LEGACY', 'x'],
    ]);
    const { content, generated, extras } = buildSyncedEnv(EXAMPLE, current);

    expect(generated).toEqual(['SECRET_KEY']);
    expect(extras).toEqual(['LEGACY']);
    const values = parseEnv(content);
    expect(values.get('DB_URL')).toBe('mongodb+srv://user:pass@cluster/db?w=majority');
    expect(values.get('APP_NAME')).toBe('Demo');
    expect(values.get('SECRET_KEY')).toMatch(/^[\w-]{64}$/);
    expect(content.indexOf('# APP_NAME')).toBeLessThan(content.indexOf('# DB_URL'));
    expect(content.trimEnd().endsWith('LEGACY=x')).toBe(true);
  });

  it('chạy lại lần 2 không đổi gì (idempotent)', () => {
    const first = buildSyncedEnv(EXAMPLE, new Map()).content;
    expect(buildSyncedEnv(EXAMPLE, parseEnv(first)).content).toBe(first);
  });
});

describe('diffEnv', () => {
  it('phát hiện biến thiếu, thừa, bắt buộc nhưng trống', () => {
    const env = 'APP_NAME=Demo\nSECRET_KEY=\nEXTRA=1\n';
    expect(diffEnv(EXAMPLE, env)).toEqual({
      missing: ['DB_URL', 'OAUTH_URL'],
      extra: ['EXTRA'],
      emptyRequired: ['SECRET_KEY'],
    });
  });
});

describe('generateValue', () => {
  it('mật khẩu luôn có chữ và số, secret đủ dài', () => {
    const password = generateValue('SUPER_ADMIN_PASSWORD');
    expect(password).toMatch(/[A-Za-z]/);
    expect(password).toMatch(/\d/);
    expect(generateValue('JWT_ACCESS_SECRET').length).toBeGreaterThanOrEqual(32);
  });
});

describe('.env.example thật của dự án', () => {
  it('backend: secret được đánh dấu tự sinh, biến bắt buộc có điều kiện không bị ép', () => {
    const entries = parseExample(readFileSync(path.join(ROOT, 'backend/.env.example'), 'utf8'));
    const byKey = Object.fromEntries(entries.map((entry) => [entry.key, entry]));
    expect(byKey.JWT_ACCESS_SECRET).toMatchObject({ required: true, autoGenerate: true });
    expect(byKey.COOKIE_SECRET).toMatchObject({ required: true, autoGenerate: true });
    expect(byKey.MONGODB_URI.required).toBe(true);
    expect(byKey.API_PUBLIC_URL.required).toBe(false);
    expect(byKey.GOOGLE_CLIENT_ID.required).toBe(false);
  });

  it('mỗi biến trong example đều có đủ 3 mục: Ý nghĩa, Cách tạo, Mức độ', () => {
    for (const app of ['backend', 'frontend']) {
      const content = readFileSync(path.join(ROOT, app, '.env.example'), 'utf8');
      for (const { key } of parseExample(content)) {
        const block = content.slice(content.indexOf(`# ${key}\n`), content.indexOf(`\n${key}=`));
        expect(block, `${app}: ${key}`).toMatch(/Ý nghĩa\s*:/);
        expect(block, `${app}: ${key}`).toMatch(/Cách tạo\s*:/);
        expect(block, `${app}: ${key}`).toMatch(/Mức độ\s*:/);
      }
    }
  });
});
