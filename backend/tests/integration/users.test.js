import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { User } from '#modules/user/user.model.js';
import { api, app, bearer, createUser, loginAs } from '#tests/helpers.js';

describe('Users: RBAC quản trị người dùng', () => {
  it('member không xem được danh sách user (403)', async () => {
    const { accessToken } = await loginAs('member');
    const res = await request(app).get(api('/users')).set(bearer(accessToken)).expect(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('chưa đăng nhập -> 401', async () => {
    await request(app).get(api('/users')).expect(401);
  });

  it('admin xem danh sách có phân trang, tìm kiếm, lọc role', async () => {
    const { accessToken } = await loginAs('admin', { name: 'Admin Một' });
    await createUser({ name: 'Trần Thị B', email: 'tranb@example.com' });
    await createUser({ name: 'Lê Văn C', role: 'admin' });

    const all = await request(app)
      .get(api('/users?limit=2&sort=name'))
      .set(bearer(accessToken))
      .expect(200);
    expect(all.body.data).toHaveLength(2);
    expect(all.body.meta).toMatchObject({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
      hasNextPage: true,
    });
    expect(all.body.data[0]).not.toHaveProperty('passwordHash');

    const search = await request(app).get(api('/users?search=tranb')).set(bearer(accessToken));
    expect(search.body.data.map((user) => user.email)).toEqual(['tranb@example.com']);

    const admins = await request(app).get(api('/users?role=admin')).set(bearer(accessToken));
    expect(admins.body.meta.total).toBe(2);

    await request(app).get(api('/users?role=root')).set(bearer(accessToken)).expect(422);
    await request(app).get(api('/users?sort=passwordHash')).set(bearer(accessToken)).expect(422);
  });

  it('xem chi tiết user; id sai định dạng -> 422, không tồn tại -> 404', async () => {
    const { accessToken } = await loginAs('admin');
    const member = await createUser();
    const res = await request(app)
      .get(api(`/users/${member.id}`))
      .set(bearer(accessToken))
      .expect(200);
    expect(res.body.data.id).toBe(member.id);

    await request(app).get(api('/users/abc')).set(bearer(accessToken)).expect(422);
    await request(app)
      .get(api('/users/507f1f77bcf86cd799439011'))
      .set(bearer(accessToken))
      .expect(404);
  });

  it('admin khoá được member nhưng không đụng được admin khác / superAdmin', async () => {
    const { accessToken } = await loginAs('admin');
    const member = await createUser();
    const otherAdmin = await createUser({ role: 'admin' });
    const superAdmin = await createUser({ role: 'superAdmin' });

    const res = await request(app)
      .patch(api(`/users/${member.id}`))
      .set(bearer(accessToken))
      .send({ isActive: false })
      .expect(200);
    expect(res.body.data.isActive).toBe(false);

    for (const target of [otherAdmin, superAdmin]) {
      await request(app)
        .patch(api(`/users/${target.id}`))
        .set(bearer(accessToken))
        .send({ isActive: false })
        .expect(403);
    }
  });

  it('không được tự khoá / tự xoá chính mình qua API quản trị', async () => {
    const { accessToken, user } = await loginAs('superAdmin');
    await request(app)
      .patch(api(`/users/${user.id}`))
      .set(bearer(accessToken))
      .send({ isActive: false })
      .expect(403);
    await request(app)
      .delete(api(`/users/${user.id}`))
      .set(bearer(accessToken))
      .expect(403);
  });

  it('body update không cho field lạ (vd role, passwordHash)', async () => {
    const { accessToken } = await loginAs('admin');
    const member = await createUser();
    await request(app)
      .patch(api(`/users/${member.id}`))
      .set(bearer(accessToken))
      .send({ role: 'superAdmin' })
      .expect(422);
    await request(app)
      .patch(api(`/users/${member.id}`))
      .set(bearer(accessToken))
      .send({})
      .expect(422);
  });

  it('chỉ superAdmin đổi được role; không tạo thêm superAdmin qua API', async () => {
    const admin = await loginAs('admin');
    const superAdmin = await loginAs('superAdmin');
    const member = await createUser();

    await request(app)
      .patch(api(`/users/${member.id}/role`))
      .set(bearer(admin.accessToken))
      .send({ role: 'admin' })
      .expect(403);

    const promoted = await request(app)
      .patch(api(`/users/${member.id}/role`))
      .set(bearer(superAdmin.accessToken))
      .send({ role: 'admin' })
      .expect(200);
    expect(promoted.body.data.role).toBe('admin');

    const toSuper = await request(app)
      .patch(api(`/users/${member.id}/role`))
      .set(bearer(superAdmin.accessToken))
      .send({ role: 'superAdmin' })
      .expect(403);
    expect(toSuper.body.error.message).toMatch(/superAdmin/);
  });

  it('role mới có hiệu lực ngay với access token đang dùng', async () => {
    const superAdmin = await loginAs('superAdmin');
    const member = await loginAs('member');
    await request(app).get(api('/users')).set(bearer(member.accessToken)).expect(403);

    await request(app)
      .patch(api(`/users/${member.user.id}/role`))
      .set(bearer(superAdmin.accessToken))
      .send({ role: 'admin' });
    await request(app).get(api('/users')).set(bearer(member.accessToken)).expect(200);
  });

  it('xoá user theo cấp bậc', async () => {
    const { accessToken } = await loginAs('admin');
    const member = await createUser();
    await request(app)
      .delete(api(`/users/${member.id}`))
      .set(bearer(accessToken))
      .expect(204);
    expect(await User.findById(member.id)).toBeNull();
    await request(app)
      .delete(api(`/users/${member.id}`))
      .set(bearer(accessToken))
      .expect(404);
  });
});

describe('Users: hồ sơ cá nhân (/users/me)', () => {
  it('member tự cập nhật tên và avatar', async () => {
    const { accessToken } = await loginAs('member');
    const res = await request(app)
      .patch(api('/users/me'))
      .set(bearer(accessToken))
      .send({ name: '  Tên Mới  ', avatarUrl: 'https://cdn.example.com/a.png' })
      .expect(200);
    expect(res.body.data).toMatchObject({
      name: 'Tên Mới',
      avatarUrl: 'https://cdn.example.com/a.png',
    });
    expect(res.body.data.permissions).toEqual(expect.any(Array));
  });

  it('xoá avatar bằng chuỗi rỗng; không cho đổi email/role', async () => {
    const { accessToken } = await loginAs('member', { avatarUrl: 'https://cdn.example.com/a.png' });
    const res = await request(app)
      .patch(api('/users/me'))
      .set(bearer(accessToken))
      .send({ avatarUrl: '' })
      .expect(200);
    expect(res.body.data.avatarUrl).toBeNull();

    await request(app)
      .patch(api('/users/me'))
      .set(bearer(accessToken))
      .send({ role: 'admin' })
      .expect(422);
  });
});
