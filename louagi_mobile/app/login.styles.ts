//  app/login.styles.ts 
import { StyleSheet, Dimensions, Platform } from 'react-native';
import { theme } from '../src/styles/theme';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },

  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },

  // Form container with enhanced shadow
  formContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.xxl,
    ...theme.shadows.cardLarge,
  },

  // Header section
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
  },

  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.background.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.button,
  },

  title: {
    ...theme.typography.heading1,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    color: theme.colors.text.primary,
  },

  subtitle: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Error handling
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

  // Input styling
  inputContainer: {
    marginBottom: theme.spacing.md,
  },

  input: {
    backgroundColor: theme.colors.background.secondary,
    fontSize: theme.typography.fontSize.lg,
    minHeight: 56, 
  },

  // Password and forgot password
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: theme.spacing.xl,
  },

  forgotPasswordText: {
    ...theme.typography.linkSmall,
    color: theme.colors.primary,
    paddingVertical: theme.spacing.sm, // Increase touch area
  },

  // Button styling
  loginButton: {
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.xl,
    minHeight: 48, // Accessibility minimum
  },

  buttonContent: {
    paddingVertical: theme.spacing.sm,
  },

  disabledButton: {
    opacity: theme.opacity.disabled,
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border.light,
  },

  dividerText: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    paddingHorizontal: theme.spacing.md,
  },

  // Register link
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },

  registerText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },

  registerLink: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },

  // Demo login section (development only)
  demoContainer: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.light,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },

  demoTitle: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  demoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: theme.spacing.md,
  },

  demoButton: {
    backgroundColor: theme.colors.background.tertiary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
    flex: 1,
    alignItems: 'center',
    minHeight: 36,
    justifyContent: 'center',
  },

  demoButtonText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Loading state
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.large,
  },

  // Success animation container
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
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

  // Responsive adjustments
  ...(width < 375 && {
    // Small screen adjustments
    formContainer: {
      padding: theme.spacing.lg,
    },

    title: {
      fontSize: theme.typography.fontSize.xl,
    },

    logoContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
  }),

  // Platform-specific adjustments
  ...Platform.select({
    ios: {
      input: {
        ...theme.shadows.none, // iOS inputs don't need extra shadow
      },
    },
    android: {
      input: {
        elevation: 1, // Subtle elevation for Android
      },
      loginButton: {
        elevation: 2,
      },
    },
  }),
});

// Helper function to get dynamic styles based on state
export const getDynamicStyles = (state: {
  hasError?: boolean;
  isLoading?: boolean;
  isDarkMode?: boolean;
}) => {
  return StyleSheet.create({
    dynamicInput: {
      borderWidth: 2,
      borderColor: state.hasError
        ? theme.colors.border.error
        : theme.colors.border.light,
    },

    dynamicButton: {
      opacity: state.isLoading ? theme.opacity.disabled : 1,
      backgroundColor: state.hasError
        ? theme.colors.button.danger
        : theme.colors.button.primary,
    },
  });
};