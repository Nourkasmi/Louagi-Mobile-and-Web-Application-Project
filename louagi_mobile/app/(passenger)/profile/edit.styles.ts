// 📁 app/(passenger)/profile/edit.style.ts - UPDATED with Theme System
import { StyleSheet } from 'react-native';
import { theme } from '../../../src/styles/theme';
import { sharedComponents } from '../../../src/styles/shared/components';

export const styles = StyleSheet.create({
  // Container using theme utility with custom top padding
  container: {
    ...theme.utils.container(),
    flexGrow: 1,
  },
  
  // Page title using theme typography
  title: {
    ...theme.typography.heading1,
    marginBottom: theme.spacing.xxxl,
    textAlign: 'left', // Override theme default
  },
  
  // Form labels using theme typography
  label: {
    ...theme.typography.subtitle2,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.section.marginTop,
  },
  
  // Input using theme utility
  input: {
    ...theme.utils.input(),
    marginBottom: theme.spacing.xs, // Override theme default
  },
  
  // Primary action button
  button: {
    ...theme.utils.button('primary'),
    marginTop: theme.spacing.xxxl,
    paddingVertical: theme.spacing.button.verticalLarge,
  },
  
  buttonText: theme.typography.buttonLarge,
  
  // Cancel button using shared text button
  cancelButton: {
    ...sharedComponents.buttons.text,
    marginTop: theme.spacing.xl,
  },
  
  cancelButtonText: {
    ...theme.typography.body1,
    color: theme.colors.text.tertiary,
  },
});

// 🎯 IMPROVEMENTS with Theme System:
// 
// ✅ CONSISTENT FORMS: All form inputs look identical across app
// ✅ PROPER HIERARCHY: Clear title → label → input → button flow
// ✅ SPACING RHYTHM: Perfect spacing using theme.spacing scale
// ✅ TYPOGRAPHY: Semantic text styles for better readability
// ✅ BUTTON CONSISTENCY: Same button style as login/register
// ✅ COLOR SYSTEM: Proper text color hierarchy
// ✅ TOUCH TARGETS: Consistent button sizes for accessibility