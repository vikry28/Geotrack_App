import { UserEntity } from '../entities/UserEntity';
import { UserRepository } from '../repositories/UserRepository';

/**
 * DOMAIN LAYER — RegisterUseCase
 * Pure business logic for user registration.
 * Checks if user already exists and handles user creation.
 */
export class RegisterUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(username: string, email: string, passwordHash: string): Promise<UserEntity> {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      throw new Error('Username tidak boleh kosong.');
    }
    if (!normalizedEmail) {
      throw new Error('Email tidak boleh kosong.');
    }
    if (!passwordHash || passwordHash.length < 6) {
      throw new Error('Password minimal harus terdiri dari 6 karakter.');
    }

    const existingUser = await this.userRepository.getUserByEmail(normalizedEmail);
    if (existingUser) {
      throw new Error('Email sudah terdaftar. Silakan gunakan email lain atau login.');
    }

    return await this.userRepository.saveUser({
      username: trimmedUsername,
      email: normalizedEmail,
      passwordHash,
    });
  }
}
