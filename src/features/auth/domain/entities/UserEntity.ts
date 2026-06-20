export interface UserEntity {
  id: string;
  username: string;
  email: string;
  passwordHash: string; // plain password or hash for mock authentication
}
