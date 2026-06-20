import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LocationEntity } from '@/src/features/tracking/domain/entities/LocationEntity';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '@/src/features/auth/presentation/hooks/useAuth';
import { useTracking } from '@/src/features/tracking/presentation/hooks/useTracking';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function HistoryScreen() {
  const isFocused = useIsFocused();
  const { userId } = useAuth();
  const { getLocations, clearLocations } = useTracking();
  const [history, setHistory] = useState<LocationEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const activeStyles = styles(colors);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await getLocations(userId ?? '');
      setHistory(data);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  }, [getLocations, userId]);

  useEffect(() => {
    if (isFocused) {
      fetchHistory();
    }
  }, [isFocused, fetchHistory]);

  const handleClearHistory = () => {
    Alert.alert('Hapus Semua Riwayat', 'Apakah Anda yakin ingin menghapus seluruh riwayat rute perjalanan?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus Semua',
        style: 'destructive',
        onPress: async () => {
          await clearLocations(userId ?? '');
          fetchHistory();
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: LocationEntity }) => {
    const timeStr = new Date(item.timestamp).toLocaleTimeString();
    const dateStr = new Date(item.timestamp).toLocaleDateString();

    return (
      <View style={activeStyles.timelineItem}>
        <View style={activeStyles.timelineLineContainer}>
          <View style={[activeStyles.timelineDot, item.isSynced ? activeStyles.dotSynced : activeStyles.dotUnsynced]} />
          <View style={activeStyles.timelineLine} />
        </View>
        <ThemedView style={activeStyles.itemContent}>
          <View style={activeStyles.itemHeader}>
            <ThemedText style={activeStyles.timeText}>{dateStr} {timeStr}</ThemedText>
            <View style={[activeStyles.syncBadge, item.isSynced ? activeStyles.badgeSynced : activeStyles.badgeUnsynced]}>
              <ThemedText style={activeStyles.badgeText}>
                {item.isSynced ? 'Tersinkron' : 'Offline'}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={activeStyles.coordsText}>
            Lat: {item.latitude.toFixed(6)}, Lon: {item.longitude.toFixed(6)}
          </ThemedText>
        </ThemedView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={activeStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={activeStyles.container}>
      <View style={activeStyles.header}>
        <ThemedText type="subtitle" style={activeStyles.headerTitle}>
          Riwayat Rute
        </ThemedText>
        {history.length > 0 && (
          <TouchableOpacity style={activeStyles.clearBtn} onPress={handleClearHistory}>
            <ThemedText style={activeStyles.clearBtnText}>Hapus</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={activeStyles.emptyContainer}>
          <ThemedText style={activeStyles.emptyText}>Belum ada riwayat koordinat terekam.</ThemedText>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={activeStyles.listContainer}
        />
      )}
    </View>
  );
}

const styles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 22,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.danger + '44',
  },
  clearBtnText: {
    color: colors.danger,
    fontWeight: 'bold',
    fontSize: 12,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 80,
  },
  timelineLineContainer: {
    alignItems: 'center',
    marginRight: 16,
    width: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
  },
  dotSynced: {
    backgroundColor: colors.success,
  },
  dotUnsynced: {
    backgroundColor: colors.danger,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  itemContent: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  syncBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeSynced: {
    backgroundColor: colors.successBg,
  },
  badgeUnsynced: {
    backgroundColor: colors.dangerBg,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text,
  },
  coordsText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
  },
});
