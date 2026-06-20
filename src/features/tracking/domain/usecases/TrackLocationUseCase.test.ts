import { TrackLocationUseCase } from './TrackLocationUseCase';
import { LocationRepository } from '../repositories/LocationRepository';
import { LocationEntity } from '../entities/LocationEntity';

describe('TrackLocationUseCase', () => {
  let useCase: TrackLocationUseCase;
  let mockLocationRepository: jest.Mocked<LocationRepository>;

  beforeEach(() => {
    mockLocationRepository = {
      saveLocation: jest.fn(),
      getUnsyncedLocations: jest.fn(),
      markLocationsAsSynced: jest.fn(),
      getAllLocations: jest.fn(),
      clearAllLocations: jest.fn(),
    } as any;

    useCase = new TrackLocationUseCase(mockLocationRepository);
  });

  it('should successfully save a location using the repository', async () => {
    const userId = 'user-123';
    const lat = -6.2;
    const lon = 106.8;
    const mockSavedLocation: LocationEntity = {
      id: '123',
      userId,
      latitude: lat,
      longitude: lon,
      timestamp: 1624000000000,
      isSynced: false,
    };

    mockLocationRepository.saveLocation.mockResolvedValue(mockSavedLocation);

    const result = await useCase.execute(userId, lat, lon);

    expect(mockLocationRepository.saveLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        latitude: lat,
        longitude: lon,
        timestamp: expect.any(Number),
      })
    );
    expect(result).toEqual(mockSavedLocation);
  });
});
