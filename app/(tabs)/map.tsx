import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import { LocationEntity } from '@/src/features/tracking/domain/entities/LocationEntity';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '@/src/features/auth/presentation/hooks/useAuth';
import { useTracking } from '@/src/features/tracking/presentation/hooks/useTracking';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

let MapView: any = null;
let Polyline: any = null;
let Marker: any = null;

if (Platform.OS !== 'web') {
  try {
    /* eslint-disable-next-line @typescript-eslint/no-require-imports */
    const MapComponents = require('react-native-maps');
    MapView = MapComponents.default;
    Polyline = MapComponents.Polyline;
    Marker = MapComponents.Marker;
  } catch (e) {
    console.error('Failed to load react-native-maps:', e);
  }
}


// Calculate rough distance between two coords in meters (Haversine)
function haversineMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const c =
    sinLat * sinLat +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      sinLon *
      sinLon;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatCoord(val: number): string {
  return val.toFixed(5);
}

export default function MapScreen() {
  const isFocused = useIsFocused();
  const mapRef = useRef<any>(null);
  const { userId } = useAuth();
  const { getLocations } = useTracking();
  const [locations, setLocations] = useState<LocationEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const activeStyles = styles(colors);

  const fetchRoute = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const allLocs = await getLocations(userId ?? '');
      // getAllLocations returns DESC, reverse to get chronological order
      setLocations([...allLocs].reverse());
    } catch (err) {
      console.error('[MapScreen] Error fetching route:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getLocations, userId]);

  useEffect(() => {
    if (isFocused) fetchRoute();
  }, [isFocused, fetchRoute]);

  const coordinates = locations.map((l) => ({
    latitude: l.latitude,
    longitude: l.longitude,
  }));

  // Calculate total route distance
  let totalDistance = 0;
  for (let i = 1; i < coordinates.length; i++) {
    totalDistance += haversineMeters(coordinates[i - 1], coordinates[i]);
  }

  const lastCoord = coordinates.length > 0 ? coordinates[coordinates.length - 1] : null;
  const firstCoord = coordinates.length > 0 ? coordinates[0] : null;

  const initialRegion = lastCoord
    ? {
        latitude: lastCoord.latitude,
        longitude: lastCoord.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      }
    : {
        latitude: -6.2,
        longitude: 106.8166,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  const handleFitRoute = () => {
    if (mapRef.current && coordinates.length > 1) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 80, right: 40, bottom: 200, left: 40 },
        animated: true,
      });
    }
  };

  if (loading) {
    return (
      <View style={activeStyles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={activeStyles.loaderText}>Memuat peta rute...</Text>
      </View>
    );
  }

  // ─── Fallback for Web ────────────────────────────────────────────────────
  if (!MapView || Platform.OS === 'web') {
    return (
      <ScrollView style={activeStyles.webContainer} contentContainerStyle={activeStyles.webContent}>
        <View style={activeStyles.webHeader}>
          <Text style={activeStyles.webHeaderTitle}>🗺  Peta Rute</Text>
          <Text style={activeStyles.webHeaderSub}>Peta interaktif tersedia di perangkat Android & iOS</Text>
        </View>

        <View style={activeStyles.webStatsGrid}>
          <StatBox icon="📍" label="Total Titik" value={`${coordinates.length}`} accent={colors.primary} />
          <StatBox
            icon="📏"
            label="Total Jarak"
            value={coordinates.length > 1 ? formatDistance(totalDistance) : '—'}
            accent={colors.success}
          />
        </View>

        {firstCoord && (
          <View style={activeStyles.webCoordCard}>
            <CoordRow
              label="📌 Titik Awal"
              lat={formatCoord(firstCoord.latitude)}
              lon={formatCoord(firstCoord.longitude)}
              colors={colors}
              activeStyles={activeStyles}
            />
            {lastCoord && (
              <CoordRow
                label="🏁 Titik Akhir"
                lat={formatCoord(lastCoord.latitude)}
                lon={formatCoord(lastCoord.longitude)}
                last
                colors={colors}
                activeStyles={activeStyles}
              />
            )}
          </View>
        )}

        {coordinates.length === 0 && (
          <View style={activeStyles.emptyState}>
            <Text style={activeStyles.emptyIcon}>🛰️</Text>
            <Text style={activeStyles.emptyTitle}>Belum Ada Rute</Text>
            <Text style={activeStyles.emptyDesc}>Aktifkan tracking GPS untuk mulai merekam rute perjalanan Anda.</Text>
          </View>
        )}

        <TouchableOpacity
          id="map-refresh-btn"
          style={activeStyles.webRefreshBtn}
          onPress={() => fetchRoute(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={activeStyles.webRefreshBtnText}>🔄  Muat Ulang</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ─── Native Map (Android / iOS) ─────────────────────────────────────────
  return (
    <View style={activeStyles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={activeStyles.map}
        initialRegion={initialRegion}
        customMapStyle={colorScheme === 'dark' ? darkMapStyle : []}
        showsUserLocation
        showsCompass={false}
        showsScale
      >
        {coordinates.length > 0 && (
          <>
            <Polyline
              coordinates={coordinates}
              strokeColor={colors.primary}
              strokeWidth={5}
              lineJoin="round"
              lineCap="round"
            />
            {/* Start marker */}
            {firstCoord && (
              <Marker coordinate={firstCoord} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={activeStyles.markerStart}>
                  <Text style={activeStyles.markerText}>▶</Text>
                </View>
              </Marker>
            )}
            {/* End / current location marker */}
            {lastCoord && (
              <Marker
                coordinate={lastCoord}
                title="Lokasi Terkini"
                description={`${formatCoord(lastCoord.latitude)}, ${formatCoord(lastCoord.longitude)}`}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={activeStyles.markerEnd}>
                  <View style={activeStyles.markerEndInner} />
                </View>
              </Marker>
            )}
          </>
        )}
      </MapView>

      {/* Floating header */}
      <View style={activeStyles.floatingHeader}>
        <View style={activeStyles.floatingHeaderInner}>
          <Text style={activeStyles.floatingTitle}>🗺  Peta Rute</Text>
          <View style={activeStyles.floatingBadge}>
            <View style={activeStyles.floatingDot} />
            <Text style={activeStyles.floatingBadgeText}>Live</Text>
          </View>
        </View>
      </View>

      {/* Floating action buttons */}
      <View style={activeStyles.fabGroup}>
        <TouchableOpacity
          id="map-fit-route"
          style={activeStyles.fab}
          onPress={handleFitRoute}
          disabled={coordinates.length < 2}
        >
          <Text style={activeStyles.fabIcon}>⊞</Text>
        </TouchableOpacity>
        <TouchableOpacity
          id="map-refresh"
          style={[activeStyles.fab, refreshing && activeStyles.fabDisabled]}
          onPress={() => fetchRoute(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={activeStyles.fabIcon}>↻</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom info panel */}
      <View style={activeStyles.bottomPanel}>
        {/* Route stats row */}
        <View style={activeStyles.statsRow}>
          <MiniStat icon="📍" label="Titik" value={`${coordinates.length}`} colors={colors} activeStyles={activeStyles} />
          <View style={activeStyles.statDivider} />
          <MiniStat
            icon="📏"
            label="Jarak"
            value={coordinates.length > 1 ? formatDistance(totalDistance) : '—'}
            colors={colors}
            activeStyles={activeStyles}
          />
          <View style={activeStyles.statDivider} />
          <MiniStat
            icon="🏁"
            label="Status"
            value={locations.some((l) => !l.isSynced) ? 'Pending Sync' : 'Tersinkron'}
            valueColor={locations.some((l) => !l.isSynced) ? colors.danger : colors.success}
            colors={colors}
            activeStyles={activeStyles}
          />
        </View>

        {/* Coordinates */}
        {lastCoord && (
          <View style={activeStyles.coordRow}>
            <Text style={activeStyles.coordLabel}>📌 Posisi Terkini</Text>
            <Text style={activeStyles.coordValue}>
              {formatCoord(lastCoord.latitude)}, {formatCoord(lastCoord.longitude)}
            </Text>
          </View>
        )}

        {coordinates.length === 0 && (
          <View style={activeStyles.noDataRow}>
            <Text style={activeStyles.noDataText}>🛰️  Belum ada titik GPS terekam. Aktifkan tracking.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Mini stat component ──────────────────────────────────────────────────
function MiniStat({
  icon,
  label,
  value,
  valueColor,
  colors,
  activeStyles,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  colors: typeof Colors.light;
  activeStyles: any;
}) {
  return (
    <View style={activeStyles.miniStat}>
      <Text style={activeStyles.miniStatIcon}>{icon}</Text>
      <Text style={[activeStyles.miniStatValue, { color: valueColor || colors.text }]}>{value}</Text>
      <Text style={activeStyles.miniStatLabel}>{label}</Text>
    </View>
  );
}

// ─── Web stat box ─────────────────────────────────────────────────────────
function StatBox({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={[stylesWeb.webStatBox, { borderColor: accent + '44', backgroundColor: accent + '12' }]}>
      <Text style={stylesWeb.webStatIcon}>{icon}</Text>
      <Text style={[stylesWeb.webStatValue, { color: accent }]}>{value}</Text>
      <Text style={stylesWeb.webStatLabel}>{label}</Text>
    </View>
  );
}

// ─── Web coord row ────────────────────────────────────────────────────────
function CoordRow({
  label,
  lat,
  lon,
  last = false,
  colors,
  activeStyles,
}: {
  label: string;
  lat: string;
  lon: string;
  last?: boolean;
  colors: typeof Colors.light;
  activeStyles: any;
}) {
  return (
    <View style={[activeStyles.webCoordRow, last && { borderBottomWidth: 0 }]}>
      <Text style={activeStyles.webCoordLabel}>{label}</Text>
      <Text style={activeStyles.webCoordValue}>
        {lat}, {lon}
      </Text>
    </View>
  );
}

// ─── Dark map style ───────────────────────────────────────────────────────
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0c1220' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0c1220' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4a6080' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2d45' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0d1827' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1e3a5f' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#071524' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#0a1a2e' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0a1e1a' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#0d1827' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1a2d45' }] },
];

const stylesWeb = StyleSheet.create({
  webStatBox: {
    flex: 1,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
  },
  webStatIcon: { fontSize: 24, marginBottom: 8 },
  webStatValue: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  webStatLabel: { fontSize: 11, color: '#4a6080', fontWeight: '600' },
});

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = (colors: typeof Colors.light) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 14,
  },
  loaderText: { color: colors.textMuted, fontSize: 14, fontWeight: '500' },
  map: { flex: 1 },

  // Floating header
  floatingHeader: {
    position: 'absolute',
    top: 52,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  floatingHeaderInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card + 'cc',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  floatingTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  floatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successBg,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  floatingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  floatingBadgeText: { color: colors.success, fontSize: 12, fontWeight: '600' },

  // FAB group
  fabGroup: {
    position: 'absolute',
    right: 16,
    bottom: 220,
    gap: 10,
  },
  fab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabDisabled: { opacity: 0.5 },
  fabIcon: { color: colors.text, fontSize: 18, fontWeight: '700' },

  // Bottom panel
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card + 'fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  miniStat: { alignItems: 'center', flex: 1 },
  miniStatIcon: { fontSize: 18, marginBottom: 4 },
  miniStatValue: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 2 },
  miniStatLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coordLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  coordValue: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  noDataRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  noDataText: { color: colors.textMuted, fontSize: 13 },

  // Markers
  markerStart: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  markerEnd: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  markerEndInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },

  // Web fallback
  webContainer: { flex: 1, backgroundColor: colors.background },
  webContent: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  webHeader: { marginBottom: 28 },
  webHeaderTitle: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 6 },
  webHeaderSub: { fontSize: 13, color: colors.textMuted },
  webStatsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  webCoordCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  webCoordRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 6,
  },
  webCoordLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginBottom: 4 },
  webCoordValue: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptyDesc: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  webRefreshBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  webRefreshBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
