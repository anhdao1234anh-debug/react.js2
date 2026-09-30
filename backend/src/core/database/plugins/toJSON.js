/**
 * Mongoose plugin chuẩn hoá dữ liệu trả ra client:
 *  - _id -> id (string), bỏ __v
 *  - Bỏ mọi path được đánh dấu `private: true` trong schema (vd passwordHash)
 *
 * @example userSchema.plugin(toJSONPlugin)
 * @param {import('mongoose').Schema} schema
 */
export function toJSONPlugin(schema) {
  const privatePaths = Object.entries(schema.paths)
    .filter(([, schemaType]) => schemaType.options?.private)
    .map(([path]) => path);

  const existingTransform = schema.options.toJSON?.transform;

  schema.set('toJSON', {
    ...schema.options.toJSON,
    virtuals: true,
    versionKey: false,
    transform(doc, ret, options) {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      for (const path of privatePaths) delete ret[path];
      return typeof existingTransform === 'function' ? existingTransform(doc, ret, options) : ret;
    },
  });
}
