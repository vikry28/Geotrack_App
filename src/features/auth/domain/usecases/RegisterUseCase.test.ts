import { RegisterUseCase } from './RegisterUseCase';
import { UserRepository } from '../repositories/UserRepository';
import { UserEntity } from '../entities/UserEntity';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      saveUser: jest.fn(),
      getUserByEmail: jest.fn(),
    };

    useCase = new RegisterUseCase(mockUserRepository);
  });

  it('should successfully register a new user when inputs are valid and email is unique', async () => {
    const mockSavedUser: UserEntity = {
      id: 'new-user-uuid',
      username: 'newuser',
      email: 'new@example.com',
      passwordHash: 'secure123',
    };

    mockUserRepository.getUserByEmail.mockResolvedValue(null);
    mockUserRepository.saveUser.mockResolvedValue(mockSavedUser);

    const result = await useCase.execute('newuser', 'new@example.com', 'secure123');

    expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith('new@example.com');
    expect(mockUserRepository.saveUser).toHaveBeenCalledWith({
      username: 'newuser',
      email: 'new@example.com',
      passwordHash: 'secure123',
    });
    expect(result).toEqual(mockSavedUser);
  });

  it('should throw an error when email is already registered', async () => {
    const mockExistingUser: UserEntity = {
      id: 'existing-uuid',
      username: 'existing',
      email: 'existing@example.com',
      passwordHash: 'pass123',
    };

    mockUserRepository.getUserByEmail.mockResolvedValue(mockExistingUser);

    await expect(useCase.execute('newuser', 'existing@example.com', 'secure123'))
      .rejects
      .toThrow('Email sudah terdaftar. Silakan gunakan email lain atau login.');

    expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith('existing@example.com');
    expect(mockUserRepository.saveUser).not.toHaveBeenCalled();
  });

  it('should throw an error when username is empty', async () => {
    await expect(useCase.execute('   ', 'new@example.com', 'secure123'))
      .rejects
      .toThrow('Username tidak boleh kosong.');
    
    expect(mockUserRepository.saveUser).not.toHaveBeenCalled();
  });

  it('should throw an error when email is empty', async () => {
    await expect(useCase.execute('newuser', '   ', 'secure123'))
      .rejects
      .toThrow('Email tidak boleh kosong.');

    expect(mockUserRepository.saveUser).not.toHaveBeenCalled();
  });

  it('should throw an error when password is less than 6 characters', async () => {
    await expect(useCase.execute('newuser', 'new@example.com', '12345'))
      .rejects
      .toThrow('Password minimal harus terdiri dari 6 karakter.');

    expect(mockUserRepository.saveUser).not.toHaveBeenCalled();
  });

  it('should trim and normalize inputs during registration', async () => {
    const mockSavedUser: UserEntity = {
      id: 'new-user-uuid',
      username: 'newuser',
      email: 'new@example.com',
      passwordHash: 'secure123',
    };

    mockUserRepository.getUserByEmail.mockResolvedValue(null);
    mockUserRepository.saveUser.mockResolvedValue(mockSavedUser);

    await useCase.execute('  newuser  ', '  NeW@eXaMpLe.CoM  ', 'secure123');

    expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith('new@example.com');
    expect(mockUserRepository.saveUser).toHaveBeenCalledWith({
      username: 'newuser',
      email: 'new@example.com',
      passwordHash: 'secure123',
    });
  });
});
