// src/services/notifications.ts - Push Notifications Service
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { registerPushToken, updateNotificationPreferences } from './api';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'booking_confirmed' | 'trip_update' | 'payment_success' | 'trip_started' | 'trip_completed' | 'cancellation';
  title: string;
  body: string;
  data?: any;
}

export interface NotificationPreferences {
  tripUpdates: boolean;
  bookingAlerts: boolean;
  promotions: boolean;
  sound: boolean;
  vibration: boolean;
}

class NotificationService {
  private pushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if device supports push notifications
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return false;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }

      // Get push token
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      this.pushToken = token;

      // Register token with backend
      await this.registerToken();

      // Set up notification listeners
      this.setupListeners();

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await this.setupAndroidChannel();
      }

      console.log('Push notifications initialized successfully');
      return true;

    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  /**
   * Setup Android notification channels
   */
  private async setupAndroidChannel() {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    await Notifications.setNotificationChannelAsync('trip-updates', {
      name: 'Trip Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0066cc',
    });

    await Notifications.setNotificationChannelAsync('bookings', {
      name: 'Booking Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#28a745',
    });
  }

  /**
   * Register push token with backend
   */
  private async registerToken() {
    if (!this.pushToken) return;

    try {
      await registerPushToken(this.pushToken, Platform.OS as 'ios' | 'android');
      console.log('Push token registered with backend');
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  }

  /**
   * Setup notification event listeners
   */
  private setupListeners() {
    // Listen for notifications when app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      this.handleNotificationReceived
    );

    // Listen for user tapping on notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse
    );
  }

  /**
   * Handle notification received while app is in foreground
   */
  private handleNotificationReceived = (notification: Notifications.Notification) => {
    console.log('Notification received:', notification);
    
    const { title, body, data } = notification.request.content;
    
    // Handle different notification types
    switch (data?.type) {
      case 'trip_started':
        this.showInAppNotification('🚗 Trip Started', body);
        break;
      case 'trip_update':
        this.showInAppNotification('📍 Trip Update', body);
        break;
      case 'booking_confirmed':
        this.showInAppNotification('✅ Booking Confirmed', body);
        break;
      case 'payment_success':
        this.showInAppNotification('💳 Payment Successful', body);
        break;
      default:
        this.showInAppNotification(title, body);
    }
  };

  /**
   * Handle user tapping on notification
   */
  private handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    console.log('Notification tapped:', response);
    
    const { data } = response.notification.request.content;
    
    // Navigate based on notification type
    this.handleNotificationNavigation(data);
  };

  /**
   * Handle navigation when notification is tapped
   */
  private handleNotificationNavigation(data: any) {
    // This would integrate with your navigation system
    // For now, we'll just log the navigation intent
    
    switch (data?.type) {
      case 'booking_confirmed':
      case 'trip_update':
      case 'trip_started':
        console.log('Navigate to booking details:', data.bookingId);
        // Navigation.navigate('BookingDetails', { bookingId: data.bookingId });
        break;
      case 'payment_success':
        console.log('Navigate to payment confirmation:', data.paymentId);
        // Navigation.navigate('PaymentSuccess', { paymentId: data.paymentId });
        break;
      default:
        console.log('Navigate to home screen');
        // Navigation.navigate('Home');
    }
  }

  /**
   * Show in-app notification (when app is in foreground)
   */
  private showInAppNotification(title: string, body: string) {
    // This would show a custom in-app notification component
    // For now, we'll just log it
    console.log(`In-app notification: ${title} - ${body}`);
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(notification: NotificationData) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: true,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  /**
   * Schedule notification for later
   */
  async scheduleNotification(
    notification: NotificationData,
    triggerDate: Date,
    identifier?: string
  ) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: true,
        },
        trigger: triggerDate,
        identifier,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Cancel scheduled notification
   */
  async cancelScheduledNotification(identifier: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: NotificationPreferences) {
    try {
      await updateNotificationPreferences(preferences);
      
      // Update local notification settings
      if (!preferences.sound) {
        // Disable sound for future notifications
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: false,
            shouldSetBadge: true,
          }),
        });
      }

      console.log('Notification preferences updated');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  }

  /**
   * Get current notification permissions
   */
  async getPermissions() {
    return await Notifications.getPermissionsAsync();
  }

  /**
   * Request notification permissions
   */
  async requestPermissions() {
    return await Notifications.requestPermissionsAsync();
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Get pending notifications
   */
  async getPendingNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Cleanup listeners (call when component unmounts)
   */
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.pushToken;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Helper functions for common notification scenarios

/**
 * Send booking confirmation notification
 */
export const sendBookingConfirmation = async (bookingReference: string, tripDetails: string) => {
  await notificationService.sendLocalNotification({
    type: 'booking_confirmed',
    title: 'Booking Confirmed! ✅',
    body: `Your booking ${bookingReference} for ${tripDetails} has been confirmed.`,
    data: { bookingReference }
  });
};

/**
 * Send trip started notification
 */
export const sendTripStarted = async (tripDetails: string, estimatedArrival: string) => {
  await notificationService.sendLocalNotification({
    type: 'trip_started',
    title: 'Trip Started! 🚗',
    body: `Your trip ${tripDetails} has started. Estimated arrival: ${estimatedArrival}`,
    data: { type: 'trip_started' }
  });
};

/**
 * Send trip update notification
 */
export const sendTripUpdate = async (message: string, tripId: string) => {
  await notificationService.sendLocalNotification({
    type: 'trip_update',
    title: 'Trip Update 📍',
    body: message,
    data: { tripId, type: 'trip_update' }
  });
};

/**
 * Send payment success notification
 */
export const sendPaymentSuccess = async (amount: string, bookingReference: string) => {
  await notificationService.sendLocalNotification({
    type: 'payment_success',
    title: 'Payment Successful! 💳',
    body: `Payment of ${amount} for booking ${bookingReference} was successful.`,
    data: { bookingReference, type: 'payment_success' }
  });
};

/**
 * Schedule trip reminder notification
 */
export const scheduleTripReminder = async (
  tripDetails: string, 
  departureTime: Date, 
  bookingReference: string
) => {
  // Schedule reminder 30 minutes before departure
  const reminderTime = new Date(departureTime.getTime() - 30 * 60 * 1000);
  
  if (reminderTime > new Date()) {
    await notificationService.scheduleNotification(
      {
        type: 'trip_update',
        title: 'Trip Reminder ⏰',
        body: `Your trip ${tripDetails} departs in 30 minutes!`,
        data: { bookingReference, type: 'trip_reminder' }
      },
      reminderTime,
      `trip_reminder_${bookingReference}`
    );
  }
};

/**
 * Send cancellation notification
 */
export const sendCancellationNotification = async (
  bookingReference: string, 
  reason: string,
  isRefund: boolean = false
) => {
  await notificationService.sendLocalNotification({
    type: 'cancellation',
    title: 'Booking Cancelled ❌',
    body: `Your booking ${bookingReference} has been cancelled. ${reason}${isRefund ? ' Refund will be processed within 5-7 business days.' : ''}`,
    data: { bookingReference, type: 'cancellation' }
  });
};

export default notificationService;