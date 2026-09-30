import { defineModule } from '#core/http/defineModule.js';
import router from './auth.routes.js';

export const authModule = defineModule({ name: 'auth', basePath: '/auth', router });
