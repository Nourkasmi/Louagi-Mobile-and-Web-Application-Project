// app/_layout.tsx - Enhanced with Service Initialization
import React, { useEffect, useState } from 'react';
import { Slot } from 'expo-router';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import store from '../src/store/store';
import Config from '../src/config';
import { notificationService } from '../src/services/notifications';
import { offlineService } from '../src/services/offlineService';

const RootLayout: React.FC = () => {
  const [servicesInitialized, setServicesInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      console.log('🚀 Initializing Louagi services...');

      // Initialize push notifications
      const notificationsReady = await notificationService.initialize();
      if (notificationsReady) {
        console.log('✅ Push notifications initialized');
      } else {
        console.log('⚠️ Push notifications not available');
      }

      // Initialize offline service
      await offlineService.initialize();
      console.log('✅ Offline service initialized');

      // Check for pending sync on startup
      const syncInfo = offlineService.getSyncInfo();
      if (syncInfo.pendingActionsCount > 0 && syncInfo.isOnline) {
        console.log(`📤 Syncing ${syncInfo.pendingActionsCount} pending actions...`);
        await offlineService.forcSync();
      }

      setServicesInitialized(true);
      console.log('🎉 All services initialized successfully');

    } catch (error) {
      console.error('❌ Error initializing services:', error);
      setInitializationError('Failed to initialize app services');
      // Continue anyway - app should still be functional
      setServicesInitialized(true);
    }
  };

  if (!servicesInitialized) {
    return (
      <View style={styles.initializationScreen}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.initializationText}>
          Initializing Louagi...
        </Text>
        {initializationError && (
          <Text style={styles.errorText}>{initializationError}</Text>
        )}
      </View>
    );
  }

  return (
    <Provider store={store}>
      <StripeProvider publishableKey={Config.STRIPE_PUBLISHABLE_KEY}>
        <PaperProvider>
          <ServiceMonitor />
          <Slot />
        </PaperProvider>
      </StripeProvider>
    </Provider>
  );
};

// Service Monitor Component - Shows connection and sync status
const ServiceMonitor: React.FC = () => {
  const [syncInfo, setSyncInfo] = useState(offlineService.getSyncInfo());

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncInfo(offlineService.getSyncInfo());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Only show status bar if offline or have pending actions
  if (syncInfo.isOnline && syncInfo.pendingActionsCount === 0) {
    return null;
  }

  return (
    <View style={styles.statusBar}>
      {!syncInfo.isOnline && (
        <Text style={styles.statusText}>📱 Offline Mode</Text>
      )}
      {syncInfo.pendingActionsCount > 0 && (
        <Text style={styles.statusText}>
          📤 {syncInfo.pendingActionsCount} actions pending sync
        </Text>
      )}
      {syncInfo.isSyncing && (
        <Text style={styles.statusText}>🔄 Syncing...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  initializationScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  initializationText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#ff4444',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statusBar: {
    backgroundColor: '#fff3cd',
    borderBottomWidth: 1,
    borderBottomColor: '#ffeaa7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 44, // Account for status bar
  },
  statusText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default RootLayout;