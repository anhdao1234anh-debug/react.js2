import { BaseRepository } from '#core/base/BaseRepository.js';
import { Product } from './product.model.js';

class ProductRepository extends BaseRepository {
  constructor() {
    super(Product);
  }
}

export const productRepository = new ProductRepository();
