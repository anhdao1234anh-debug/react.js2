import { AppError } from '#core/errors/AppError.js';
import { canAssignRole, canManageUser } from '#core/rbac/policy.js';
import { compact } from '#core/utils/object.js';
import { parseSort } from '#core/utils/sort.js';
import { containsRegex } from '#core/utils/string.js';
import { userRepository } from './user.repository.js';
import { USER_SORT_FIELDS } from './user.schema.js';

async function getUserOrThrow(id) {
  const user = await userRepository.findById(id);
  if (!user) throw AppError.notFound('Người dùng');
  return user;
}

function assertCanManage(actor, target) {
  if (!canManageUser(actor, target)) {
    throw AppError.forbidden('Bạn không thể thao tác trên tài khoản có cấp bậc bằng hoặc cao hơn');
  }
}

export const userService = {
  async listUsers({ page, limit, search, sort, role, isActive }) {
    const filter = compact({ role, isActive });
    if (search) {
      const regex = containsRegex(search);
      filter.$or = [{ name: regex }, { email: regex }];
    }
    return userRepository.paginate(filter, {
      page,
      limit,
      sort: parseSort(sort, USER_SORT_FIELDS),
    });
  },

  getUserById: getUserOrThrow,

  async updateProfile(userId, { name, avatarUrl }) {
    const user = await userRepository.updateById(
      userId,
      compact({ name, avatarUrl: avatarUrl === '' ? null : avatarUrl }),
    );
    if (!user) throw AppError.notFound('Người dùng');
    return user;
  },

  async updateUser(actor, targetId, changes) {
    const target = await getUserOrThrow(targetId);
    assertCanManage(actor, target);
    return userRepository.updateById(targetId, compact(changes));
  },

  async changeRole(actor, targetId, role) {
    const target = await getUserOrThrow(targetId);
    assertCanManage(actor, target);
    if (!canAssignRole(actor.role, role)) {
      throw AppError.forbidden(`Bạn không thể gán role "${role}"`);
    }
    return userRepository.updateById(targetId, { role });
  },

  async deleteUser(actor, targetId) {
    const target = await getUserOrThrow(targetId);
    assertCanManage(actor, target);
    await userRepository.deleteById(targetId);
  },
};
