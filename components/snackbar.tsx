import React, { useEffect, useRef, useCallback } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';

export type SnackbarType = 'success' | 'error' | 'info';

interface SnackbarProps {
  visible: boolean;
  message: string;
  type?: SnackbarType;
  duration?: number;
  onDismiss: () => void;
}

const TYPE_CONFIG: Record<SnackbarType, { bg: string; border: string; icon: string }> = {
  success: { bg: '#0a2a1a', border: '#00c896', icon: '✓' },
  error:   { bg: '#2a0a0a', border: '#ff4d4d', icon: '✕' },
  info:    { bg: '#0a1a2a', border: '#00a8ff', icon: 'ℹ' },
};

export function Snackbar({
  visible,
  message,
  type = 'info',
  duration = 3500,
  onDismiss,
}: SnackbarProps) {
  const translateY = useRef(new Animated.Value(120)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 120,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  }, [translateY, opacity, onDismiss]);

  useEffect(() => {
    if (visible) {
      // Clear any running timer
      if (timerRef.current) clearTimeout(timerRef.current);

      // Slide in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss
      timerRef.current = setTimeout(() => hide(), duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, duration, translateY, opacity, hide]);

  if (!visible) return null;

  const cfg = TYPE_CONFIG[type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: cfg.bg,
          borderColor: cfg.border,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      {/* Icon circle */}
      <View style={[styles.iconCircle, { borderColor: cfg.border }]}>
        <Text style={[styles.iconText, { color: cfg.border }]}>{cfg.icon}</Text>
      </View>

      {/* Message */}
      <Text style={styles.message} numberOfLines={3}>
        {message}
      </Text>

      {/* Dismiss */}
      <TouchableOpacity onPress={hide} style={styles.closeBtn} activeOpacity={0.7}>
        <Text style={[styles.closeText, { color: cfg.border }]}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────
interface SnackbarState {
  visible: boolean;
  message: string;
  type: SnackbarType;
}

export function useSnackbar() {
  const [snack, setSnack] = React.useState<SnackbarState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showSnackbar = useCallback(
    (message: string, type: SnackbarType = 'info') => {
      // Force re-mount if already visible
      setSnack({ visible: false, message, type });
      setTimeout(() => setSnack({ visible: true, message, type }), 50);
    },
    []
  );

  const hideSnackbar = useCallback(() => {
    setSnack((prev) => ({ ...prev, visible: false }));
  }, []);

  return { snack, showSnackbar, hideSnackbar };
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 48 : 32,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    zIndex: 9999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  message: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
    flexShrink: 0,
  },
  closeText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
