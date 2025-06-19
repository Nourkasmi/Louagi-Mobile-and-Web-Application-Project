// src/services/offlineService.ts - Fixed with React import
import React from 'react'; // ← ADDED: Missing React import
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { syncOfflineData, getOfflineData } from './api';
import { notificationService } from './notifications';

export interface OfflineAction {
  id: string;
  type: 'booking_create' | 'booking_cancel' | 'trip_update' | 'payment_attempt';
  data: any;
  timestamp: string;
  synced: boolean;
}

export interface OfflineData {
  stations: any[];
  userBookings: any[];
  driverTrips?: any[];
  lastSync: string;
}

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
}

class OfflineService {
  private isOnline: boolean = true;
  private pendingActions: OfflineAction[] = [];
  private offlineData: OfflineData | null = null;
  private syncInProgress: boolean = false;
  private networkListener: any = null;

  // Storage keys
  private readonly PENDING_ACTIONS_KEY = '@louagi_pending_actions';
  private readonly OFFLINE_DATA_KEY = '@louagi_offline_data';
  private readonly LAST_SYNC_KEY = '@louagi_last_sync';

  /**
   * Initialize offline service
   */
  async initialize(): Promise<void> {
    try {
      // Load pending actions from storage
      await this.loadPendingActions();
      
      // Load cached offline data
      await this.loadOfflineData();
      
      // Setup network listener
      this.setupNetworkListener();
      
      // Check initial network state
      const networkState = await NetInfo.fetch();
      this.handleNetworkChange(networkState);

      console.log('Offline service initialized');
    } catch (error) {
      console.error('Error initializing offline service:', error);
    }
  }

  /**
   * Setup network state listener
   */
  private setupNetworkListener(): void {
    this.networkListener = NetInfo.addEventListener((state) => {
      this.handleNetworkChange(state);
    });
  }

  /**
   * Handle network state changes
   */
  private handleNetworkChange = async (state: any): Promise<void> => {
    const wasOnline = this.isOnline;
    this.isOnline = state.isConnected && state.isInternetReachable;

    console.log('Network state changed:', {
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type
    });

    // If we just came back online, sync pending actions
    if (!wasOnline && this.isOnline) {
      await this.handleBackOnline();
    }

    // If we just went offline, prepare offline mode
    if (wasOnline && !this.isOnline) {
      await this.handleGoingOffline();
    }
  };

  /**
   * Handle coming back online
   */
  private async handleBackOnline(): Promise<void> {
    try {
      console.log('Back online - syncing pending actions');
      
      // Show notification
      await notificationService.sendLocalNotification({
        type: 'trip_update',
        title: 'Back Online! 📶',
        body: 'Syncing your data...',
      });

      // Sync pending actions
      await this.syncPendingActions();
      
      // Refresh offline data cache
      await this.refreshOfflineData();

      console.log('Successfully synced after coming back online');
    } catch (error) {
      console.error('Error syncing after coming back online:', error);
    }
  }

  /**
   * Handle going offline
   */
  private async handleGoingOffline(): Promise<void> {
    try {
      console.log('Going offline - preparing offline mode');
      
      // Show notification
      await notificationService.sendLocalNotification({
        type: 'trip_update',
        title: 'Offline Mode 📱',
        body: 'Limited functionality available offline',
      });

      // Cache essential data if we have connection briefly
      if (this.pendingActions.length === 0) {
        await this.refreshOfflineData();
      }

    } catch (error) {
      console.error('Error preparing for offline mode:', error);
    }
  }

  /**
   * Add action to pending queue
   */
  async addPendingAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced'>): Promise<string> {
    const offlineAction: OfflineAction = {
      ...action,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      synced: false,
    };

    this.pendingActions.push(offlineAction);
    await this.savePendingActions();

    console.log('Added pending action:', offlineAction);
    return offlineAction.id;
  }

  /**
   * Sync all pending actions with server
   */
  async syncPendingActions(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.pendingActions.length === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      const unsyncedActions = this.pendingActions.filter(action => !action.synced);
      
      if (unsyncedActions.length === 0) {
        this.syncInProgress = false;
        return;
      }

      console.log(`Syncing ${unsyncedActions.length} pending actions`);

      // Send actions to server
      const response = await syncOfflineData(unsyncedActions);

      if (response.success) {
        // Mark actions as synced
        unsyncedActions.forEach(action => {
          const index = this.pendingActions.findIndex(a => a.id === action.id);
          if (index !== -1) {
            this.pendingActions[index].synced = true;
          }
        });

        // Remove synced actions older than 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        this.pendingActions = this.pendingActions.filter(action => 
          !action.synced || new Date(action.timestamp) > oneDayAgo
        );

        await this.savePendingActions();
        console.log('Successfully synced pending actions');
      } else {
        console.error('Failed to sync pending actions:', response.message);
      }

    } catch (error) {
      console.error('Error syncing pending actions:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Refresh offline data cache
   */
  async refreshOfflineData(): Promise<void> {
    if (!this.isOnline) {
      console.log('Skipping offline data refresh - no internet connection');
      return;
    }

    try {
      console.log('Refreshing offline data cache');
      
      const response = await getOfflineData();
      
      if (response.success && response.data) {
        this.offlineData = {
          ...response.data,
          lastSync: new Date().toISOString(),
        };
        
        await this.saveOfflineData();
        console.log('Offline data cache refreshed');
      }

    } catch (error) {
      console.error('Error refreshing offline data:', error);
    }
  }

  /**
   * Get cached data for offline use
   */
  getOfflineData(): OfflineData | null {
    return this.offlineData;
  }

  /**
   * Check if we have recent offline data
   */
  hasRecentOfflineData(): boolean {
    if (!this.offlineData || !this.offlineData.lastSync) {
      return false;
    }

    const lastSync = new Date(this.offlineData.lastSync);
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    
    return lastSync > sixHoursAgo;
  }

  /**
   * Get network status
   */
  getNetworkStatus(): { isOnline: boolean; hasPendingActions: boolean } {
    return {
      isOnline: this.isOnline,
      hasPendingActions: this.pendingActions.some(action => !action.synced),
    };
  }

  /**
   * Attempt offline booking (will sync when online)
   */
  async createOfflineBooking(bookingData: any): Promise<string> {
    const actionId = await this.addPendingAction({
      type: 'booking_create',
      data: bookingData,
    });

    // Show offline notification
    await notificationService.sendLocalNotification({
      type: 'booking_confirmed',
      title: 'Booking Queued 📋',
      body: 'Your booking will be processed when connection is restored.',
    });

    return actionId;
  }

  /**
   * Attempt offline booking cancellation
   */
  async cancelOfflineBooking(bookingId: string, reason: string): Promise<string> {
    const actionId = await this.addPendingAction({
      type: 'booking_cancel',
      data: { bookingId, reason },
    });

    // Show offline notification
    await notificationService.sendLocalNotification({
      type: 'cancellation',
      title: 'Cancellation Queued ❌',
      body: 'Your cancellation will be processed when connection is restored.',
    });

    return actionId;
  }

  /**
   * Load pending actions from storage
   */
  private async loadPendingActions(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.PENDING_ACTIONS_KEY);
      if (stored) {
        this.pendingActions = JSON.parse(stored);
        console.log(`Loaded ${this.pendingActions.length} pending actions`);
      }
    } catch (error) {
      console.error('Error loading pending actions:', error);
      this.pendingActions = [];
    }
  }

  /**
   * Save pending actions to storage
   */
  private async savePendingActions(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.PENDING_ACTIONS_KEY, 
        JSON.stringify(this.pendingActions)
      );
    } catch (error) {
      console.error('Error saving pending actions:', error);
    }
  }

  /**
   * Load offline data from storage
   */
  private async loadOfflineData(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.OFFLINE_DATA_KEY);
      if (stored) {
        this.offlineData = JSON.parse(stored);
        console.log('Loaded offline data cache');
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
      this.offlineData = null;
    }
  }

  /**
   * Save offline data to storage
   */
  private async saveOfflineData(): Promise<void> {
    try {
      if (this.offlineData) {
        await AsyncStorage.setItem(
          this.OFFLINE_DATA_KEY, 
          JSON.stringify(this.offlineData)
        );
      }
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  /**
   * Generate unique ID for actions
   */
  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Force sync (manual trigger)
   */
  async forcSync(): Promise<boolean> {
    if (!this.isOnline) {
      await notificationService.sendLocalNotification({
        type: 'trip_update',
        title: 'No Internet Connection',
        body: 'Please check your internet connection and try again.',
      });
      return false;
    }

    await this.syncPendingActions();
    await this.refreshOfflineData();
    return true;
  }

  /**
   * Clear all offline data (for logout)
   */
  async clearOfflineData(): Promise<void> {
    try {
      this.pendingActions = [];
      this.offlineData = null;
      
      await AsyncStorage.multiRemove([
        this.PENDING_ACTIONS_KEY,
        this.OFFLINE_DATA_KEY,
        this.LAST_SYNC_KEY,
      ]);
      
      console.log('Cleared all offline data');
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  }

  /**
   * Get sync status info
   */
  getSyncInfo(): {
    lastSync: string | null;
    pendingActionsCount: number;
    isOnline: boolean;
    isSyncing: boolean;
  } {
    return {
      lastSync: this.offlineData?.lastSync || null,
      pendingActionsCount: this.pendingActions.filter(a => !a.synced).length,
      isOnline: this.isOnline,
      isSyncing: this.syncInProgress,
    };
  }

  /**
   * Cleanup (call when app is closing)
   */
  cleanup(): void {
    if (this.networkListener) {
      this.networkListener();
    }
  }
}

// Export singleton instance
export const offlineService = new OfflineService();

// Helper hook for React components
export const useOfflineStatus = () => {
  const [networkStatus, setNetworkStatus] = React.useState(
    offlineService.getNetworkStatus()
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setNetworkStatus(offlineService.getNetworkStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return networkStatus;
};

export default offlineService;