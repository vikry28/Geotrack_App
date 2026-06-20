import { AppDispatch } from "@/src/core/store/store";
import { useAuth } from "@/src/features/auth/presentation/hooks/useAuth";
import { useTracking } from "@/src/features/tracking/presentation/hooks/useTracking";
import { useIsFocused } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Platform,
} from "react-native";
import { useDispatch } from "react-redux";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { toggleTheme } from "@/src/core/store/themeSlice";

interface Stats {
  total: number;
  synced: number;
  unsynced: number;
}

export default function ProfileScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { username, email, userId, logoutUser } = useAuth();
  const { getLocations } = useTracking();
  const isFocused = useIsFocused();
  const [stats, setStats] = useState<Stats>({
    total: 0,
    synced: 0,
    unsynced: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const activeStyles = styles(colors);

  useEffect(() => {
    if (!isFocused) return;
    (async () => {
      setLoadingStats(true);
      try {
        const all = await getLocations(userId ?? '');
        const synced = all.filter((l) => l.isSynced).length;
        setStats({ total: all.length, synced, unsynced: all.length - synced });
      } catch {
        setStats({ total: 0, synced: 0, unsynced: 0 });
      } finally {
        setLoadingStats(false);
      }
    })();
  }, [isFocused, userId, getLocations]);

  const avatarLetter = (username || "U").charAt(0).toUpperCase();

  const handleLogout = () => {
    Alert.alert(
      "Konfirmasi Logout",
      "Apakah Anda yakin ingin keluar dari akun ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, Keluar",
          style: "destructive",
          onPress: () => logoutUser().catch(() => {}),
        },
      ],
    );
  };

  const handleToggleTheme = () => {
    dispatch(toggleTheme());
  };

  return (
    <ScrollView style={activeStyles.container} contentContainerStyle={activeStyles.content}>
      {/* Profile Card */}
      <View style={activeStyles.profileCard}>
        <View style={activeStyles.avatar}>
          <Text style={activeStyles.avatarText}>{avatarLetter}</Text>
        </View>
        <Text style={activeStyles.name}>{username || "Pengguna"}</Text>
        <Text style={activeStyles.email}>{email || "—"}</Text>
        <View style={activeStyles.badge}>
          <View style={activeStyles.badgeDot} />
          <Text style={activeStyles.badgeText}>Aktif</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={activeStyles.sectionLabel}>
        <Text style={activeStyles.sectionTitle}>Statistik Pelacakan</Text>
      </View>
      {loadingStats ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
      ) : (
        <View style={activeStyles.statsRow}>
          <View style={[activeStyles.statCard, activeStyles.statCardBlue]}>
            <Text style={activeStyles.statValue}>{stats.total}</Text>
            <Text style={activeStyles.statLabel}>Total Titik</Text>
          </View>
          <View style={[activeStyles.statCard, activeStyles.statCardGreen]}>
            <Text style={activeStyles.statValue}>{stats.synced}</Text>
            <Text style={activeStyles.statLabel}>Tersinkron</Text>
          </View>
          <View style={[activeStyles.statCard, activeStyles.statCardOrange]}>
            <Text style={activeStyles.statValue}>{stats.unsynced}</Text>
            <Text style={activeStyles.statLabel}>Offline Queue</Text>
          </View>
        </View>
      )}

      {/* Settings Section */}
      <View style={activeStyles.sectionLabel}>
        <Text style={activeStyles.sectionTitle}>Pengaturan Tampilan</Text>
      </View>
      <View style={activeStyles.infoCard}>
        <View style={activeStyles.settingRow}>
          <Text style={activeStyles.settingIcon}>🌓</Text>
          <Text style={activeStyles.settingLabel}>Mode Gelap (Dark Mode)</Text>
          <Switch
            value={colorScheme === 'dark'}
            onValueChange={handleToggleTheme}
            trackColor={{ false: '#cbd5e1', true: colors.primary }}
            thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
          />
        </View>
      </View>

      {/* Info Section */}
      <View style={activeStyles.sectionLabel}>
        <Text style={activeStyles.sectionTitle}>Informasi Aplikasi</Text>
      </View>
      <View style={activeStyles.infoCard}>
        <InfoRow icon="📍" label="Aplikasi" value="GeoTrack v1.0.0" colors={colors} activeStyles={activeStyles} />
        <InfoRow
          icon="🔄"
          label="Sync Mode"
          value="Offline-First + WebSocket"
          colors={colors}
          activeStyles={activeStyles}
        />
        <InfoRow icon="📡" label="Tracking Interval" value="10 detik" last colors={colors} activeStyles={activeStyles} />
      </View>

      {/* Logout */}
      <TouchableOpacity
        id="profile-logout"
        style={activeStyles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.85}
      >
        <MaterialIcons name="logout" size={20} color={colors.danger} />
        <Text style={activeStyles.logoutText}>Keluar dari Akun</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last = false,
  colors,
  activeStyles,
}: {
  icon: string;
  label: string;
  value: string;
  last?: boolean;
  colors: typeof Colors.light;
  activeStyles: any;
}) {
  return (
    <View style={[activeStyles.infoRow, last && { borderBottomWidth: 0 }]}>
      <Text style={activeStyles.infoIcon}>{icon}</Text>
      <Text style={activeStyles.infoLabel}>{label}</Text>
      <Text style={activeStyles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = (colors: typeof Colors.light) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },

  // Profile card
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 28,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryBg,
    borderWidth: 3,
    borderColor: colors.primary + '55',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarText: { fontSize: 34, fontWeight: "800", color: colors.primary },
  name: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 4 },
  email: { fontSize: 14, color: colors.textMuted, marginBottom: 14 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.successBg,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  badgeText: { color: colors.success, fontSize: 12, fontWeight: "600" },

  // Section
  sectionLabel: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Stats
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  statCardBlue: { backgroundColor: colors.primaryBg, borderColor: colors.primary + '30' },
  statCardGreen: { backgroundColor: colors.successBg, borderColor: colors.success + '30' },
  statCardOrange: { backgroundColor: colors.dangerBg, borderColor: colors.danger + '30' },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    fontWeight: "600",
  },

  // Info card
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 28,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  infoIcon: { fontSize: 18, width: 28 },
  infoLabel: { flex: 1, fontSize: 14, color: colors.textMuted },
  infoValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },

  // Settings Toggle
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  settingIcon: { fontSize: 18, width: 28 },
  settingLabel: { flex: 1, fontSize: 14, color: colors.text, fontWeight: "500" },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.danger + '44',
    borderRadius: 14,
    paddingVertical: 15,
    gap: 10,
  },
  logoutText: { color: colors.danger, fontSize: 16, fontWeight: "700" },
});
