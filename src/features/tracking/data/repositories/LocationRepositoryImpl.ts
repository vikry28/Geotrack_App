import { LocationEntity } from '../../domain/entities/LocationEntity';
import { LocationRepository } from '../../domain/repositories/LocationRepository';
import { LocalLocationDatasource, LocalLocationDatasourceImpl } from '../datasources/LocalLocationDatasource';
import { LocationModelMapper } from '../models/LocationModel';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class LocationRepositoryImpl implements LocationRepository {
  constructor(
    private readonly localDatasource: LocalLocationDatasource = new LocalLocationDatasourceImpl()
  ) {}

  /** Save a location point tied to a specific user */
  async saveLocation(location: Omit<LocationEntity, 'id' | 'isSynced'>): Promise<LocationEntity> {
    const id = generateUUID();
    
    await this.localDatasource.insertLocation(
      id,
      location.userId,
      location.latitude,
      location.longitude,
      location.timestamp
    );

    return {
      id,
      userId: location.userId,
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: location.timestamp,
      isSynced: false,
    };
  }

  /** Return only unsynced locations for a specific user */
  async getUnsyncedLocations(userId: string): Promise<LocationEntity[]> {
    const rows = await this.localDatasource.getUnsyncedLocations(userId);
    return rows.map(LocationModelMapper.toEntity);
  }

  async markLocationsAsSynced(ids: string[]): Promise<void> {
    await this.localDatasource.updateSyncStatus(ids);
  }

  /** Return all locations for a specific user, newest first */
  async getAllLocations(userId: string): Promise<LocationEntity[]> {
    const rows = await this.localDatasource.getAllLocations(userId);
    return rows.map(LocationModelMapper.toEntity);
  }

  /** Clear all locations for a specific user only */
  async clearAllLocations(userId: string): Promise<void> {
    await this.localDatasource.deleteUserLocations(userId);
  }
}
