import { Router } from 'express';

/**
 * Khai báo một feature module. Mỗi module tự đóng gói router của mình,
 * app chỉ cần thêm module vào danh sách trong src/modules/index.js.
 *
 * @param {{ name: string, basePath: string, router: import('express').Router }} definition
 */
export function defineModule({ name, basePath, router }) {
  if (!name || !basePath?.startsWith('/') || !router) {
    throw new Error(
      `Module "${name}" khai báo không hợp lệ (cần name, basePath bắt đầu bằng "/", router)`,
    );
  }
  return Object.freeze({ name, basePath, router });
}

/** Gắn danh sách module vào một Router (thường là router /api/v1). */
export function createModulesRouter(modules) {
  const router = Router();
  const seen = new Set();
  for (const mod of modules) {
    if (seen.has(mod.basePath)) {
      throw new Error(`Trùng basePath "${mod.basePath}" giữa các module`);
    }
    seen.add(mod.basePath);
    router.use(mod.basePath, mod.router);
  }
  return router;
}
