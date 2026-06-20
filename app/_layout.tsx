import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Provider, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet, Image, Text, Animated } from 'react-native';
import { store, AppDispatch } from '@/src/core/store/store';
import { initializeDb } from '@/src/core/database/database';
import { loadStoredSession } from '@/src/features/auth/presentation/redux/authSlice';
import { loadStoredTheme } from '@/src/core/store/themeSlice';
import '@/src/features/tracking/data/tasks/LocationBackgroundTask';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/features/auth/presentation/hooks/useAuth';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNavigation() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const segments = useSegments();
  const [dbReady, setDbReady] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(0.7));

  // Pulse animation for logo
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Step 1: Initialize database FIRST before anything else
  useEffect(() => {
    initializeDb()
      .then(() => {
        setDbReady(true);
        // Step 2: Load auth session and theme only AFTER DB is ready
        dispatch(loadStoredSession());
        dispatch(loadStoredTheme());
      })
      .catch((err) => {
        console.error('[GeoTrack] Fatal: Database initialization failed:', err);
      });
  }, [dispatch]);

  // Step 3: Route guard runs only once both DB and auth are ready
  useEffect(() => {
    if (!dbReady || authLoading) return;

    const currentSegment = segments[0] as string;
    const inTabsGroup = currentSegment === '(tabs)';
    const inLogin = currentSegment === 'login';

    if (!isAuthenticated && inTabsGroup) {
      router.replace('/login' as any);
    } else if (isAuthenticated && inLogin) {
      router.replace('/(tabs)' as any);
    }
  }, [isAuthenticated, authLoading, dbReady, segments, router]);

  // Show splash loader while DB or auth session is loading
  if (!dbReady || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={[styles.logoWrapper, { opacity: pulseAnim }]}>
          <Image
            source={require('@/assets/images/splash-icon.png')}
            style={styles.splashLogo}
            resizeMode="contain"
          />
        </Animated.View>
        
        <View style={styles.loaderContent}>
          <Text style={styles.brandTitle}>GeoTrack</Text>
          <Text style={styles.brandSubtitle}>INTELLIGENT ROUTE TRACKER</Text>
          
          <View style={styles.progressContainer}>
            <ActivityIndicator size="small" color="#0077cc" />
            <Text style={styles.loadingText}>Menginisialisasi sistem...</Text>
          </View>
        </View>

        <Text style={styles.footerVersion}>v1.0.0 • Secure Location Agent</Text>
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
    </Stack>
  );
}

function RootLayoutInner() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <RootLayoutNavigation />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootLayoutInner />
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logoWrapper: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0077cc',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  splashLogo: {
    width: 140,
    height: 140,
  },
  loaderContent: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0d1827',
    letterSpacing: 2,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0077cc',
    letterSpacing: 3,
    marginBottom: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f5fa',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dde6f0',
    gap: 10,
  },
  loadingText: {
    color: '#5a7090',
    fontSize: 13,
    fontWeight: '500',
  },
  footerVersion: {
    position: 'absolute',
    bottom: 24,
    color: '#8aabb0',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
