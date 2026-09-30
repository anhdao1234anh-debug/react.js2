import mongoose from 'mongoose';
import { toJSONPlugin } from '#core/database/plugins/toJSON.js';

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    // Phase File (R2): thay bằng tham chiếu File document để quản lý vòng đời file
    thumbnail: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, versionKey: false },
);

productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });

productSchema.plugin(toJSONPlugin);

export const Product = mongoose.models.Product ?? mongoose.model('Product', productSchema);
