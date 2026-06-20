import * as TaskManager from 'expo-task-manager';
import { LocationRepositoryImpl } from '../repositories/LocationRepositoryImpl';
import { GeofenceService } from '../../domain/services/GeofenceService';
import { LocalAuthDatasourceImpl } from '@/src/features/auth/data/datasources/LocalAuthDatasource';

export const BACKGROUND_TRACKING_TASK = 'BACKGROUND_LOCATION_TRACKING';

const locationRepo = new LocationRepositoryImpl();
const authDatasource = new LocalAuthDatasourceImpl();

TaskManager.defineTask(BACKGROUND_TRACKING_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('Background location task error:', error.message);
    return;
  }

  if (data) {
    const { locations } = data;
    if (locations && locations.length > 0) {
      // Resolve the current user's ID from local auth session
      const session = await authDatasource.getSession();
      const userId = session.userId ?? '';

      for (const loc of locations) {
        const { latitude, longitude } = loc.coords;
        const timestamp = loc.timestamp;

        await locationRepo.saveLocation({
          userId,
          latitude,
          longitude,
          timestamp,
        });

        await GeofenceService.evaluateLocation(latitude, longitude);
      }
    }
  }
});
