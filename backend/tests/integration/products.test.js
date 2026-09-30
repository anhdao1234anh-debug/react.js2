import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { Product } from '#modules/product/product.model.js';
import { api, app, bearer, loginAs } from '#tests/helpers.js';

const sample = { title: 'Bàn phím cơ', price: 1_290_000, description: 'Switch tactile' };

describe('Products: public API', () => {
  beforeEach(async () => {
    await Product.insertMany([
      { title: 'Chuột', price: 300 },
      { title: 'Bàn phím', price: 1000 },
      { title: 'Màn hình', price: 5000 },
      { title: 'Tai nghe chuột', price: 800 },
    ]);
  });

  it('liệt kê có phân trang (không cần đăng nhập)', async () => {
    const res = await request(app).get(api('/products?limit=2')).expect(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({ total: 4, totalPages: 2, hasNextPage: true });
    expect(res.body.data[0]).toHaveProperty('id');
    expect(res.body.data[0]).not.toHaveProperty('_id');
  });

  it('tìm kiếm không phân biệt hoa thường, lọc khoảng giá, sắp xếp', async () => {
    const search = await request(app).get(api('/products?search=CHUỘT'));
    expect(search.body.meta.total).toBe(2);

    const range = await request(app).get(api('/products?minPrice=500&maxPrice=2000&sort=price'));
    expect(range.body.data.map((item) => item.price)).toEqual([800, 1000]);

    const desc = await request(app).get(api('/products?sort=-price'));
    expect(desc.body.data[0].price).toBe(5000);
  });

  it('query không hợp lệ -> 422', async () => {
    await request(app).get(api('/products?minPrice=100&maxPrice=10')).expect(422);
    await request(app).get(api('/products?limit=1000')).expect(422);
    await request(app).get(api('/products?sort=secret')).expect(422);
  });

  it('search có ký tự regex đặc biệt không gây lỗi', async () => {
    await request(app).get(api('/products?search=(.*')).expect(200);
  });

  it('xem chi tiết; không tồn tại -> 404', async () => {
    const product = await Product.findOne({ title: 'Chuột' });
    const res = await request(app)
      .get(api(`/products/${product.id}`))
      .expect(200);
    expect(res.body.data.title).toBe('Chuột');
    const missing = await request(app).get(api('/products/507f1f77bcf86cd799439011')).expect(404);
    expect(missing.body.error.message).toBe('Sản phẩm không tồn tại');
  });
});

describe('Products: quản trị (RBAC)', () => {
  it('member không được tạo/sửa/xoá (403), khách chưa đăng nhập (401)', async () => {
    const { accessToken } = await loginAs('member');
    await request(app).post(api('/products')).send(sample).expect(401);
    await request(app).post(api('/products')).set(bearer(accessToken)).send(sample).expect(403);
  });

  it('admin tạo -> sửa -> xoá', async () => {
    const { accessToken, user } = await loginAs('admin');

    const created = await request(app)
      .post(api('/products'))
      .set(bearer(accessToken))
      .send({ ...sample, price: '1290000' })
      .expect(201);
    expect(created.body.data).toMatchObject({
      title: 'Bàn phím cơ',
      price: 1_290_000,
      createdBy: user.id,
    });
    const { id } = created.body.data;

    const updated = await request(app)
      .patch(api(`/products/${id}`))
      .set(bearer(accessToken))
      .send({ price: 999_000 })
      .expect(200);
    expect(updated.body.data).toMatchObject({ price: 999_000, title: 'Bàn phím cơ' });

    await request(app)
      .delete(api(`/products/${id}`))
      .set(bearer(accessToken))
      .expect(204);
    await request(app)
      .delete(api(`/products/${id}`))
      .set(bearer(accessToken))
      .expect(404);
    await request(app)
      .patch(api(`/products/${id}`))
      .set(bearer(accessToken))
      .send({ price: 1 })
      .expect(404);
  });

  it('superAdmin cũng có quyền (wildcard)', async () => {
    const { accessToken } = await loginAs('superAdmin');
    await request(app).post(api('/products')).set(bearer(accessToken)).send(sample).expect(201);
  });

  it('validate body: thiếu trường, giá âm, field lạ, update rỗng', async () => {
    const { accessToken } = await loginAs('admin');
    const missing = await request(app)
      .post(api('/products'))
      .set(bearer(accessToken))
      .send({ price: -1 })
      .expect(422);
    expect(missing.body.error.details.map((detail) => detail.path)).toEqual(
      expect.arrayContaining(['title', 'price']),
    );

    await request(app)
      .post(api('/products'))
      .set(bearer(accessToken))
      .send({ ...sample, hacked: true })
      .expect(422);

    const product = await Product.create(sample);
    await request(app)
      .patch(api(`/products/${product.id}`))
      .set(bearer(accessToken))
      .send({})
      .expect(422);
  });
});
