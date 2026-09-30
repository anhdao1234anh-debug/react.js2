import { defineModule } from '#core/http/defineModule.js';
import router from './product.routes.js';

export const productModule = defineModule({ name: 'product', basePath: '/products', router });
