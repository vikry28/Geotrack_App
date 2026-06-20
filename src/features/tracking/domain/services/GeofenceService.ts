import * as SecureStore from 'expo-secure-store';

const GEOFENCE_CENTER = {
  latitude: -6.2000,
  longitude: 106.8166,
  radiusMeters: 500,
};

const GEOFENCE_STATE_KEY = 'geofence_last_state';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class GeofenceService {
  static async evaluateLocation(latitude: number, longitude: number) {
    const distance = calculateDistance(
      latitude,
      longitude,
      GEOFENCE_CENTER.latitude,
      GEOFENCE_CENTER.longitude
    );

    const isInside = distance <= GEOFENCE_CENTER.radiusMeters;
    const lastState = await SecureStore.getItemAsync(GEOFENCE_STATE_KEY);
    const currentState = isInside ? 'inside' : 'outside';

    if (lastState && lastState !== currentState) {
      const message =
        currentState === 'inside'
          ? '[GeoTrack] Memasuki area Geofence'
          : '[GeoTrack] Keluar dari area Geofence';
      console.log(message);
    }

    await SecureStore.setItemAsync(GEOFENCE_STATE_KEY, currentState);
  }
}
