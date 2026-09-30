import { z } from 'zod';
import { nameSchema, optionalUrlSchema } from '@/core/validation/common';

export const profileSchema = z.object({
  name: nameSchema,
  avatarUrl: optionalUrlSchema,
});
