import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Title } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../src/store/authSlice';
import { login } from '../src/services/api';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const router = useRouter();
  const dispatch = useDispatch();

  const handleLogin = async (): Promise<void> => {
    try {
      const res = await login(email, password);

      if (!res.success || !res.token || !res.user) {
        alert(res.message || 'Login failed');
        return;
      }

      // @ts-ignore (if you have a global type, better to type this!)
      global.authToken = res.token;

      dispatch(
        loginSuccess({
          user: res.user,
          token: res.token,
        })
      );

      // Route based on user role
      switch (res.user.role) {
        case 'passenger':
          router.replace('/(passenger)/home');
          break;
        case 'driver':
          router.replace('/(driver)/dashboard');
          break;
        case 'admin':
          router.replace('/(driver)/dashboard'); // Fallback for now
          break;
        default:
          router.replace('/(passenger)/home');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Server error or invalid credentials');
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Louagi Login</Title>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        mode="outlined"
        style={styles.input}
      />
      <Button mode="contained" onPress={handleLogin} style={styles.button}>
        Login
      </Button>
      <Button onPress={() => router.push('/register')} style={styles.link}>
        No account? Register here
      </Button>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
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
});