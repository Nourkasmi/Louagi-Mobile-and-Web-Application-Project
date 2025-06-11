import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';

import { registerUser, clearError } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store/store';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../App';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  role: 'passenger' | 'driver';
  // Driver specific fields
  license_no?: string;
  experience?: string;
  license_expiry?: string;
}

interface FormErrors {
  [key: string]: string;
}

const RegisterScreen: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'passenger',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { isLoading } = useSelector((state: RootState) => state.auth);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[0-9]{8,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Driver specific validations
    if (formData.role === 'driver') {
      if (!formData.license_no?.trim()) {
        newErrors.license_no = 'License number is required for drivers';
      }

      if (!formData.experience?.trim()) {
        newErrors.experience = 'Experience is required for drivers';
      } else if (isNaN(Number(formData.experience)) || Number(formData.experience) < 0) {
        newErrors.experience = 'Please enter a valid experience in years';
      }

      if (!formData.license_expiry?.trim()) {
        newErrors.license_expiry = 'License expiry date is required for drivers';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const registrationData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        role: formData.role,
        ...(formData.role === 'driver' && {
          license_no: formData.license_no?.trim(),
          experience: Number(formData.experience),
          license_expiry: formData.license_expiry?.trim(),
        }),
      };

      const result = await dispatch(registerUser(registrationData)).unwrap();

      // Navigate based on user role
      if (result.user.role === 'driver') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'DriverTabs' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'PassengerTabs' }],
        });
      }

      Toast.show({
        type: 'success',
        text1: 'Registration Successful!',
        text2: `Welcome to Louagi, ${result.user.username}!`,
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error || 'Please check your information and try again',
      });
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLoginNavigation = () => {
    dispatch(clearError());
    navigation.goBack();
  };

  const renderInput = (
    field: keyof FormData,
    label: string,
    placeholder: string,
    options: {
      icon?: string;
      secureTextEntry?: boolean;
      keyboardType?: any;
      autoCapitalize?: any;
      showPasswordToggle?: boolean;
      multiline?: boolean;
    } = {}
  ) => {
    const {
      icon,
      secureTextEntry = false,
      keyboardType = 'default',
      autoCapitalize = 'none',
      showPasswordToggle = false,
      multiline = false,
    } = options;

    const isPassword = showPasswordToggle;
    const isSecure = isPassword ? (field === 'password' ? !showPassword : !showConfirmPassword) : secureTextEntry;

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.inputWrapper, errors[field] ? styles.inputError : null]}>
          {icon && <Icon name={icon} size={20} color="#666" style={styles.inputIcon} />}
          <TextInput
            style={[styles.input, multiline && styles.multilineInput]}
            placeholder={placeholder}
            value={formData[field] || ''}
            onChangeText={(value) => handleInputChange(field, value)}
            secureTextEntry={isSecure}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            editable={!isLoading}
            multiline={multiline}
          />
          {showPasswordToggle && (
            <TouchableOpacity
              onPress={() => {
                if (field === 'password') {
                  setShowPassword(!showPassword);
                } else {
                  setShowConfirmPassword(!showConfirmPassword);
                }
              }}
              style={styles.eyeIcon}
              disabled={isLoading}
            >
              <Icon 
                name={isSecure ? 'visibility-off' : 'visibility'} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          )}
        </View>
        {errors[field] ? <Text style={styles.errorText}>{errors[field]}</Text> : null}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleLoginNavigation}
            disabled={isLoading}
          >
            <Icon name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Louagi today</Text>
        </View>

        {/* Role Selection */}
        <View style={styles.roleContainer}>
          <Text style={styles.label}>I want to register as a:</Text>
          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={[styles.roleButton, formData.role === 'passenger' && styles.activeRoleButton]}
              onPress={() => handleInputChange('role', 'passenger')}
              disabled={isLoading}
            >
              <Icon 
                name="person" 
                size={20} 
                color={formData.role === 'passenger' ? '#FFFFFF' : '#666'} 
              />
              <Text style={[
                styles.roleButtonText,
                formData.role === 'passenger' && styles.activeRoleButtonText
              ]}>
                Passenger
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, formData.role === 'driver' && styles.activeRoleButton]}
              onPress={() => handleInputChange('role', 'driver')}
              disabled={isLoading}
            >
              <Icon 
                name="directions-car" 
                size={20} 
                color={formData.role === 'driver' ? '#FFFFFF' : '#666'} 
              />
              <Text style={[
                styles.roleButtonText,
                formData.role === 'driver' && styles.activeRoleButtonText
              ]}>
                Driver
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {renderInput('username', 'Full Name', 'Enter your full name', {
            icon: 'person',
            autoCapitalize: 'words',
          })}

          {renderInput('email', 'Email Address', 'Enter your email', {
            icon: 'email',
            keyboardType: 'email-address',
          })}

          {renderInput('phone', 'Phone Number', 'Enter your phone number', {
            icon: 'phone',
            keyboardType: 'phone-pad',
          })}

          {renderInput('password', 'Password', 'Enter your password', {
            icon: 'lock',
            showPasswordToggle: true,
          })}

          {renderInput('confirmPassword', 'Confirm Password', 'Confirm your password', {
            icon: 'lock',
            showPasswordToggle: true,
          })}

          {/* Driver specific fields */}
          {formData.role === 'driver' && (
            <>
              {renderInput('license_no', 'License Number', 'Enter your license number', {
                icon: 'credit-card',
                autoCapitalize: 'characters',
              })}

              {renderInput('experience', 'Years of Experience', 'Enter years of driving experience', {
                icon: 'timeline',
                keyboardType: 'numeric',
              })}

              {renderInput('license_expiry', 'License Expiry Date', 'YYYY-MM-DD', {
                icon: 'date-range',
                keyboardType: 'numeric',
              })}
            </>
          )}
        </View>

        {/* Register Button */}
        <TouchableOpacity
          style={[styles.registerButton, isLoading && styles.disabledButton]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.registerButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={handleLoginNavigation} disabled={isLoading}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  roleContainer: {
    marginBottom: 30,
  },
  roleButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: '#F8F9FA',
  },
  activeRoleButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  roleButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeRoleButtonText: {
    color: '#FFFFFF',
  },
  formContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    minHeight: 50,
  },
  inputError: {
    borderColor: '#DC3545',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: '#DC3545',
    fontSize: 14,
    marginTop: 4,
  },
  registerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
    fontSize: 16,
  },
  loginLink: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreen;
