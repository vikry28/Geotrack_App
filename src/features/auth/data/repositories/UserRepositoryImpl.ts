import { getDbAsync } from '@/src/core/database/database';
import { UserEntity } from '../../domain/entities/UserEntity';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { UserModel, UserModelMapper } from '../models/UserModel';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class UserRepositoryImpl implements UserRepository {
  async saveUser(user: Omit<UserEntity, 'id'>): Promise<UserEntity> {
    const db = await getDbAsync();
    const id = generateUUID();
    const dbModel = UserModelMapper.fromEntity(user);

    await db.runAsync(
      'INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)',
      id,
      dbModel.username,
      dbModel.email,
      dbModel.password
    );

    return {
      id,
      username: user.username,
      email: user.email,
      passwordHash: user.passwordHash,
    };
  }

  async getUserByEmail(email: string): Promise<UserEntity | null> {
    const db = await getDbAsync();
    const row = await db.getFirstAsync<UserModel>(
      'SELECT * FROM users WHERE email = ?',
      email.trim().toLowerCase()
    );

    if (!row) return null;

    return UserModelMapper.toEntity(row);
  }
}
