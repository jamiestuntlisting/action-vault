import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight } from '../../theme';
import { useAppState } from '../../services/AppState';

export function SplashScreen({ navigation }: any) {
  const { state } = useAppState();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      if (state.isLoading) return;
      if (!state.isAuthenticated) {
        navigation.replace('Auth');
      } else {
        navigation.replace('MainTabs');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [state.isLoading]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Ionicons name="film" size={64} color={Colors.primary} />
        <Text style={styles.title}>ACTION VAULT</Text>
        <Text style={styles.subtitle}>Behind the Stunts</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  title: {
    color: Colors.primary,
    fontSize: FontSize.display,
    fontWeight: FontWeight.heavy,
    letterSpacing: 6,
    marginTop: 12,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    marginTop: 8,
    letterSpacing: 2,
  },
});
