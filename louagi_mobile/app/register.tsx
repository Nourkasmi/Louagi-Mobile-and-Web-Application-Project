// 📁 app/register.tsx - FINAL, FULL, UNSKIPPED Registration Screen

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Animated,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Title,
  Text,
  RadioButton,
  HelperText,
  ProgressBar,
  Chip,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDispatch as useReduxDispatch } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { loginSuccess } from '../src/store/authSlice';
import { register } from '../src/services/api';
import styles, { getDynamicStyles, getPasswordStrength } from './register.styles';
import { theme } from '../src/styles/theme';

interface FormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  role: 'passenger' | 'driver';
  license_no: string;
  experience: string;
  license_expiry: string;
}

interface FormErrors {
  [key: string]: string;
}

const STEPS = {
  BASIC_INFO: 0,
  ACCOUNT_DETAILS: 1,
  ROLE_SELECTION: 2,
  DRIVER_DETAILS: 3,
  REVIEW: 4,
} as const;

const INITIAL_FORM_STATE: FormState = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  role: 'passenger',
  license_no: '',
  experience: '',
  license_expiry: '',
};

const RegisterScreen: React.FC = () => {
  const router = useRouter();
  // Safe useDispatch wrapper
  const dispatch = (() => {
    try {
      const d = useReduxDispatch();
      return (action: any) => {
        try {
          return d(action);
        } catch (error) {
          console.error('❌ Dispatch error:', error);
          return action;
        }
      };
    } catch (error) {
      console.error('❌ useDispatch hook error:', error);
      return (action: any) => {
        console.warn('⚠️ Dispatch not available, action ignored:', action);
        return action;
      };
    }
  })();

  const [currentStep, setCurrentStep] = useState(
    typeof STEPS.BASIC_INFO === 'number' ? STEPS.BASIC_INFO : 0
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

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

  // Progress value calculation (never NaN!)
  const getProgressValue = useCallback(() => {
    const totalSteps = form.role === 'driver' ? 5 : 4;
    const progress = (currentStep + 1) / totalSteps;
    if (isNaN(progress) || !isFinite(progress)) return 0.25;
    const roundedProgress = Math.round(progress * 100) / 100;
    return Math.max(0, Math.min(1, roundedProgress));
  }, [currentStep, form.role]);

  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: getProgressValue(),
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep, form.role, getProgressValue]);

  // Fix: Ensure ProgressBar never gets NaN or undefined
  const progressValue =
    typeof progressAnim === 'number'
      ? !isNaN(progressAnim) && isFinite(progressAnim)
        ? progressAnim
        : 0.25
      : progressAnim && typeof progressAnim._value === 'number'
      ? !isNaN(progressAnim._value) && isFinite(progressAnim._value)
        ? progressAnim._value
        : 0.25
      : 0.25;

  // Handle field change
  const handleFieldChange = useCallback(
    (field: keyof FormState, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setTouchedFields((prev) => new Set(prev).add(field));
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Validation per step
  const validateStep = useCallback(
    (step: number): boolean => {
      const newErrors: FormErrors = {};
      switch (step) {
        case STEPS.BASIC_INFO:
          if (!form.username.trim()) newErrors.username = 'Full name is required';
          else if (form.username.length < 2) newErrors.username = 'Name must be at least 2 characters';
          else if (form.username.length > 50) newErrors.username = 'Name must be less than 50 characters';
          if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
          else if (!/^\+?[0-9]{10,15}$/.test(form.phone.replace(/\s/g, ''))) newErrors.phone = 'Please enter a valid phone number';
          break;
        case STEPS.ACCOUNT_DETAILS:
          if (!form.email.trim()) newErrors.email = 'Email is required';
          else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Please enter a valid email address';
          if (!form.password) newErrors.password = 'Password is required';
          else if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
          else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
            newErrors.password = 'Password must contain uppercase, lowercase, and number';
          if (!form.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
          else if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
          break;
        case STEPS.DRIVER_DETAILS:
          if (form.role === 'driver') {
            if (!form.license_no.trim()) newErrors.license_no = 'License number is required';
            else if (form.license_no.length < 5) newErrors.license_no = 'Please enter a valid license number';
            if (!form.experience) newErrors.experience = 'Experience is required';
            else if (isNaN(Number(form.experience)) || Number(form.experience) < 0)
              newErrors.experience = 'Please enter valid years of experience';
            else if (Number(form.experience) > 50)
              newErrors.experience = 'Experience cannot exceed 50 years';
            if (!form.license_expiry) newErrors.license_expiry = 'License expiry date is required';
            else {
              const expiryDate = new Date(form.license_expiry);
              const today = new Date();
              if (isNaN(expiryDate.getTime())) newErrors.license_expiry = 'Please enter a valid date (YYYY-MM-DD)';
              else if (expiryDate <= today) newErrors.license_expiry = 'License expiry date must be in the future';
            }
          }
          break;
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [form]
  );

  // Navigation
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep === STEPS.ROLE_SELECTION && form.role === 'passenger') {
        setCurrentStep(STEPS.REVIEW);
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    }
  }, [currentStep, form.role, validateStep]);

  const handleBack = useCallback(() => {
    if (currentStep === STEPS.REVIEW && form.role === 'passenger') {
      setCurrentStep(STEPS.ROLE_SELECTION);
    } else {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep, form.role]);

  // Submit
  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!validateStep(currentStep)) return;
    setIsLoading(true);
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
        role: form.role,
        ...(form.role === 'driver' && {
          license_no: form.license_no.trim(),
          experience: Number(form.experience),
          license_expiry: form.license_expiry,
        }),
      };
      const res = await register(payload);
      if (!res.success) {
        Alert.alert('Registration Failed', res.message || 'Please try again');
        return;
      }
      if (!res.user || !res.token) {
        Alert.alert('Registration Failed', 'Invalid response from server. Please try again.');
        return;
      }
      await Promise.all([
        AsyncStorage.setItem('louagi_token', res.token),
        AsyncStorage.setItem('louagi_user', JSON.stringify(res.user)),
      ]);
      global.authToken = res.token;
      try {
        dispatch(loginSuccess({
          user: res.user,
          token: res.token,
        }));
      } catch (reduxError) {
        console.error('❌ Error updating Redux:', reduxError);
      }
      const routes = {
        passenger: '/(passenger)/home',
        driver: '/(driver)/dashboard',
        admin: '/(driver)/dashboard',
      } as const;
      const targetRoute = routes[res.user.role as keyof typeof routes] || routes.passenger;
      if (Platform.OS === 'web') {
        router.replace(targetRoute);
      } else {
        Alert.alert(
          'Welcome to Louagi!',
          `Account created successfully. Welcome ${res.user.username}!`,
          [
            {
              text: 'Get Started',
              onPress: () => router.replace(targetRoute),
            },
          ]
        );
      }
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid data provided. Please check your information.';
      } else if (error.response?.status === 409) {
        errorMessage = 'Email already exists. Please use a different email.';
      } else if (error.message?.toLowerCase().includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      Alert.alert('Registration Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentStep, form, validateStep, dispatch, router]);

  const getStepTitle = useCallback(() => {
    const titles = {
      [STEPS.BASIC_INFO]: 'Personal Information',
      [STEPS.ACCOUNT_DETAILS]: 'Account Security',
      [STEPS.ROLE_SELECTION]: 'Choose Your Role',
      [STEPS.DRIVER_DETAILS]: 'Driver Information',
      [STEPS.REVIEW]: 'Review & Submit',
    };
    return titles[currentStep] || 'Registration';
  }, [currentStep]);

  const passwordStrength = useMemo(() => {
    return getPasswordStrength(form.password);
  }, [form.password]);

  const dynamicStyles = getDynamicStyles({
    currentStep,
    isLoading,
    hasErrors: Object.keys(errors).length > 0,
    selectedRole: form.role,
  });

  // RENDER STEP CONTENT
  const renderStep = useCallback(() => {
    switch (currentStep) {
      case STEPS.BASIC_INFO:
        return (
          <View>
            <Text style={styles.sectionSubtitle}>
              Let's start with some basic information about you
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                label="Full Name *"
                value={form.username}
                onChangeText={(value) => handleFieldChange('username', value)}
                mode="outlined"
                style={styles.input}
                error={!!errors.username}
                disabled={isLoading}
                left={<TextInput.Icon icon="account" />}
                theme={{ colors: { primary: theme.colors.primary } }}
                accessibilityLabel="Full name input"
              />
              <HelperText type="error" visible={!!errors.username}>
                {errors.username}
              </HelperText>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                label="Phone Number *"
                value={form.phone}
                onChangeText={(value) => handleFieldChange('phone', value)}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
                error={!!errors.phone}
                disabled={isLoading}
                left={<TextInput.Icon icon="phone" />}
                theme={{ colors: { primary: theme.colors.primary } }}
                accessibilityLabel="Phone number input"
              />
              <HelperText type="error" visible={!!errors.phone}>
                {errors.phone}
              </HelperText>
            </View>
          </View>
        );
      case STEPS.ACCOUNT_DETAILS:
        return (
          <View>
            <Text style={styles.sectionSubtitle}>
              Create your account credentials for secure access
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                label="Email Address *"
                value={form.email}
                onChangeText={(value) => handleFieldChange('email', value)}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                error={!!errors.email}
                disabled={isLoading}
                left={<TextInput.Icon icon="email" />}
                theme={{ colors: { primary: theme.colors.primary } }}
                accessibilityLabel="Email address input"
              />
              <HelperText type="error" visible={!!errors.email}>
                {errors.email}
              </HelperText>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                label="Password *"
                value={form.password}
                onChangeText={(value) => handleFieldChange('password', value)}
                mode="outlined"
                secureTextEntry={!showPassword}
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
                theme={{ colors: { primary: theme.colors.primary } }}
                accessibilityLabel="Password input"
              />
              {form.password.length > 0 && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.passwordStrengthBar}>
                    <View
                      style={[
                        styles.passwordStrengthFill,
                        {
                          backgroundColor: passwordStrength.color,
                          width: passwordStrength.width,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.passwordStrengthText,
                      { color: passwordStrength.color },
                    ]}
                  >
                    {passwordStrength.text}
                  </Text>
                </View>
              )}
              <HelperText type="error" visible={!!errors.password}>
                {errors.password}
              </HelperText>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                label="Confirm Password *"
                value={form.confirmPassword}
                onChangeText={(value) => handleFieldChange('confirmPassword', value)}
                mode="outlined"
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
                error={!!errors.confirmPassword}
                disabled={isLoading}
                left={<TextInput.Icon icon="lock-check" />}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
                theme={{ colors: { primary: theme.colors.primary } }}
                accessibilityLabel="Confirm password input"
              />
              <HelperText type="error" visible={!!errors.confirmPassword}>
                {errors.confirmPassword}
              </HelperText>
            </View>
          </View>
        );
      case STEPS.ROLE_SELECTION:
        return (
          <View>
            <Text style={styles.sectionTitle}>What describes you best?</Text>
            <Text style={styles.sectionSubtitle}>
              Choose your role to customize your Louagi experience
            </Text>
            <TouchableOpacity
              style={[
                styles.roleCard,
                form.role === 'passenger' && styles.selectedRoleCard,
              ]}
              onPress={() => handleFieldChange('role', 'passenger')}
              accessibilityRole="button"
              accessibilityLabel="Select passenger role"
            >
              <RadioButton
                value="passenger"
                status={form.role === 'passenger' ? 'checked' : 'unchecked'}
                onPress={() => handleFieldChange('role', 'passenger')}
                color={theme.colors.primary}
              />
              <View style={styles.roleInfo}>
                <View style={[
                  styles.roleIconContainer,
                  form.role === 'passenger' && styles.selectedRoleIconContainer,
                ]}>
                  <MaterialIcons
                    name="person"
                    size={24}
                    color={form.role === 'passenger' ? theme.colors.background.secondary : theme.colors.text.secondary}
                  />
                </View>
                <Text style={styles.roleTitle}>Passenger</Text>
                <Text style={styles.roleDescription}>
                  Book rides and travel with our drivers
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleCard,
                form.role === 'driver' && styles.selectedRoleCard,
              ]}
              onPress={() => handleFieldChange('role', 'driver')}
              accessibilityRole="button"
              accessibilityLabel="Select driver role"
            >
              <RadioButton
                value="driver"
                status={form.role === 'driver' ? 'checked' : 'unchecked'}
                onPress={() => handleFieldChange('role', 'driver')}
                color={theme.colors.primary}
              />
              <View style={styles.roleInfo}>
                <View style={[
                  styles.roleIconContainer,
                  form.role === 'driver' && styles.selectedRoleIconContainer,
                ]}>
                  <MaterialIcons
                    name="drive-eta"
                    size={24}
                    color={form.role === 'driver' ? theme.colors.background.secondary : theme.colors.text.secondary}
                  />
                </View>
                <Text style={styles.roleTitle}>Driver</Text>
                <Text style={styles.roleDescription}>
                  Provide rides and earn money with your vehicle
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        );
      case STEPS.DRIVER_DETAILS:
        return (
          <View>
            <View style={styles.driverDetailsContainer}>
              <Text style={styles.driverDetailsTitle}>Driver License Information</Text>
              <Text style={styles.driverDetailsSubtitle}>
                This information will be verified before you can start driving
              </Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                label="License Number *"
                value={form.license_no}
                onChangeText={(value) => handleFieldChange('license_no', value)}
                mode="outlined"
                style={styles.input}
                error={!!errors.license_no}
                disabled={isLoading}
                left={<TextInput.Icon icon="card-account-details" />}
                theme={{ colors: { primary: theme.colors.primary } }}
                accessibilityLabel="License number input"
              />
              <HelperText type="error" visible={!!errors.license_no}>
                {errors.license_no}
              </HelperText>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                label="Years of Experience *"
                value={form.experience}
                onChangeText={(value) => handleFieldChange('experience', value)}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
                error={!!errors.experience}
                disabled={isLoading}
                left={<TextInput.Icon icon="calendar" />}
                theme={{ colors: { primary: theme.colors.primary } }}
                accessibilityLabel="Years of experience input"
              />
              <HelperText type="error" visible={!!errors.experience}>
                {errors.experience}
              </HelperText>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                label="License Expiry Date *"
                value={form.license_expiry}
                onChangeText={(value) => handleFieldChange('license_expiry', value)}
                mode="outlined"
                placeholder="YYYY-MM-DD"
                style={styles.input}
                error={!!errors.license_expiry}
                disabled={isLoading}
                left={<TextInput.Icon icon="calendar-clock" />}
                theme={{ colors: { primary: theme.colors.primary } }}
                accessibilityLabel="License expiry date input"
              />
              <HelperText type="error" visible={!!errors.license_expiry}>
                {errors.license_expiry}
              </HelperText>
            </View>
            <HelperText type="info">
              Your license information will be verified before you can start driving
            </HelperText>
          </View>
        );
      case STEPS.REVIEW:
        return (
          <View>
            <Text style={styles.sectionTitle}>Review Your Information</Text>
            <Text style={styles.sectionSubtitle}>
              Please verify all details before creating your account
            </Text>
            <Surface style={styles.reviewCard}>
              <Text style={styles.reviewSectionTitle}>Personal Information</Text>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Name:</Text>
                <Text style={styles.reviewValue}>{form.username}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Email:</Text>
                <Text style={styles.reviewValue}>{form.email}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Phone:</Text>
                <Text style={styles.reviewValue}>{form.phone}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Role:</Text>
                <Chip
                  mode="outlined"
                  selected={true}
                  selectedColor={theme.colors.primary}
                  style={{ alignSelf: 'flex-end' }}
                >
                  {form.role === 'driver' ? 'Driver' : 'Passenger'}
                </Chip>
              </View>
              {form.role === 'driver' && (
                <>
                  <Text style={[styles.reviewSectionTitle, { marginTop: theme.spacing.lg }]}>
                    Driver Information
                  </Text>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>License:</Text>
                    <Text style={styles.reviewValue}>{form.license_no}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Experience:</Text>
                    <Text style={styles.reviewValue}>{form.experience} years</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>License Expiry:</Text>
                    <Text style={styles.reviewValue}>{form.license_expiry}</Text>
                  </View>
                </>
              )}
            </Surface>
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  }, [
    currentStep,
    form,
    errors,
    isLoading,
    showPassword,
    showConfirmPassword,
    passwordStrength,
    handleFieldChange,
  ]);

  // Render main
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
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <MaterialIcons
                name="arrow-back"
                size={24}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Title style={styles.title}>Create Account</Title>
              <Text style={styles.subtitle}>{getStepTitle()}</Text>
            </View>
          </View>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Animated.View style={{ width: '100%' }}>
              <ProgressBar
                progress={progressValue}
                color={theme.colors.primary}
                style={styles.progressBar}
              />
            </Animated.View>
            <Text style={styles.progressText}>
              Step {currentStep + 1} of {form.role === 'driver' ? 5 : 4}
            </Text>
          </View>
          {/* Form Content */}
          <View style={styles.stepContainer}>{renderStep()}</View>
          {/* Navigation Buttons */}
          <View style={styles.buttonContainer}>
            {currentStep > STEPS.BASIC_INFO && (
              <Button
                mode="outlined"
                onPress={handleBack}
                style={styles.backStepButton}
                disabled={isLoading}
                theme={{ colors: { primary: theme.colors.primary } }}
                accessibilityLabel="Go to previous step"
              >
                Back
              </Button>
            )}
            {currentStep < STEPS.REVIEW ? (
              <Button
                mode="contained"
                onPress={handleNext}
                style={[
                  styles.nextButton,
                  currentStep === STEPS.BASIC_INFO && styles.fullWidthButton,
                ]}
                disabled={isLoading}
                theme={{ colors: { primary: theme.colors.primary } }}
                accessibilityLabel="Go to next step"
              >
                Next
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={[
                  styles.nextButton,
                  currentStep === STEPS.BASIC_INFO && styles.fullWidthButton,
                ]}
                loading={isLoading}
                disabled={isLoading}
                theme={{ colors: { primary: theme.colors.primary } }}
                accessibilityLabel={isLoading ? 'Creating account' : 'Create account'}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            )}
          </View>
          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push('/login')}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Go to login"
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
          {/* Loading Overlay */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Creating your account...</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;
