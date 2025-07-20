// app/(driver)/profile/edit.tsx 

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../src/store/store';
import { 
  updateUserProfile, 
  getCurrentUser, 
  getDriverProfile,
  updateDriverProfile,
  type User,
  type Driver 
} from '../../../src/services/api';
import { loginSuccess } from '../../../src/store/authSlice';

interface DriverProfileForm {
  // User fields
  username: string;
  email: string;
  phone: string;
  // Driver-specific fields
  vehicleType: string;
  vehicleCapacity: string;
  experience: string;
  licenseNo: string;
  licenseExpiry: string;
}

export default function DriverEditProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const [form, setForm] = useState<DriverProfileForm>({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    vehicleType: '',
    vehicleCapacity: '4',
    experience: '',
    licenseNo: '',
    licenseExpiry: '',
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [driverProfile, setDriverProfile] = useState<Driver | null>(null);

  // Load current driver profile data
  useEffect(() => {
    const loadDriverProfile = async () => {
      try {
        setInitialLoading(true);
        
        // Get current user data
        const userResponse = await getCurrentUser();
        if (userResponse.success && userResponse.data) {
          const userData = userResponse.data;
          setForm(prev => ({
            ...prev,
            username: userData.username,
            email: userData.email,
            phone: userData.phone,
          }));
        }

        // Get driver profile data
        const driverResponse = await getDriverProfile();
        if (driverResponse.success && driverResponse.data) {
          const driver = driverResponse.data;
          setDriverProfile(driver);
          
          setForm(prev => ({
            ...prev,
            vehicleType: driver.vehicleType || '',
            vehicleCapacity: driver.vehicleCapacity?.toString() || '4',
            experience: driver.experience?.toString() || '',
            licenseNo: driver.licenseNo || '',
            licenseExpiry: driver.licenseExpiry ? 
              new Date(driver.licenseExpiry).toISOString().split('T')[0] : '',
          }));
        }
      } catch (error) {
        console.error('Error loading driver profile:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setInitialLoading(false);
      }
    };

    loadDriverProfile();
  }, []);

  const handleChange = (field: keyof DriverProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!form.username.trim()) {
      Alert.alert('Validation Error', 'Username is required');
      return false;
    }
    if (!form.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return false;
    }
    if (!form.phone.trim()) {
      Alert.alert('Validation Error', 'Phone number is required');
      return false;
    }
    if (!form.licenseNo.trim()) {
      Alert.alert('Validation Error', 'License number is required');
      return false;
    }
    if (!form.experience.trim()) {
      Alert.alert('Validation Error', 'Years of experience is required');
      return false;
    }
    if (!form.vehicleCapacity.trim()) {
      Alert.alert('Validation Error', 'Vehicle capacity is required');
      return false;
    }
    if (!form.licenseExpiry.trim()) {
      Alert.alert('Validation Error', 'License expiry date is required');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    // Validate experience is a number
    const experience = parseInt(form.experience);
    if (isNaN(experience) || experience < 0 || experience > 50) {
      Alert.alert('Validation Error', 'Experience must be a number between 0 and 50');
      return false;
    }

    // Validate vehicle capacity is a number
    const capacity = parseInt(form.vehicleCapacity);
    if (isNaN(capacity) || capacity < 1 || capacity > 12) {
      Alert.alert('Validation Error', 'Vehicle capacity must be between 1 and 12');
      return false;
    }

    // Validate license expiry date
    const expiryDate = new Date(form.licenseExpiry);
    const today = new Date();
    if (expiryDate <= today) {
      Alert.alert('Validation Error', 'License expiry date must be in the future');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Update user profile
      const userUpdateData = {
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      };

      const userRes = await updateUserProfile(userUpdateData);
      if (!userRes.success) {
        Alert.alert('Error', userRes.message || 'Failed to update user profile');
        return;
      }

      // Update driver profile
      const driverUpdateData = {
        vehicleType: form.vehicleType.trim() || undefined,
        vehicleCapacity: parseInt(form.vehicleCapacity),
        experience: parseInt(form.experience),
        licenseNo: form.licenseNo.trim(),
        licenseExpiry: form.licenseExpiry,
      };

      const driverRes = await updateDriverProfile(driverUpdateData);
      if (!driverRes.success) {
        Alert.alert('Error', driverRes.message || 'Failed to update driver profile');
        return;
      }

      // Refresh user data in Redux store
      const userResponse = await getCurrentUser();
      if (userResponse.success && userResponse.data) {
        dispatch(loginSuccess({
          user: userResponse.data,
          token: global.authToken || '', // Keep current token
        }));
      }

      Alert.alert(
        'Success', 
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(driver)/profile'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Profile update error:', error);
      Alert.alert(
        'Error', 
        error?.response?.data?.message || 'Failed to update profile'
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f8f9fa' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.container} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Driver Profile</Text>
        </View>

        {/* Profile Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {form.username.charAt(0).toUpperCase() || 'D'}
            </Text>
          </View>
          <Text style={styles.roleText}>🚗 Driver Profile</Text>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <Text style={styles.label}>Username *</Text>
          <TextInput
            style={styles.input}
            value={form.username}
            onChangeText={(val) => handleChange('username', val)}
            placeholder="Enter your username"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={(val) => handleChange('email', val)}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Enter your email"
          />

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={form.phone}
            onChangeText={(val) => handleChange('phone', val)}
            keyboardType="phone-pad"
            placeholder="Enter your phone number"
          />
        </View>

        {/* Driver Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver Information</Text>
          
          <Text style={styles.label}>License Number *</Text>
          <TextInput
            style={styles.input}
            value={form.licenseNo}
            onChangeText={(val) => handleChange('licenseNo', val)}
            placeholder="Enter your license number"
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Years of Experience *</Text>
          <TextInput
            style={styles.input}
            value={form.experience}
            onChangeText={(val) => handleChange('experience', val)}
            keyboardType="numeric"
            placeholder="e.g., 5"
          />

          <Text style={styles.label}>License Expiry Date *</Text>
          <TextInput
            style={styles.input}
            value={form.licenseExpiry}
            onChangeText={(val) => handleChange('licenseExpiry', val)}
            placeholder="YYYY-MM-DD"
          />
          <Text style={styles.hint}>Format: YYYY-MM-DD (e.g., 2025-12-31)</Text>
        </View>

        {/* Vehicle Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          
          <Text style={styles.label}>Vehicle Type</Text>
          <TextInput
            style={styles.input}
            value={form.vehicleType}
            onChangeText={(val) => handleChange('vehicleType', val)}
            placeholder="e.g., Sedan, SUV, Van"
          />

          <Text style={styles.label}>Vehicle Capacity *</Text>
          <TextInput
            style={styles.input}
            value={form.vehicleCapacity}
            onChangeText={(val) => handleChange('vehicleCapacity', val)}
            keyboardType="numeric"
            placeholder="Number of passengers (1-12)"
          />
          <Text style={styles.hint}>Maximum number of passengers your vehicle can carry</Text>
        </View>

        {/* Verification Status */}
        {driverProfile && (
          <View style={styles.statusSection}>
            <Text style={styles.statusTitle}>Account Status</Text>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Verification Status:</Text>
              <Text style={[
                styles.statusValue,
                { color: driverProfile.isVerified ? '#28a745' : '#dc3545' }
              ]}>
                {driverProfile.isVerified ? '✅ Verified' : '❌ Pending Verification'}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Current Rating:</Text>
              <Text style={styles.statusValue}>
                ⭐ {driverProfile.rating.toFixed(1)}
              </Text>
            </View>
          </View>
        )}

        {/* Important Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Important Notes:</Text>
          <Text style={styles.noteText}>• Changes to license information may require re-verification</Text>
          <Text style={styles.noteText}>• Vehicle capacity affects trip booking limits</Text>
          <Text style={styles.noteText}>• Keep your license information up to date</Text>
          <Text style={styles.noteText}>• Contact support if you need help with verification</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  avatarSection: {
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  roleText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  statusSection: {
    backgroundColor: '#f8f9fa',
    marginTop: 16,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesSection: {
    backgroundColor: '#fff3cd',
    marginTop: 16,
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ffc107',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
    lineHeight: 18,
  },
  buttonContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#007bff',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
});