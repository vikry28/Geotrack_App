import { UserModel, UserModelMapper } from './UserModel';
import { UserEntity } from '../../domain/entities/UserEntity';

describe('UserModelMapper', () => {
  it('should correctly map a database row (UserModel) to a domain entity (UserEntity)', () => {
    const dbRow: UserModel = {
      id: 'user-uuid-123',
      username: 'testuser',
      email: 'test@example.com',
      password: 'mypassword',
    };

    const expectedEntity: UserEntity = {
      id: 'user-uuid-123',
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'mypassword',
    };

    const result = UserModelMapper.toEntity(dbRow);

    expect(result).toEqual(expectedEntity);
  });

  it('should correctly map a domain entity to a database row object (excluding id)', () => {
    const domainEntity: Omit<UserEntity, 'id'> = {
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'mypassword',
    };

    const expectedDbModel: Omit<UserModel, 'id'> = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'mypassword',
    };

    const result = UserModelMapper.fromEntity(domainEntity);

    expect(result).toEqual(expectedDbModel);
  });
});
