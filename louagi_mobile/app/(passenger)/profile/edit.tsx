// 📁 app/(passenger)/profile/edit.tsx - UPDATED (Clean Logic Only)
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../src/store/store';
import { updateUserProfile, getCurrentUser, type User } from '../../../src/services/api';
import { loginSuccess } from '../../../src/store/authSlice';
import { styles } from './edit.styles'; // 🆕 Import styles

export default function EditProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const [form, setForm] = useState<{ username: string; email: string; phone: string }>({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username,
        email: user.email,
        phone: user.phone,
      });
    }
  }, [user]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Call backend API to update
      const res = await updateUserProfile(form);
      if (res.success && (res.user || res.data)) {
        // Refetch user from backend for fresh data
        const userRes = await getCurrentUser();
        if (userRes.success && (userRes.user || userRes.data)) {
          dispatch(loginSuccess({
            user: userRes.user || userRes.data,
            token: global.authToken, // keep current token
          }));
        }
        Alert.alert('Success', 'Profile updated successfully');
        router.replace('/(passenger)/profile');
      } else {
        Alert.alert('Error', res.message || 'Update failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f8f9fa' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Edit Profile</Text>
        
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={form.username}
          onChangeText={(val) => handleChange('username', val)}
          placeholder="Enter your username"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={form.email}
          onChangeText={(val) => handleChange('email', val)}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="Enter your email"
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={form.phone}
          onChangeText={(val) => handleChange('phone', val)}
          keyboardType="phone-pad"
          placeholder="Enter your phone number"
        />

        <TouchableOpacity
          style={[styles.button, loading && { backgroundColor: '#ccc' }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}