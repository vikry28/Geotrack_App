import { LocationEntity } from '../../domain/entities/LocationEntity';

/**
 * DATA LAYER — LocationModel (DTO)
 * Represents the raw SQLite row structure for the `locations` table.
 * Decouples the database schema from the Domain Entity.
 */
export interface LocationModel {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  is_synced: number; // 0 for false, 1 for true
}

export const LocationModelMapper = {
  /** Map SQLite LocationModel row to Domain LocationEntity */
  toEntity(row: LocationModel): LocationEntity {
    return {
      id: row.id,
      userId: row.user_id,
      latitude: row.latitude,
      longitude: row.longitude,
      timestamp: row.timestamp,
      isSynced: row.is_synced === 1,
    };
  },

  /** Map Domain LocationEntity to SQLite LocationModel row (excluding id) */
  fromEntity(entity: Omit<LocationEntity, 'id'>): Omit<LocationModel, 'id'> {
    return {
      user_id: entity.userId,
      latitude: entity.latitude,
      longitude: entity.longitude,
      timestamp: entity.timestamp,
      is_synced: entity.isSynced ? 1 : 0,
    };
  },
};
