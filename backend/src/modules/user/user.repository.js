import { BaseRepository } from '#core/base/BaseRepository.js';
import { User } from './user.model.js';

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /** @param {{ withPassword?: boolean }} [options] */
  findByEmail(email, { withPassword = false } = {}) {
    const query = this.model.findOne({ email: String(email).toLowerCase() });
    if (withPassword) query.select('+passwordHash');
    return query.exec();
  }

  findByIdWithPassword(id) {
    return this.model.findById(id).select('+passwordHash').exec();
  }

  findByOAuthAccount(provider, providerId) {
    return this.model.findOne({ oauthAccounts: { $elemMatch: { provider, providerId } } }).exec();
  }
}

export const userRepository = new UserRepository();
