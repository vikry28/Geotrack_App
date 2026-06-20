import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Text,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/features/auth/presentation/hooks/useAuth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Snackbar, useSnackbar } from '@/components/snackbar';

// ─── Validation helpers ────────────────────────────────────────────────────
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  const router = useRouter();
  const { isAuthenticated, loading, error, login, clearAuthError } = useAuth();
  const wasLoading = useRef(false);
  const { snack, showSnackbar, hideSnackbar } = useSnackbar();

  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const activeStyles = styles(colors);

  // Field-level validation errors
  const errors = {
    email: !email.trim()
      ? 'Email wajib diisi'
      : !isValidEmail(email)
      ? 'Format email tidak valid'
      : '',
    password: !password
      ? 'Password wajib diisi'
      : password.length < 6
      ? 'Password minimal 6 karakter'
      : '',
  };

  const isFormValid = !errors.email && !errors.password;

  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);

  // Show error snackbar when Redux error is set
  useEffect(() => {
    if (error) {
      showSnackbar(error, 'error');
    }
  }, [error, showSnackbar]);

  // Detect when login transitions from loading → done
  useEffect(() => {
    if (wasLoading.current && !loading) {
      if (isAuthenticated) {
        showSnackbar('Login berhasil! Selamat datang 👋', 'success');
        setTimeout(() => router.replace('/(tabs)' as any), 1200);
      }
    }
    wasLoading.current = loading;
  }, [loading, isAuthenticated, router, showSnackbar]);

  const handleLogin = () => {
    setTouched({ email: true, password: true });
    if (!isFormValid) return;
    login(email, password).catch(() => {});
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={activeStyles.container}
      >
        <ScrollView contentContainerStyle={activeStyles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={activeStyles.header}>
            <View style={activeStyles.logoCircle}>
              <Text style={activeStyles.logoEmoji}>📍</Text>
            </View>
            <Text style={activeStyles.appName}>GeoTrack</Text>
            <Text style={activeStyles.tagline}>Sistem Pelacakan Lokasi Profesional</Text>
          </View>

          {/* Card */}
          <View style={activeStyles.card}>
            <Text style={activeStyles.cardTitle}>Masuk ke Akun</Text>

            {/* Server error banner */}
            {error && (
              <View style={activeStyles.errorBanner}>
                <Text style={activeStyles.errorBannerIcon}>⚠️</Text>
                <Text style={activeStyles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* Email */}
            <View style={activeStyles.fieldGroup}>
              <Text style={activeStyles.label}>Email</Text>
              <TextInput
                id="login-email"
                style={[
                  activeStyles.input,
                  touched.email && errors.email ? activeStyles.inputError : null,
                ]}
                placeholder="contoh@email.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={(t) => { setEmail(t); clearAuthError(); }}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
              {touched.email && errors.email ? (
                <Text style={activeStyles.fieldError}>⚠ {errors.email}</Text>
              ) : null}
            </View>

            {/* Password */}
            <View style={activeStyles.fieldGroup}>
              <Text style={activeStyles.label}>Password</Text>
              <View
                style={[
                  activeStyles.passwordContainer,
                  touched.password && errors.password ? activeStyles.inputError : null,
                ]}
              >
                <TextInput
                  id="login-password"
                  style={activeStyles.passwordInput}
                  placeholder="Min. 6 karakter"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(t) => { setPassword(t); clearAuthError(); }}
                  onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={activeStyles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              {touched.password && errors.password ? (
                <Text style={activeStyles.fieldError}>⚠ {errors.password}</Text>
              ) : null}
            </View>

            {/* Submit */}
            <TouchableOpacity
              id="login-submit"
              style={[activeStyles.btn, (!isFormValid || loading) && activeStyles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={activeStyles.btnText}>Masuk</Text>
              )}
            </TouchableOpacity>

            {/* Register link */}
            <View style={activeStyles.linkRow}>
              <Text style={activeStyles.linkText}>Belum punya akun? </Text>
              <TouchableOpacity id="go-register" onPress={() => router.push('/register' as any)}>
                <Text style={activeStyles.linkAction}>Daftar Sekarang</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Snackbar */}
        <Snackbar
          visible={snack.visible}
          message={snack.message}
          type={snack.type}
          onDismiss={hideSnackbar}
        />
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = (colors: typeof Colors.light) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryBg,
    borderWidth: 2,
    borderColor: colors.primary + '33',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  logoEmoji: { fontSize: 32 },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 1.5,
  },
  tagline: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.danger + '33',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerIcon: { fontSize: 16 },
  errorBannerText: { color: colors.danger, fontSize: 13, flex: 1 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 8 },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.inputTextColor,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingRight: 14,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.inputTextColor,
  },
  eyeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  inputError: { borderColor: colors.danger + '88' },
  fieldError: { color: colors.danger, fontSize: 12, marginTop: 5, marginLeft: 2 },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  btnDisabled: { backgroundColor: colors.border, shadowOpacity: 0 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, alignItems: 'center' },
  linkText: { color: colors.textMuted, fontSize: 14 },
  linkAction: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
