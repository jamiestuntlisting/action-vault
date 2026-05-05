// Lightweight toast — top-of-screen pill that auto-dismisses. Built so any
// component (inside AppProvider) can `useToast().show('Marked as watched')`
// without dragging in a dependency or wiring per-screen state.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../theme';

interface ToastApi {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastApi>({ show: () => {} });

export function useToast(): ToastApi {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<any>(null);

  const show = useCallback((m: string) => {
    setMessage(m);
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    dismissTimer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMessage(null);
      });
    }, 1800);
  }, [opacity]);

  useEffect(() => () => { if (dismissTimer.current) clearTimeout(dismissTimer.current); }, []);

  const api = useMemo<ToastApi>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {message && (
        <Animated.View
          pointerEvents="none"
          // Position-fixed at the top center on web so it floats above the
          // app shell. On native this is `position: absolute` from the root,
          // which works because the provider lives at App.tsx top level.
          style={[
            styles.container,
            Platform.OS === 'web' ? (styles.containerWeb as any) : null,
            { opacity },
          ]}
        >
          <View style={styles.pill}>
            <Text style={styles.text} numberOfLines={2}>{message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 24 : 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  // RN-Web supports position: 'fixed' via a string cast. Using fixed keeps
  // the pill anchored to the viewport even when the page scrolls.
  containerWeb: {
    position: 'fixed' as any,
  },
  pill: {
    backgroundColor: 'rgba(20,20,20,0.96)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.divider,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
});
