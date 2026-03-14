import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';

export function AuthScreen({ navigation }: any) {
  const { dispatch } = useAppState();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Mock auth
    const userId = 'user-' + Date.now();
    dispatch({ type: 'LOGIN', payload: { id: userId, email: email.trim() } });
    dispatch({
      type: 'ADD_PROFILE',
      payload: {
        id: 'profile-' + Date.now(),
        userId,
        name: email.split('@')[0],
        avatarKey: 'stunt',
        experienceLevel: 'fan',
        onboardingComplete: false,
        interests: [],
      },
    });
    navigation.replace('Onboarding');
  }

  function handleAppleSignIn() {
    const userId = 'user-apple-' + Date.now();
    dispatch({ type: 'LOGIN', payload: { id: userId, email: 'user@icloud.com' } });
    dispatch({
      type: 'ADD_PROFILE',
      payload: {
        id: 'profile-' + Date.now(),
        userId,
        name: 'Stunt Fan',
        avatarKey: 'stunt',
        experienceLevel: 'fan',
        onboardingComplete: false,
        interests: [],
      },
    });
    navigation.replace('Onboarding');
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Ionicons name="film" size={48} color={Colors.primary} />
          <Text style={styles.logo}>ACTION VAULT</Text>
          <Text style={styles.tagline}>{isLogin ? 'Welcome back' : 'Join the action'}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.inputPlaceholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.inputPlaceholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor={Colors.inputPlaceholder}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.8}>
            <Text style={styles.submitText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
          </TouchableOpacity>

          {isLogin && (
            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.socialButton} onPress={handleAppleSignIn} activeOpacity={0.8}>
            <Ionicons name="logo-apple" size={22} color={Colors.white} />
            <Text style={styles.socialText}>Sign in with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.socialButton, styles.googleButton]} onPress={handleAppleSignIn} activeOpacity={0.8}>
            <Ionicons name="logo-google" size={20} color={Colors.white} />
            <Text style={styles.socialText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.switchButton} onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Text style={styles.switchHighlight}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
          </Text>
        </TouchableOpacity>
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
  logo: {
    color: Colors.primary,
    fontSize: FontSize.hero,
    fontWeight: FontWeight.heavy,
    letterSpacing: 4,
    marginTop: Spacing.sm,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    marginTop: Spacing.sm,
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
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  submitText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  forgotButton: {
    alignItems: 'center',
  },
  forgotText: {
    color: Colors.textTertiary,
    fontSize: FontSize.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
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
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    height: 52,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  googleButton: {
    backgroundColor: Colors.surface,
  },
  socialText: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
  },
  switchButton: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  switchText: {
    color: Colors.textTertiary,
    fontSize: FontSize.md,
  },
  switchHighlight: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
});
