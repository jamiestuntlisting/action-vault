import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider } from './src/services/AppProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ToastProvider } from './src/services/ToastService';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <ToastProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </ToastProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
