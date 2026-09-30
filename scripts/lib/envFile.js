// Tiện ích đọc / ghi file .env dùng chung cho các script ở root (không phụ thuộc thư viện ngoài).
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Các app có file .env riêng. */
export const APPS = [
  { name: 'backend', dir: path.join(ROOT, 'backend') },
  { name: 'frontend', dir: path.join(ROOT, 'frontend') },
];

const KEY_LINE = /^([A-Z][A-Z0-9_]*)=(.*)$/;

/**
 * Parse .env.example thành danh sách entry kèm metadata lấy từ comment phía trên mỗi biến:
 *  - required    : dòng "Mức độ" chứa [REQUIRED] hoặc [SECRET]
 *  - autoGenerate: comment có [auto-generate]
 * @returns {{ key: string, value: string, required: boolean, autoGenerate: boolean }[]}
 */
export function parseExample(content) {
  const entries = [];
  let comments = [];
  for (const line of content.split(/\r?\n/)) {
    if (line.startsWith('#')) {
      comments.push(line);
      continue;
    }
    const match = KEY_LINE.exec(line);
    if (match) {
      const levelLine = comments.find((comment) => /Mức độ\s*:/.test(comment)) ?? '';
      entries.push({
        key: match[1],
        value: match[2],
        // "[REQUIRED] (khi bật OAuth)" = bắt buộc có điều kiện -> không ép phải có giá trị
        required: /\[(REQUIRED|SECRET)\]/.test(levelLine) && !/\(khi /.test(levelLine),
        autoGenerate: levelLine.includes('[auto-generate]'),
      });
    }
    if (line.trim() === '' || match) comments = [];
  }
  return entries;
}

/** Parse .env thật thành Map key -> value (giữ nguyên chuỗi gốc). */
export function parseEnv(content) {
  const values = new Map();
  for (const line of content.split(/\r?\n/)) {
    const match = KEY_LINE.exec(line);
    if (match) values.set(match[1], match[2]);
  }
  return values;
}

export function readIfExists(file) {
  return existsSync(file) ? readFileSync(file, 'utf8') : null;
}

/** Sinh giá trị ngẫu nhiên cho biến [auto-generate]. Mật khẩu luôn có chữ + số. */
export function generateValue(key) {
  if (key.includes('PASSWORD')) return `Sb${randomBytes(12).toString('base64url')}9`;
  return randomBytes(48).toString('base64url');
}

/**
 * Dựng nội dung .env mới theo ĐÚNG thứ tự/comment của .env.example,
 * giữ nguyên giá trị đang có, sinh secret cho biến [auto-generate] còn trống.
 * Biến thừa (không có trong example) được giữ ở cuối file.
 */
export function buildSyncedEnv(exampleContent, currentValues = new Map()) {
  const entries = new Map(parseExample(exampleContent).map((entry) => [entry.key, entry]));
  const generated = [];

  const lines = exampleContent.split(/\r?\n/).map((line) => {
    const match = KEY_LINE.exec(line);
    if (!match) return line;
    const key = match[1];
    let value = currentValues.has(key) ? currentValues.get(key) : match[2];
    if (!value && entries.get(key)?.autoGenerate) {
      value = generateValue(key);
      generated.push(key);
    }
    return `${key}=${value}`;
  });

  const extras = [...currentValues.keys()].filter((key) => !entries.has(key));
  if (extras.length > 0) {
    lines.push(
      '',
      '# ----- Biến không có trong .env.example (hãy thêm vào example hoặc xoá) -----',
    );
    for (const key of extras) lines.push(`${key}=${currentValues.get(key)}`);
  }

  return { content: `${lines.join('\n').trimEnd()}\n`, generated, extras };
}

/**
 * So sánh .env với .env.example.
 * @returns {{ missing: string[], extra: string[], emptyRequired: string[] }}
 */
export function diffEnv(exampleContent, envContent) {
  const entries = parseExample(exampleContent);
  const values = parseEnv(envContent);
  const exampleKeys = new Set(entries.map((entry) => entry.key));
  return {
    missing: entries.filter((entry) => !values.has(entry.key)).map((entry) => entry.key),
    extra: [...values.keys()].filter((key) => !exampleKeys.has(key)),
    emptyRequired: entries
      .filter((entry) => entry.required && values.has(entry.key) && !values.get(entry.key))
      .map((entry) => entry.key),
  };
}
