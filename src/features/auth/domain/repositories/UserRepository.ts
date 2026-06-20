import { UserEntity } from '../entities/UserEntity';

export interface UserRepository {
  saveUser(user: Omit<UserEntity, 'id'>): Promise<UserEntity>;
  getUserByEmail(email: string): Promise<UserEntity | null>;
}
