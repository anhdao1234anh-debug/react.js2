// Các hàm seed dữ liệu (idempotent - chạy nhiều lần không tạo trùng).
import { ROLES } from '#core/rbac/roles.js';
import { hashPassword } from '#core/security/password.js';
import { passwordSchema } from '#core/validation/common.js';
import { Product } from '#modules/product/product.model.js';
import { userRepository } from '#modules/user/user.repository.js';

/**
 * Tạo (hoặc nâng quyền) tài khoản superAdmin.
 * @param {{ name: string, email?: string, password?: string, resetPassword?: boolean }} input
 * @returns {Promise<{ user: any, action: 'created' | 'updated' | 'unchanged' }>}
 */
export async function seedSuperAdmin({ name, email, password, resetPassword = false }) {
  if (!email || !password) {
    throw new Error('Thiếu SUPER_ADMIN_EMAIL hoặc SUPER_ADMIN_PASSWORD trong backend/.env');
  }
  const check = passwordSchema.safeParse(password);
  if (!check.success) {
    throw new Error(`SUPER_ADMIN_PASSWORD chưa đủ mạnh: ${check.error.issues[0].message}`);
  }

  const existing = await userRepository.findByEmail(email, { withPassword: true });
  if (!existing) {
    const user = await userRepository.create({
      name,
      email,
      passwordHash: await hashPassword(password),
      role: ROLES.SUPER_ADMIN,
      emailVerifiedAt: new Date(),
    });
    return { user, action: 'created' };
  }

  let changed = false;
  if (existing.role !== ROLES.SUPER_ADMIN) {
    existing.role = ROLES.SUPER_ADMIN;
    changed = true;
  }
  if (!existing.isActive) {
    existing.isActive = true;
    changed = true;
  }
  if (resetPassword || !existing.passwordHash) {
    existing.passwordHash = await hashPassword(password);
    existing.passwordChangedAt = new Date();
    changed = true;
  }
  if (changed) await existing.save();
  return { user: existing, action: changed ? 'updated' : 'unchanged' };
}

const SAMPLE_PRODUCTS = [
  { title: 'Bàn phím cơ', price: 1_290_000, description: 'Switch tactile, layout 87 phím.' },
  { title: 'Chuột không dây', price: 490_000, description: 'Pin 70 giờ, kết nối 2.4GHz.' },
  { title: 'Tai nghe chống ồn', price: 2_590_000, description: 'ANC chủ động, pin 30 giờ.' },
  { title: 'Màn hình 27 inch', price: 5_990_000, description: '2K, 165Hz, tấm nền IPS.' },
  { title: 'Giá đỡ laptop', price: 350_000, description: 'Nhôm nguyên khối, gấp gọn.' },
];

/** Thêm sản phẩm mẫu nếu collection đang trống. Trả về số bản ghi đã thêm. */
export async function seedSampleProducts(owner) {
  if ((await Product.estimatedDocumentCount()) > 0) return 0;
  const docs = SAMPLE_PRODUCTS.map((item) => ({
    ...item,
    createdBy: owner?._id,
    updatedBy: owner?._id,
  }));
  await Product.insertMany(docs);
  return docs.length;
}
