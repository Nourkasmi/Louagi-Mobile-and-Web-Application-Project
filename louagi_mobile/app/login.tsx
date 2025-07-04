// 📁 app/login.tsx - Login Screen WITHOUT Demo Section
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Animated,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import {
  TextInput,
  Button,
  Title,
  Text,
  ActivityIndicator,
  HelperText
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Internal imports
import { loginSuccess } from '../src/store/authSlice';
import { login } from '../src/services/api';
import { theme } from '../src/styles/theme';
import { styles, getDynamicStyles } from './login.styles';

// Types
interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface LoginFormData {
  email: string;
  password: string;
}

const LoginScreen: React.FC = () => {
  // Hooks
  const router = useRouter();
  const dispatch = useDispatch();

  // State
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Initialize animations
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Form validation
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Error shake animation
  const shakeOnError = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // Handle input changes
  const handleInputChange = useCallback((field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field error on change if user has attempted submit
    if (hasAttemptedSubmit && errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [hasAttemptedSubmit, errors]);

  // Main login handler
  const handleLogin = useCallback(async (): Promise<void> => {
    setHasAttemptedSubmit(true);

    if (!validateForm()) {
      shakeOnError();
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const res = await login(formData.email.trim().toLowerCase(), formData.password);

      if (!res.success || !res.token || !res.user) {
        setErrors({ general: res.message || 'Login failed. Please check your credentials.' });
        shakeOnError();
        return;
      }

      // Store authentication data
      await Promise.all([
        AsyncStorage.setItem('louagi_token', res.token),
        AsyncStorage.setItem('louagi_user', JSON.stringify(res.user)),
      ]);

      // Set global token
      global.authToken = res.token;

      // Update Redux state
      dispatch(loginSuccess({
        user: res.user,
        token: res.token,
      }));

      // Success feedback and navigation
      if (Platform.OS === 'web') {
        // On web, navigate immediately
        const routes = {
          passenger: '/(passenger)/home',
          driver: '/(driver)/dashboard',
          admin: '/(driver)/dashboard',
        } as const;

        const targetRoute = routes[res.user.role as keyof typeof routes] || routes.passenger;
        router.replace(targetRoute);
      } else {
        // On mobile, show alert first
        Alert.alert(
          'Welcome Back!',
          `Hello ${res.user.username}, you're successfully logged in.`,
          [{
            text: 'Continue',
            onPress: () => {
              const routes = {
                passenger: '/(passenger)/home',
                driver: '/(driver)/dashboard',
                admin: '/(driver)/dashboard',
              } as const;

              const targetRoute = routes[res.user.role as keyof typeof routes] || routes.passenger;
              router.replace(targetRoute);
            }
          }]
        );
      }

    } catch (error: any) {
      console.error('Login error:', error);

      // Handle specific error cases
      const errorMessages = {
        401: 'Invalid email or password. Please try again.',
        429: 'Too many login attempts. Please try again later.',
        network: 'Network error. Please check your connection and try again.',
        default: 'Something went wrong. Please try again later.',
      };

      let errorMessage = errorMessages.default;

      if (error.response?.status === 401) {
        errorMessage = errorMessages[401];
      } else if (error.response?.status === 429) {
        errorMessage = errorMessages[429];
      } else if (error.message?.toLowerCase().includes('network')) {
        errorMessage = errorMessages.network;
      }

      setErrors({ general: errorMessage });
      shakeOnError();
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, dispatch, router, shakeOnError]);

  // Handle forgot password
  const handleForgotPassword = useCallback(() => {
    Alert.alert(
      'Reset Password',
      'Password reset functionality will be available soon. Please contact support if needed.',
      [{ text: 'OK', style: 'default' }]
    );
  }, []);

  // Dynamic styles based on current state
  const dynamicStyles = getDynamicStyles({
    hasError: Object.keys(errors).length > 0,
    isLoading,
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { translateX: shakeAnim },
              ],
            },
          ]}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialIcons
                name="directions-car"
                size={48}
                color={theme.colors.primary}
              />
            </View>
            <Title style={styles.title}>Welcome Back</Title>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>
          </View>

          {/* Error Alert */}
          {errors.general && (
            <Animated.View style={styles.errorContainer}>
              <MaterialIcons
                name="error-outline"
                size={20}
                color={theme.colors.danger}
              />
              <Text style={styles.errorText}>{errors.general}</Text>
            </Animated.View>
          )}

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <TextInput
              label="Email Address"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              style={styles.input}
              error={!!errors.email}
              disabled={isLoading}
              left={<TextInput.Icon icon="email" />}
              theme={{
                colors: {
                  primary: theme.colors.primary,
                  error: theme.colors.danger,
                },
              }}
            />
            <HelperText type="error" visible={!!errors.email}>
              {errors.email}
            </HelperText>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoComplete="password"
              style={styles.input}
              error={!!errors.password}
              disabled={isLoading}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              theme={{
                colors: {
                  primary: theme.colors.primary,
                  error: theme.colors.danger,
                },
              }}
            />
            <HelperText type="error" visible={!!errors.password}>
              {errors.password}
            </HelperText>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotPasswordContainer}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Forgot password"
          >
            <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <Button
            mode="contained"
            onPress={handleLogin}
            style={[styles.loginButton, isLoading && styles.disabledButton]}
            contentStyle={styles.buttonContent}
            disabled={isLoading}
            loading={isLoading}
            theme={{
              colors: {
                primary: theme.colors.primary,
              },
            }}
            accessibilityLabel={isLoading ? 'Signing in' : 'Sign in button'}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push('/register')}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Create account"
            >
              <Text style={styles.registerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {/* Loading Overlay */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator
                size="large"
                color={theme.colors.primary}
              />
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;