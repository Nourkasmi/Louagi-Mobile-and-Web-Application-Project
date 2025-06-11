import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Title, RadioButton, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../src/store/authSlice';
import { register } from '../src/services/api';

export default function RegisterScreen() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    role: 'passenger',
    license_no: '',
    experience: '',
    license_expiry: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async () => {
    setErrors({}); // reset errors
    try {
      const payload = {
        ...form,
        experience: form.role === 'driver' ? Number(form.experience) : undefined,
        license_expiry: form.role === 'driver' ? form.license_expiry : undefined
      };

      const res = await register(payload);

      if (!res.success) {
        alert(res.message || 'Registration failed');
        return;
      }

      global.authToken = res.token;

      dispatch(loginSuccess({
        user: res.user,
        token: res.token
      }));

      router.replace('/(tabs)');
    } catch (err) {
      console.error('Register error:', err);
      alert('Server error or invalid data');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Title style={styles.title}>Create Your Account</Title>

      <TextInput
        label="Username"
        value={form.username}
        onChangeText={(v) => handleChange('username', v)}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Email"
        value={form.email}
        onChangeText={(v) => handleChange('email', v)}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        label="Password"
        value={form.password}
        onChangeText={(v) => handleChange('password', v)}
        secureTextEntry
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Phone"
        value={form.phone}
        onChangeText={(v) => handleChange('phone', v)}
        keyboardType="phone-pad"
        mode="outlined"
        style={styles.input}
      />

      <RadioButton.Group
        onValueChange={(v) => handleChange('role', v)}
        value={form.role}
      >
        <View style={styles.radioRow}>
          <RadioButton value="passenger" />
          <Title>Passenger</Title>
          <RadioButton value="driver" />
          <Title>Driver</Title>
        </View>
      </RadioButton.Group>

      {form.role === 'driver' && (
        <>
          <TextInput
            label="License No"
            value={form.license_no}
            onChangeText={(v) => handleChange('license_no', v)}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Experience (years)"
            value={form.experience}
            onChangeText={(v) => handleChange('experience', v)}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="License Expiry"
            value={form.license_expiry}
            onChangeText={(v) => handleChange('license_expiry', v)}
            placeholder="YYYY-MM-DD"
            mode="outlined"
            style={styles.input}
          />
        </>
      )}

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.button}
      >
        Register
      </Button>
      <Button onPress={() => router.back()} style={styles.link}>
        Already have an account? Login
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 12,
  },
  link: {
    marginTop: 8,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
});
