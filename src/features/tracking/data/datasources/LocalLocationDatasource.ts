import { getDbAsync } from '@/src/core/database/database';
import { LocationModel } from '../models/LocationModel';

/**
 * DATA LAYER — LocalLocationDatasource
 * Handles raw SQLite operations for tracking locations.
 * Decouples database queries and engine implementation from the repository.
 */
export interface LocalLocationDatasource {
  insertLocation(id: string, userId: string, latitude: number, longitude: number, timestamp: number): Promise<void>;
  getUnsyncedLocations(userId: string): Promise<LocationModel[]>;
  updateSyncStatus(ids: string[]): Promise<void>;
  getAllLocations(userId: string): Promise<LocationModel[]>;
  deleteUserLocations(userId: string): Promise<void>;
}

export class LocalLocationDatasourceImpl implements LocalLocationDatasource {
  async insertLocation(id: string, userId: string, latitude: number, longitude: number, timestamp: number): Promise<void> {
    const db = await getDbAsync();
    await db.runAsync(
      'INSERT INTO locations (id, user_id, latitude, longitude, timestamp, is_synced) VALUES (?, ?, ?, ?, ?, 0)',
      id,
      userId,
      latitude,
      longitude,
      timestamp
    );
  }

  async getUnsyncedLocations(userId: string): Promise<LocationModel[]> {
    const db = await getDbAsync();
    return db.getAllAsync<LocationModel>(
      'SELECT * FROM locations WHERE user_id = ? AND is_synced = 0 ORDER BY timestamp ASC',
      userId
    );
  }

  async updateSyncStatus(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await getDbAsync();
    const placeholders = ids.map(() => '?').join(',');
    await db.runAsync(
      `UPDATE locations SET is_synced = 1 WHERE id IN (${placeholders})`,
      ...ids
    );
  }

  async getAllLocations(userId: string): Promise<LocationModel[]> {
    const db = await getDbAsync();
    return db.getAllAsync<LocationModel>(
      'SELECT * FROM locations WHERE user_id = ? ORDER BY timestamp DESC',
      userId
    );
  }

  async deleteUserLocations(userId: string): Promise<void> {
    const db = await getDbAsync();
    await db.runAsync('DELETE FROM locations WHERE user_id = ?', userId);
  }
}
