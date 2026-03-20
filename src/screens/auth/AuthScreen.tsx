import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';

const API_BASE = Platform.OS === 'web'
  ? '' // Same origin on web
  : 'https://actionvault.stuntlisting.com'; // Production URL for native

export function AuthScreen({ navigation }: any) {
  const { dispatch } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleStuntListingLogin() {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter your email and password');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/stuntlisting-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.error || 'Invalid email or password');
        setIsLoading(false);
        return;
      }

      // Dispatch login with user data and token
      dispatch({
        type: 'LOGIN',
        payload: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          token: data.token,
        },
      });

      // Create a profile for the user
      dispatch({
        type: 'ADD_PROFILE',
        payload: {
          id: 'profile-' + data.user.id,
          userId: data.user.id,
          name: data.user.name || email.split('@')[0],
          avatarKey: 'stunt',
          experienceLevel: data.user.role === 'coordinator' ? 'professional' : 'fan',
          onboardingComplete: false,
          interests: [],
        },
      });

      navigation.replace('Onboarding');
    } catch (error) {
      setErrorMessage('Unable to connect. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleGuestAccess() {
    const userId = 'user-guest-' + Date.now();
    dispatch({ type: 'LOGIN', payload: { id: userId, email: 'guest@actionvault.app' } });
    dispatch({
      type: 'ADD_PROFILE',
      payload: {
        id: 'profile-' + Date.now(),
        userId,
        name: 'Guest',
        avatarKey: 'stunt',
        experienceLevel: 'fan',
        onboardingComplete: true,
        interests: [],
      },
    });
    dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
    navigation.replace('MainTabs');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* StuntListing Branding */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="flash" size={36} color={Colors.accent} />
            <Text style={styles.logoText}>STUNTLISTING</Text>
          </View>
          <Text style={styles.appName}>ACTION VAULT</Text>
          <Text style={styles.tagline}>Sign in with your StuntListing account</Text>
        </View>

        {/* Error Message */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={18} color={Colors.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Login Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={Colors.textTertiary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.inputPlaceholder}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrorMessage('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={Colors.textTertiary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.inputPlaceholder}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrorMessage('');
              }}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={isLoading}>
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={Colors.textTertiary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleStuntListingLogin}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <View style={styles.submitContent}>
                <Ionicons name="flash" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                <Text style={styles.submitText}>Sign In with StuntListing</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Continue as Guest */}
        <TouchableOpacity
          style={styles.guestButton}
          onPress={handleGuestAccess}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          <Text style={styles.guestText}>Continue as Guest</Text>
        </TouchableOpacity>

        <Text style={styles.guestNote}>
          Guest access provides limited features. Sign in with your StuntListing account for full
          access.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.section,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoText: {
    color: Colors.accent,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.heavy,
    letterSpacing: 3,
    marginLeft: Spacing.sm,
  },
  appName: {
    color: Colors.primary,
    fontSize: FontSize.hero,
    fontWeight: FontWeight.heavy,
    letterSpacing: 4,
    marginTop: Spacing.xs,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.md,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  form: {
    gap: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.lg,
    height: 52,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
  },
  submitButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginHorizontal: Spacing.lg,
  },
  guestButton: {
    borderRadius: BorderRadius.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guestText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
  },
  guestNote: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 18,
  },
});
