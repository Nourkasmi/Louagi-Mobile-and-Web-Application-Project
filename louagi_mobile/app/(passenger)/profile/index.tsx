// 📁 app/(passenger)/profile/index.tsx - ENHANCED Profile Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  StatusBar,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RootState } from '../../../src/store/store';
import { logout, updateUser } from '../../../src/store/authSlice';
import { getCurrentUser, updateUserProfile, getPassengerAnalytics } from '../../../src/services/api';
import { theme } from '../../../src/styles/theme';

interface ProfileStats {
  totalBookings: number;
  completedTrips: number;
  totalSpent: number;
  averageSpentPerTrip: number;
  completionRate: string;
  cancellationRate: string;
}

interface UserSettings {
  notifications: boolean;
  emailUpdates: boolean;
  smsAlerts: boolean;
  locationServices: boolean;
  autoBook: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);

  // State management
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    notifications: true,
    emailUpdates: true,
    smsAlerts: false,
    locationServices: true,
    autoBook: false,
  });

  // Load user data and analytics
  const loadProfileData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Load analytics
      const analyticsResponse = await getPassengerAnalytics(6); // Last 6 months
      if (analyticsResponse.success && analyticsResponse.data) {
        setStats(analyticsResponse.data.analytics.summary);
      }

      // Load saved settings
      const savedSettings = await AsyncStorage.getItem('user_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  // Update setting and save to storage
  const updateSetting = async (key: keyof UserSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await AsyncStorage.setItem('user_settings', JSON.stringify(newSettings));
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('louagi_token');
              global.authToken = undefined;
              dispatch(logout());
              router.replace('/login');
            } catch (error) {
              dispatch(logout());
              router.replace('/login');
            }
          }
        }
      ]
    );
  };

  // Handle edit profile
  const handleEditProfile = () => {
    router.push('/(passenger)/profile/edit');
  };

  // Handle contact support
  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'How would you like to contact our support team?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:support@louagi.com?subject=Louagi Support Request')
        },
        {
          text: 'Phone',
          onPress: () => Linking.openURL('tel:+216-XX-XXX-XXX')
        }
      ]
    );
  };

  // Handle about app
  const handleAboutApp = () => {
    Alert.alert(
      'About Louagi',
      'Louagi v1.0.0\n\nFast, reliable shared transportation across Tunisia.\n\nMade with ❤️ for modern travelers.',
      [{ text: 'OK' }]
    );
  };

  // Render methods
  const renderHeader = () => (
    <View style={styles.header}>
      <StatusBar barStyle="light-content" backgroundColor="#0066cc" />

      <View style={styles.headerContent}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {auth.user?.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>

            <TouchableOpacity style={styles.editAvatarButton}>
              <MaterialIcons name="camera-alt" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={styles.userDetails}>
            <Text style={styles.userName}>{auth.user?.username || 'User'}</Text>
            <Text style={styles.userEmail}>{auth.user?.email || 'user@example.com'}</Text>
            <Text style={styles.userPhone}>{auth.user?.phone || '+216 XX XXX XXX'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <MaterialIcons name="edit" size={20} color="#ffffff" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Your Travel Stats</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialIcons name="flight-takeoff" size={24} color="#0066cc" />
            <Text style={styles.statNumber}>{stats.completedTrips}</Text>
            <Text style={styles.statLabel}>Completed Trips</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialIcons name="attach-money" size={24} color="#28a745" />
            <Text style={styles.statNumber}>${stats.totalSpent.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialIcons name="trending-up" size={24} color="#ff9800" />
            <Text style={styles.statNumber}>{stats.completionRate}</Text>
            <Text style={styles.statLabel}>Completion Rate</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialIcons name="payments" size={24} color="#9c27b0" />
            <Text style={styles.statNumber}>${stats.averageSpentPerTrip.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Avg per Trip</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSettings = () => (
    <View style={styles.settingsContainer}>
      <Text style={styles.sectionTitle}>Preferences</Text>

      <View style={styles.settingsList}>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <MaterialIcons name="notifications" size={24} color="#0066cc" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDescription}>Trip updates and alerts</Text>
            </View>
          </View>
          <Switch
            value={settings.notifications}
            onValueChange={(value) => updateSetting('notifications', value)}
            trackColor={{ false: '#e5e5ea', true: '#0066cc50' }}
            thumbColor={settings.notifications ? '#0066cc' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <MaterialIcons name="email" size={24} color="#0066cc" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Email Updates</Text>
              <Text style={styles.settingDescription}>Booking confirmations and receipts</Text>
            </View>
          </View>
          <Switch
            value={settings.emailUpdates}
            onValueChange={(value) => updateSetting('emailUpdates', value)}
            trackColor={{ false: '#e5e5ea', true: '#0066cc50' }}
            thumbColor={settings.emailUpdates ? '#0066cc' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <MaterialIcons name="sms" size={24} color="#0066cc" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>SMS Alerts</Text>
              <Text style={styles.settingDescription}>Important trip notifications</Text>
            </View>
          </View>
          <Switch
            value={settings.smsAlerts}
            onValueChange={(value) => updateSetting('smsAlerts', value)}
            trackColor={{ false: '#e5e5ea', true: '#0066cc50' }}
            thumbColor={settings.smsAlerts ? '#0066cc' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <MaterialIcons name="location-on" size={24} color="#0066cc" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Location Services</Text>
              <Text style={styles.settingDescription}>For better route suggestions</Text>
            </View>
          </View>
          <Switch
            value={settings.locationServices}
            onValueChange={(value) => updateSetting('locationServices', value)}
            trackColor={{ false: '#e5e5ea', true: '#0066cc50' }}
            thumbColor={settings.locationServices ? '#0066cc' : '#f4f3f4'}
          />
        </View>
      </View>
    </View>
  );

  const renderMenuItems = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.sectionTitle}>More Options</Text>

      <View style={styles.menuList}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(passenger)/bookings')}>
          <MaterialIcons name="history" size={24} color="#666" />
          <Text style={styles.menuItemText}>Trip History</Text>
          <MaterialIcons name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleContactSupport}>
          <MaterialIcons name="support-agent" size={24} color="#666" />
          <Text style={styles.menuItemText}>Contact Support</Text>
          <MaterialIcons name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleAboutApp}>
          <MaterialIcons name="info" size={24} color="#666" />
          <Text style={styles.menuItemText}>About Louagi</Text>
          <MaterialIcons name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Linking.openURL('https://louagi.com/privacy')}
        >
          <MaterialIcons name="privacy-tip" size={24} color="#666" />
          <Text style={styles.menuItemText}>Privacy Policy</Text>
          <MaterialIcons name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Linking.openURL('https://louagi.com/terms')}
        >
          <MaterialIcons name="description" size={24} color="#666" />
          <Text style={styles.menuItemText}>Terms of Service</Text>
          <MaterialIcons name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProfileData(true)}
            colors={['#0066cc']}
            tintColor="#0066cc"
          />
        }
      >
        {renderHeader()}
        {renderStats()}
        {renderSettings()}
        {renderMenuItems()}

        {/* Logout button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#dc3545" />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Louagi v1.0.0</Text>
          <Text style={styles.buildText}>Build 2024.1</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Enhanced styles for the profile screen
const styles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },

  header: {
    backgroundColor: '#0066cc',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },

  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },

  editAvatarButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },

  userDetails: {
    flex: 1,
  },

  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },

  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },

  userPhone: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },

  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },

  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },

  // Stats section
  statsContainer: {
    padding: 20,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    ...theme.shadows.light,
  },

  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },

  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Settings section
  settingsContainer: {
    padding: 20,
    paddingTop: 0,
  },

  settingsList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    ...theme.shadows.light,
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  settingText: {
    marginLeft: 16,
    flex: 1,
  },

  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },

  settingDescription: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },

  // Menu section
  menuContainer: {
    padding: 20,
    paddingTop: 0,
  },

  menuList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    ...theme.shadows.light,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  menuItemText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    marginLeft: 16,
    flex: 1,
  },

  // Logout section
  logoutContainer: {
    padding: 20,
    paddingTop: 0,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffebee',
    gap: 8,
  },

  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc3545',
  },

  // Version info
  versionContainer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },

  versionText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },

  buildText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
};