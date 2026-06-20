import { LocationRepository } from '../repositories/LocationRepository';
import { LocationEntity } from '../entities/LocationEntity';

export class TrackLocationUseCase {
  constructor(private locationRepository: LocationRepository) {}

  async execute(userId: string, latitude: number, longitude: number, timestamp: number = Date.now()): Promise<LocationEntity> {
    return this.locationRepository.saveLocation({
      userId,
      latitude,
      longitude,
      timestamp,
    });
  }
}
