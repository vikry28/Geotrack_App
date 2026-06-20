import { useState, useCallback } from 'react';
import { LocationRepositoryImpl } from '../../data/repositories/LocationRepositoryImpl';
import { TrackLocationUseCase } from '../../domain/usecases/TrackLocationUseCase';
import { LocationEntity } from '../../domain/entities/LocationEntity';

const locationRepo = new LocationRepositoryImpl();
const trackLocationUseCase = new TrackLocationUseCase(locationRepo);

/**
 * PRESENTATION LAYER — useTracking Hook
 * Encapsulates the tracking use cases and repository interactions.
 * Keeps React components clean and separated from domain/data details.
 */
export function useTracking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const track = useCallback(async (userId: string, latitude: number, longitude: number, timestamp?: number): Promise<LocationEntity> => {
    setLoading(true);
    setError(null);
    try {
      return await trackLocationUseCase.execute(userId, latitude, longitude, timestamp);
    } catch (e: any) {
      setError(e.message || 'Gagal menyimpan lokasi');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const getLocations = useCallback(async (userId: string): Promise<LocationEntity[]> => {
    setLoading(true);
    setError(null);
    try {
      return await locationRepo.getAllLocations(userId);
    } catch (e: any) {
      setError(e.message || 'Gagal mengambil data lokasi');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearLocations = useCallback(async (userId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await locationRepo.clearAllLocations(userId);
    } catch (e: any) {
      setError(e.message || 'Gagal menghapus data lokasi');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    track,
    getLocations,
    clearLocations,
  };
}
