import { UserEntity } from '../entities/UserEntity';
import { UserRepository } from '../repositories/UserRepository';

/**
 * DOMAIN LAYER — LoginUseCase
 * Pure business logic for authentication.
 * Has NO knowledge of Redux, SecureStore, or SQLite internals.
 */
export class LoginUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(email: string, password: string): Promise<UserEntity> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.userRepository.getUserByEmail(normalizedEmail);

    if (!user) {
      throw new Error('Akun dengan email ini tidak terdaftar. Silakan daftar terlebih dahulu.');
    }

    if (user.passwordHash !== password) {
      throw new Error('Password yang Anda masukkan salah. Silakan coba lagi.');
    }

    return user;
  }
}
