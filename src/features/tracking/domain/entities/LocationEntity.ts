export interface LocationEntity {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  isSynced: boolean;
}
