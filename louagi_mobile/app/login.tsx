//  app/login.tsx 

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Animated,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  StyleSheet
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

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  // State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;

  // Initialize animations
  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#3498db', true);
    }

    // Animation sequence
    Animated.sequence([
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
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
      ]),
    ]).start();

    // Background floating animation
    const backgroundLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );
    backgroundLoop.start();

    // Logo pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      backgroundLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

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
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // Handle input changes
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (hasAttemptedSubmit && errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [hasAttemptedSubmit, errors]);

  // Main login handler
  const handleLogin = useCallback(async () => {
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

      await Promise.all([
        AsyncStorage.setItem('louagi_token', res.token),
        AsyncStorage.setItem('louagi_user', JSON.stringify(res.user)),
      ]);

      global.authToken = res.token;

      dispatch(loginSuccess({
        user: res.user,
        token: res.token,
      }));

      // Success animation
      Animated.sequence([
        Animated.timing(logoScaleAnim, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(logoScaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 10,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        const routes = {
          passenger: '/(passenger)/home',
          driver: '/(driver)/dashboard',
          admin: '/(driver)/dashboard',
        };

        const targetRoute = routes[res.user.role] || routes.passenger;
        router.replace(targetRoute);
      }, 500);

    } catch (error) {
      console.error('Login error:', error);

      let errorMessage = 'Something went wrong. Please try again later.';

      if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.message?.toLowerCase().includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      setErrors({ general: errorMessage });
      shakeOnError();
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, dispatch, router, shakeOnError]);

  const handleForgotPassword = useCallback(() => {
    Alert.alert(
      'Reset Password',
      'Password reset functionality will be available soon. Please contact support if needed.',
      [{ text: 'OK', style: 'default' }]
    );
  }, []);

  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <Animated.View
        style={[
          styles.backgroundGradient,
          {
            transform: [
              {
                translateY: backgroundAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -20],
                }),
              },
            ],
          },
        ]}
      />

      {/* Floating Circles */}
      <Animated.View
        style={[
          styles.floatingCircle,
          styles.circle1,
          {
            transform: [
              {
                translateX: backgroundAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 40],
                }),
              },
              {
                translateY: backgroundAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -50],
                }),
              },
              {
                rotate: backgroundAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.floatingCircle,
          styles.circle2,
          {
            transform: [
              {
                translateX: backgroundAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -35],
                }),
              },
              {
                translateY: backgroundAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 45],
                }),
              },
              {
                rotate: backgroundAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['360deg', '0deg'],
                }),
              },
            ],
          },
        ]}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
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
            {/* Logo and Header */}
            <View style={styles.header}>
              <Animated.View
                style={[
                  styles.logoContainer,
                  {
                    transform: [
                      { scale: logoScaleAnim },
                      { scale: pulseAnim },
                    ],
                  },
                ]}
              >
                <View style={styles.logoInner}>
                  <MaterialIcons
                    name="directions-car"
                    size={48}
                    color="#ffffff"
                  />
                </View>
                <View style={styles.logoGlow} />
              </Animated.View>

              <Animated.View
                style={[
                  styles.headerText,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 50],
                          outputRange: [0, 20],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Title style={styles.title}>Welcome</Title>
                <Text style={styles.subtitle}>Sign in to continue your journey</Text>
              </Animated.View>
            </View>

            {/* Error Alert */}
            {errors.general && (
              <Animated.View
                style={[
                  styles.errorContainer,
                  {
                    opacity: fadeAnim,
                  },
                ]}
              >
                <MaterialIcons
                  name="error-outline"
                  size={20}
                  color="#e74c3c"
                />
                <Text style={styles.errorText}>{errors.general}</Text>
              </Animated.View>
            )}

            {/* Email Input */}
            <Animated.View
              style={[
                styles.inputContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, 30],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.inputWrapper}>
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
                      primary: '#3498db',
                      error: '#e74c3c',
                      background: 'rgba(248, 249, 250, 0.9)',
                      outline: '#3498db',
                    },
                  }}
                  outlineStyle={styles.inputOutline}
                />
                <HelperText type="error" visible={!!errors.email}>
                  {errors.email}
                </HelperText>
              </View>
            </Animated.View>

            {/* Password Input */}
            <Animated.View
              style={[
                styles.inputContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, 40],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.inputWrapper}>
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
                      primary: '#3498db',
                      error: '#e74c3c',
                      background: 'rgba(248, 249, 250, 0.9)',
                      outline: '#3498db',
                    },
                  }}
                  outlineStyle={styles.inputOutline}
                />
                <HelperText type="error" visible={!!errors.password}>
                  {errors.password}
                </HelperText>
              </View>
            </Animated.View>

            {/* Forgot Password */}
            <Animated.View
              style={[
                styles.forgotContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, 50],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                onPress={handleForgotPassword}
                style={styles.forgotButton}
                disabled={isLoading}
              >
                <Text style={styles.forgotText}>Forgot your password?</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Login Button */}
            <Animated.View
              style={[
                styles.buttonContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, 60],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isLoading && styles.disabledButton,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <View style={styles.buttonGradient}>
                  {isLoading ? (
                    <View style={styles.loadingContent}>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.buttonText}>Signing In...</Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>Sign In</Text>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <Animated.View
              style={[
                styles.dividerContainer,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </Animated.View>

            {/* Register Link */}
            <Animated.View
              style={[
                styles.registerContainer,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/register')}
                disabled={isLoading}
                style={styles.registerButton}
              >
                <Text style={styles.registerLink}>Create Account</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
    backgroundColor: '#3498db',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  floatingCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 50,
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 5,
  },
  circle1: {
    width: 120,
    height: 120,
    top: height * 0.12,
    right: width * 0.05,
  },
  circle2: {
    width: 80,
    height: 80,
    top: height * 0.32,
    left: width * 0.02,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: height * 0.12,
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 30,
    padding: 35,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 45,
  },
  logoContainer: {
    marginBottom: 25,
    position: 'relative',
  },
  logoInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoGlow: {
    position: 'absolute',
    top: -15,
    left: -15,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(52, 152, 219, 0.15)',
    zIndex: -1,
  },
  headerText: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.08)',
    padding: 18,
    borderRadius: 15,
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  errorText: {
    fontSize: 14,
    color: '#c0392b',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 25,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    fontSize: 16,
    minHeight: 58,
    fontWeight: '400',
  },
  inputOutline: {
    borderRadius: 15,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: 35,
  },
  forgotButton: {
    padding: 10,
    borderRadius: 8,
  },
  forgotText: {
    fontSize: 15,
    color: '#3498db',
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: 35,
  },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#2980b9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
    backgroundColor: '#3498db',
  },
  disabledButton: {
    opacity: 0.7,
    shadowOpacity: 0.1,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(149, 165, 166, 0.3)',
  },
  dividerText: {
    fontSize: 13,
    color: '#95a5a6',
    paddingHorizontal: 20,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
  },
  registerText: {
    fontSize: 15,
    color: '#7f8c8d',
    fontWeight: '400',
  },
  registerButton: {
    padding: 6,
    borderRadius: 6,
  },
  registerLink: {
    fontSize: 15,
    color: '#3498db',
    fontWeight: '700',
  },
});

export default LoginScreen;