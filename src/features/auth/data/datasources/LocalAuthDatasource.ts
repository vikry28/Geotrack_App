import * as SecureStore from 'expo-secure-store';

/**
 * DATA LAYER — LocalAuthDatasource
 * Responsible for all SecureStore (token/session) operations.
 * Decouples token management from SQLite user operations.
 */

const TOKEN_KEY    = 'geotrack_session_token';
const USER_ID_KEY  = 'geotrack_user_id';
const USERNAME_KEY = 'geotrack_username';
const EMAIL_KEY    = 'geotrack_email';

export interface SessionData {
  token: string | null;
  userId: string | null;
  username: string | null;
  email: string | null;
}

export interface LocalAuthDatasource {
  saveSession(data: Omit<SessionData, never>): Promise<void>;
  getSession(): Promise<SessionData>;
  clearSession(): Promise<void>;
}

export class LocalAuthDatasourceImpl implements LocalAuthDatasource {
  /** Persist all session keys to SecureStore */
  async saveSession(data: SessionData): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY,    data.token    ?? ''),
      SecureStore.setItemAsync(USER_ID_KEY,  data.userId   ?? ''),
      SecureStore.setItemAsync(USERNAME_KEY, data.username ?? ''),
      SecureStore.setItemAsync(EMAIL_KEY,    data.email    ?? ''),
    ]);
  }

  /** Load all session keys from SecureStore */
  async getSession(): Promise<SessionData> {
    const [token, userId, username, email] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(USER_ID_KEY),
      SecureStore.getItemAsync(USERNAME_KEY),
      SecureStore.getItemAsync(EMAIL_KEY),
    ]);
    return { token, userId, username, email };
  }

  /** Remove all session keys from SecureStore */
  async clearSession(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_ID_KEY),
      SecureStore.deleteItemAsync(USERNAME_KEY),
      SecureStore.deleteItemAsync(EMAIL_KEY),
    ]);
  }
}
