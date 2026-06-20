import { LocationModel, LocationModelMapper } from './LocationModel';
import { LocationEntity } from '../../domain/entities/LocationEntity';

describe('LocationModelMapper', () => {
  it('should correctly map a database row (LocationModel) with is_synced=1 to a domain entity (LocationEntity) with isSynced=true', () => {
    const dbRow: LocationModel = {
      id: 'loc-uuid-123',
      user_id: 'user-uuid-999',
      latitude: -6.2,
      longitude: 106.8,
      timestamp: 1624000000000,
      is_synced: 1,
    };

    const expectedEntity: LocationEntity = {
      id: 'loc-uuid-123',
      userId: 'user-uuid-999',
      latitude: -6.2,
      longitude: 106.8,
      timestamp: 1624000000000,
      isSynced: true,
    };

    const result = LocationModelMapper.toEntity(dbRow);

    expect(result).toEqual(expectedEntity);
  });

  it('should correctly map a database row (LocationModel) with is_synced=0 to a domain entity (LocationEntity) with isSynced=false', () => {
    const dbRow: LocationModel = {
      id: 'loc-uuid-123',
      user_id: 'user-uuid-999',
      latitude: -6.2,
      longitude: 106.8,
      timestamp: 1624000000000,
      is_synced: 0,
    };

    const expectedEntity: LocationEntity = {
      id: 'loc-uuid-123',
      userId: 'user-uuid-999',
      latitude: -6.2,
      longitude: 106.8,
      timestamp: 1624000000000,
      isSynced: false,
    };

    const result = LocationModelMapper.toEntity(dbRow);

    expect(result).toEqual(expectedEntity);
  });

  it('should correctly map a domain entity with isSynced=true to a database row (excluding id) with is_synced=1', () => {
    const domainEntity: Omit<LocationEntity, 'id'> = {
      userId: 'user-uuid-999',
      latitude: -6.2,
      longitude: 106.8,
      timestamp: 1624000000000,
      isSynced: true,
    };

    const expectedDbRow: Omit<LocationModel, 'id'> = {
      user_id: 'user-uuid-999',
      latitude: -6.2,
      longitude: 106.8,
      timestamp: 1624000000000,
      is_synced: 1,
    };

    const result = LocationModelMapper.fromEntity(domainEntity);

    expect(result).toEqual(expectedDbRow);
  });

  it('should correctly map a domain entity with isSynced=false to a database row (excluding id) with is_synced=0', () => {
    const domainEntity: Omit<LocationEntity, 'id'> = {
      userId: 'user-uuid-999',
      latitude: -6.2,
      longitude: 106.8,
      timestamp: 1624000000000,
      isSynced: false,
    };

    const expectedDbRow: Omit<LocationModel, 'id'> = {
      user_id: 'user-uuid-999',
      latitude: -6.2,
      longitude: 106.8,
      timestamp: 1624000000000,
      is_synced: 0,
    };

    const result = LocationModelMapper.fromEntity(domainEntity);

    expect(result).toEqual(expectedDbRow);
  });
});
