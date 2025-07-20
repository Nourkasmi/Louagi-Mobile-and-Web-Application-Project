// 📁 app/register.styles.ts 

import { StyleSheet, Dimensions, Platform } from 'react-native';
import { theme } from '../src/styles/theme';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  contentContainer: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  formContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.xl,
    ...theme.shadows.cardLarge,
    minHeight: height * 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background.tertiary,
    ...theme.shadows.small,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...theme.typography.heading2,
    marginBottom: theme.spacing.xs,
    color: theme.colors.text.primary,
  },
  subtitle: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
  },
  progressContainer: {
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.sm,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.background.tertiary,
  },
  progressText: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  stepContainer: {
    flex: 1,
    marginBottom: theme.spacing.xl,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    marginBottom: theme.spacing.sm,
    fontSize: theme.typography.fontSize.lg,
    minHeight: 56,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.heading4,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    color: theme.colors.text.primary,
  },
  sectionSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    ...theme.shadows.small,
    minHeight: 80,
  },
  selectedRoleCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.background.accent,
    ...theme.shadows.medium,
  },
  roleInfo: {
    flex: 1,
    alignItems: 'center',
    marginLeft: theme.spacing.md,
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  selectedRoleIconContainer: {
    backgroundColor: theme.colors.primary,
  },
  roleTitle: {
    ...theme.typography.heading4,
    marginBottom: theme.spacing.xs,
    color: theme.colors.text.primary,
  },
  roleDescription: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  reviewCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background.light,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  reviewSectionTitle: {
    ...theme.typography.subtitle1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    minHeight: 32,
  },
  reviewLabel: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
    flex: 0.4,
  },
  reviewValue: {
    ...theme.typography.body2,
    color: theme.colors.text.primary,
    flex: 0.6,
    textAlign: 'right',
    marginLeft: theme.spacing.md,
  },
  termsContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.info,
    borderRadius: theme.borderRadius.medium,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.info,
  },
  termsText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  backStepButton: {
    flex: 1,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    minHeight: 48,
  },
  nextButton: {
    flex: 1,
    minHeight: 48,
  },
  fullWidthButton: {
    flex: 2,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  loginText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
  loginLink: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  driverDetailsContainer: {
    backgroundColor: theme.colors.background.light,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  driverDetailsTitle: {
    ...theme.typography.subtitle1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  driverDetailsSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.danger,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.danger,
  },
  errorText: {
    ...theme.typography.body2,
    color: theme.colors.text.danger,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background.success,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.lg,
  },
  successIcon: {
    marginBottom: theme.spacing.md,
  },
  successText: {
    ...theme.typography.heading3,
    color: theme.colors.success,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  successSubtext: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.large,
  },
  loadingText: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  passwordStrengthContainer: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  passwordStrengthBar: {
    height: 4,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    ...theme.typography.caption,
    textAlign: 'center',
  },
  requiredField: {
    color: theme.colors.danger,
    fontSize: theme.typography.fontSize.sm,
  },
  ...(width < 375 && {
    formContainer: { padding: theme.spacing.md },
    title: { fontSize: theme.typography.fontSize.xl },
    roleCard: { padding: theme.spacing.md },
    buttonContainer: { flexDirection: 'column', gap: theme.spacing.sm },
    backStepButton: { flex: 0 },
    nextButton: { flex: 0 },
  }),
  ...Platform.select({
    ios: {
      input: { ...theme.shadows.none },
      roleCard: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
    },
    android: {
      input: { elevation: 1 },
      roleCard: { elevation: 2 },
      selectedRoleCard: { elevation: 4 },
    },
  }),
});

export const getDynamicStyles = (state: {
  currentStep?: number;
  isLoading?: boolean;
  hasErrors?: boolean;
  selectedRole?: 'passenger' | 'driver';
}) => {
  return StyleSheet.create({
    stepIndicator: {
      backgroundColor: state.currentStep !== undefined
        ? theme.colors.primary
        : theme.colors.background.tertiary,
      width: 12,
      height: 12,
      borderRadius: 6,
      marginHorizontal: theme.spacing.xs,
    },
    roleSpecificContainer: {
      backgroundColor: state.selectedRole === 'driver'
        ? theme.colors.background.accent
        : theme.colors.background.secondary,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.lg,
    },
    errorInput: {
      borderColor: state.hasErrors
        ? theme.colors.border.error
        : theme.colors.border.light,
      borderWidth: state.hasErrors ? 2 : 1,
    },
    disabledButton: {
      opacity: state.isLoading ? theme.opacity.disabled : 1,
      backgroundColor: state.isLoading
        ? theme.colors.button.disabled
        : theme.colors.button.primary,
    },
  });
};

export const getPasswordStrength = (password: string) => {
  let strength = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  strength = Object.values(checks).filter(Boolean).length;
  const strengthLevels = {
    0: { color: theme.colors.border.light, text: 'Enter password', width: '0%' },
    1: { color: theme.colors.danger, text: 'Very weak', width: '20%' },
    2: { color: theme.colors.warning, text: 'Weak', width: '40%' },
    3: { color: theme.colors.warning, text: 'Fair', width: '60%' },
    4: { color: theme.colors.success, text: 'Good', width: '80%' },
    5: { color: theme.colors.success, text: 'Strong', width: '100%' },
  };
  return strengthLevels[strength as keyof typeof strengthLevels] || strengthLevels[0];
};

// ** REQUIRED default export for Expo Router! **
export default styles;
