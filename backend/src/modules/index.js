// Danh sách module được gắn vào /api/v1.
// Thêm module mới: tạo thư mục src/modules/<name>/ + <name>.module.js rồi thêm vào mảng dưới.
import { authModule } from './auth/auth.module.js';
import { healthModule } from './health/health.module.js';
import { productModule } from './product/product.module.js';
import { userModule } from './user/user.module.js';

export const modules = [healthModule, authModule, userModule, productModule];
