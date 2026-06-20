import { LocationEntity } from '../entities/LocationEntity';

export interface LocationRepository {
  saveLocation(location: Omit<LocationEntity, 'id' | 'isSynced'>): Promise<LocationEntity>;
  getUnsyncedLocations(userId: string): Promise<LocationEntity[]>;
  markLocationsAsSynced(ids: string[]): Promise<void>;
  getAllLocations(userId: string): Promise<LocationEntity[]>;
  clearAllLocations(userId: string): Promise<void>;
}
