import { UserEntity } from '../../domain/entities/UserEntity';

/**
 * DATA LAYER — UserModel (DTO)
 * Represents the raw SQLite row structure for the `users` table.
 * Responsible for mapping between the DB row and the Domain Entity.
 */
export interface UserModel {
  id: string;
  username: string;
  email: string;
  password: string; // stored as plain text (mock); hash in production
}

export const UserModelMapper = {
  /** Map a SQLite row to a Domain Entity */
  toEntity(row: UserModel): UserEntity {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password,
    };
  },

  /** Map Domain Entity fields to a SQLite-compatible object */
  fromEntity(entity: Omit<UserEntity, 'id'>): Omit<UserModel, 'id'> {
    return {
      username: entity.username,
      email: entity.email,
      password: entity.passwordHash,
    };
  },
};
