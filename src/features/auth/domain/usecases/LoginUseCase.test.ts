import { LoginUseCase } from './LoginUseCase';
import { UserRepository } from '../repositories/UserRepository';
import { UserEntity } from '../entities/UserEntity';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      saveUser: jest.fn(),
      getUserByEmail: jest.fn(),
    };

    useCase = new LoginUseCase(mockUserRepository);
  });

  it('should login successfully with valid email and password', async () => {
    const mockUser: UserEntity = {
      id: 'user-123',
      username: 'geouser',
      email: 'geo@example.com',
      passwordHash: 'secret123',
    };

    mockUserRepository.getUserByEmail.mockResolvedValue(mockUser);

    const result = await useCase.execute('geo@example.com', 'secret123');

    expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith('geo@example.com');
    expect(result).toEqual(mockUser);
  });

  it('should throw an error when the email is not registered', async () => {
    mockUserRepository.getUserByEmail.mockResolvedValue(null);

    await expect(useCase.execute('unregistered@example.com', 'secret123'))
      .rejects
      .toThrow('Akun dengan email ini tidak terdaftar. Silakan daftar terlebih dahulu.');

    expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith('unregistered@example.com');
  });

  it('should throw an error when the password is incorrect', async () => {
    const mockUser: UserEntity = {
      id: 'user-123',
      username: 'geouser',
      email: 'geo@example.com',
      passwordHash: 'secret123',
    };

    mockUserRepository.getUserByEmail.mockResolvedValue(mockUser);

    await expect(useCase.execute('geo@example.com', 'wrongpassword'))
      .rejects
      .toThrow('Password yang Anda masukkan salah. Silakan coba lagi.');

    expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith('geo@example.com');
  });

  it('should trim and lowercase email input before querying', async () => {
    const mockUser: UserEntity = {
      id: 'user-123',
      username: 'geouser',
      email: 'geo@example.com',
      passwordHash: 'secret123',
    };

    mockUserRepository.getUserByEmail.mockResolvedValue(mockUser);

    await useCase.execute('  GeO@ExAmPlE.cOm  ', 'secret123');

    expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith('geo@example.com');
  });
});
