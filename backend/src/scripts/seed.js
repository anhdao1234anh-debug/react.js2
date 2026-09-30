// CLI seed dữ liệu.
//   npm run seed                      -> tạo/nâng quyền superAdmin từ env
//   npm run seed -- --samples         -> + thêm sản phẩm mẫu (nếu collection trống)
//   npm run seed -- --reset-password  -> đặt lại mật khẩu superAdmin theo env
import { parseArgs } from 'node:util';
import { env } from '#config/env.js';
import { connectDatabase, disconnectDatabase } from '#core/database/mongoose.js';
import { seedSampleProducts, seedSuperAdmin } from './seeders.js';

const { values: flags } = parseArgs({
  options: {
    samples: { type: 'boolean', default: false },
    'reset-password': { type: 'boolean', default: false },
  },
});

async function main() {
  await connectDatabase();

  const { user, action } = await seedSuperAdmin({
    name: env.SUPER_ADMIN_NAME,
    email: env.SUPER_ADMIN_EMAIL,
    password: env.SUPER_ADMIN_PASSWORD,
    resetPassword: flags['reset-password'],
  });
  console.log(`✔ superAdmin ${user.email}: ${action}`);

  if (flags.samples) {
    const inserted = await seedSampleProducts(user);
    console.log(
      inserted > 0 ? `✔ Đã thêm ${inserted} sản phẩm mẫu` : '• Bỏ qua sản phẩm mẫu (đã có dữ liệu)',
    );
  }
}

main()
  .catch((error) => {
    console.error(`✖ Seed thất bại: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
