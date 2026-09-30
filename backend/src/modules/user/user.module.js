import { defineModule } from '#core/http/defineModule.js';
import router from './user.routes.js';

export const userModule = defineModule({ name: 'user', basePath: '/users', router });
