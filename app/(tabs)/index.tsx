import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import * as Location from 'expo-location';
import { BACKGROUND_TRACKING_TASK } from '@/src/features/tracking/data/tasks/LocationBackgroundTask';
import { SyncService } from '@/src/core/network/SyncService';
import { GeofenceService } from '@/src/features/tracking/domain/services/GeofenceService';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/src/features/auth/presentation/hooks/useAuth';
import { useTracking } from '@/src/features/tracking/presentation/hooks/useTracking';

export default function DashboardScreen() {
  const { username, userId, logoutUser } = useAuth();
  const { track } = useTracking();

  const [isTracking, setIsTracking] = useState(false);
  const [lastCoords, setLastCoords] = useState<{ latitude: number; longitude: number; timestamp: number } | null>(null);
  
  // Sync status state
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: false,
    isWsConnected: false,
    isSyncing: false,
    pendingCount: 0,
  });

  // Watcher ref for foreground tracking
  const locationWatcherRef = useRef<Location.LocationSubscription | null>(null);

  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const activeStyles = styles(colors);

  useEffect(() => {
    // Check if background tracking is currently running
    Location.hasStartedLocationUpdatesAsync(BACKGROUND_TRACKING_TASK).then((active) => {
      setIsTracking(active);
    });

    // Subscribe to sync service updates
    const unsubscribeSync = SyncService.subscribe((status) => {
      setNetworkStatus(status);
    });

    return () => {
      unsubscribeSync();
      if (locationWatcherRef.current) {
        locationWatcherRef.current.remove();
      }
    };
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Ya, Keluar',
        style: 'destructive',
        onPress: async () => {
          await stopTracking();
          await logoutUser();
        },
      },
    ]);
  };

  const startTracking = async () => {
    try {
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') {
        Alert.alert('Izin Ditolak', 'Aplikasi memerlukan izin lokasi foreground untuk berjalan.');
        return;
      }

      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== 'granted') {
        Alert.alert(
          'Izin Background Ditolak',
          'Izin lokasi "Selalu Izinkan" dibutuhkan agar pelacakan tetap berjalan di latar belakang.'
        );
        return;
      }

      // Start background tracking (takes samples every 10 seconds)
      await Location.startLocationUpdatesAsync(BACKGROUND_TRACKING_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000, // 10s sample rate (FR-TRK-02)
        distanceInterval: 0,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'GeoTrack Logged',
          notificationBody: 'Melacak rute perjalanan Anda di latar belakang.',
          notificationColor: '#00a8ff',
        },
      });

      // Start foreground watcher to update UI real-time
      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000,
          distanceInterval: 0,
        },
        async (loc) => {
          const { latitude, longitude } = loc.coords;
          const timestamp = loc.timestamp;
          setLastCoords({ latitude, longitude, timestamp });
          
          // Save to local database (Foreground flow) — scoped to current user
          await track(userId ?? '', latitude, longitude, timestamp);
          // Evaluate Geofence
          await GeofenceService.evaluateLocation(latitude, longitude);
          // Trigger sync check
          SyncService.startSync();
        }
      );

      locationWatcherRef.current = watcher;
      setIsTracking(true);
      Alert.alert('Pelacakan Dimulai', 'Lokasi Anda sekarang dipantau secara berkala.');
    } catch (err: any) {
      Alert.alert('Gagal Memulai Pelacakan', err.message || 'Terjadi kesalahan.');
    }
  };

  const stopTracking = async () => {
    try {
      const active = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_TRACKING_TASK);
      if (active) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_TRACKING_TASK);
      }
      if (locationWatcherRef.current) {
        locationWatcherRef.current.remove();
        locationWatcherRef.current = null;
      }
      setIsTracking(false);
      Alert.alert('Pelacakan Dihentikan', 'Pencatatan rute telah dihentikan.');
    } catch (err: any) {
      console.error(err);
    }
  };

  const toggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  const handleManualSync = () => {
    SyncService.startSync();
  };

  return (
    <ScrollView contentContainerStyle={activeStyles.container}>
      <View style={activeStyles.header}>
        <View>
          <ThemedText style={activeStyles.welcome}>Halo,</ThemedText>
          <ThemedText type="subtitle" style={activeStyles.username}>
            {username || 'Pengguna'}
          </ThemedText>
        </View>
        <TouchableOpacity style={activeStyles.logoutBtn} onPress={handleLogout}>
          <ThemedText style={activeStyles.logoutText}>Logout</ThemedText>
        </TouchableOpacity>
      </View>

      <ThemedView style={activeStyles.card}>
        <ThemedText style={activeStyles.cardTitle}>Status Pelacakan</ThemedText>
        <View style={activeStyles.statusIndicatorContainer}>
          <View style={[activeStyles.statusDot, isTracking ? activeStyles.dotActive : activeStyles.dotInactive]} />
          <ThemedText style={activeStyles.statusText}>
            {isTracking ? 'GPS Tracking Aktif' : 'GPS Tracking Mati'}
          </ThemedText>
        </View>

        <TouchableOpacity
          style={[activeStyles.trackBtn, isTracking ? activeStyles.btnStop : activeStyles.btnStart]}
          onPress={toggleTracking}
        >
          <ThemedText style={activeStyles.trackBtnText}>
            {isTracking ? 'Hentikan Pelacakan' : 'Mulai Pelacakan'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {lastCoords && (
        <ThemedView style={activeStyles.card}>
          <ThemedText style={activeStyles.cardTitle}>Koordinat Terakhir</ThemedText>
          <View style={activeStyles.coordinateRow}>
            <View style={activeStyles.coordinateCol}>
              <ThemedText style={activeStyles.coordinateLabel}>Latitude</ThemedText>
              <ThemedText style={activeStyles.coordinateValue}>{lastCoords.latitude.toFixed(6)}</ThemedText>
            </View>
            <View style={activeStyles.coordinateCol}>
              <ThemedText style={activeStyles.coordinateLabel}>Longitude</ThemedText>
              <ThemedText style={activeStyles.coordinateValue}>{lastCoords.longitude.toFixed(6)}</ThemedText>
            </View>
          </View>
          <ThemedText style={activeStyles.timestampText}>
            Diperbarui pada: {new Date(lastCoords.timestamp).toLocaleTimeString()}
          </ThemedText>
        </ThemedView>
      )}

      <ThemedView style={activeStyles.card}>
        <ThemedText style={activeStyles.cardTitle}>Diagnostik & Sinkronisasi</ThemedText>
        
        <View style={activeStyles.diagRow}>
          <ThemedText style={activeStyles.diagLabel}>Koneksi Internet</ThemedText>
          <View style={[activeStyles.badge, networkStatus.isOnline ? activeStyles.badgeOnline : activeStyles.badgeOffline]}>
            <ThemedText style={activeStyles.badgeText}>
              {networkStatus.isOnline ? 'Online' : 'Offline'}
            </ThemedText>
          </View>
        </View>

        <View style={activeStyles.diagRow}>
          <ThemedText style={activeStyles.diagLabel}>WebSocket Sync</ThemedText>
          <View style={[activeStyles.badge, networkStatus.isWsConnected ? activeStyles.badgeOnline : activeStyles.badgeOffline]}>
            <ThemedText style={activeStyles.badgeText}>
              {networkStatus.isWsConnected ? 'Terhubung' : 'Terputus'}
            </ThemedText>
          </View>
        </View>

        <View style={activeStyles.diagRow}>
          <ThemedText style={activeStyles.diagLabel}>Antrean Offline (Unsynced)</ThemedText>
          <ThemedText style={activeStyles.diagValue}>{networkStatus.pendingCount} Titik</ThemedText>
        </View>

        <TouchableOpacity
          style={[
            activeStyles.syncBtn,
            (networkStatus.isSyncing || networkStatus.pendingCount === 0 || !networkStatus.isOnline) &&
              activeStyles.syncBtnDisabled,
          ]}
          onPress={handleManualSync}
          disabled={networkStatus.isSyncing || networkStatus.pendingCount === 0 || !networkStatus.isOnline}
        >
          <ThemedText style={activeStyles.syncBtnText}>
            {networkStatus.isSyncing ? 'Menyingkronkan...' : 'Sinkronkan Sekarang'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.background,
    flexGrow: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcome: {
    color: colors.textMuted,
    fontSize: 16,
  },
  username: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 24,
  },
  logoutBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.danger + '44',
  },
  logoutText: {
    color: colors.danger,
    fontWeight: 'bold',
  },
  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  statusIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  dotActive: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
    shadowRadius: 6,
    elevation: 4,
  },
  dotInactive: {
    backgroundColor: colors.textMuted,
  },
  statusText: {
    fontSize: 16,
    color: colors.text,
  },
  trackBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnStart: {
    backgroundColor: colors.primary,
  },
  btnStop: {
    backgroundColor: colors.danger,
  },
  trackBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coordinateCol: {
    flex: 1,
  },
  coordinateLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  coordinateValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  timestampText: {
    marginTop: 12,
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  diagLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  diagValue: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeOnline: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.success + '44',
  },
  badgeOffline: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.danger + '44',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
  },
  syncBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  syncBtnDisabled: {
    backgroundColor: colors.border,
  },
  syncBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
