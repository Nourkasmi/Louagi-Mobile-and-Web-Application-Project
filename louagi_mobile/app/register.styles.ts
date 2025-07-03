// 📁 app/register.style.ts - UPDATED with Theme System
import { StyleSheet } from 'react-native';
import { theme } from '../src/styles/theme';
import { sharedComponents } from '../src/styles/shared/components';

export const styles = StyleSheet.create({
  // Consistent container with proper spacing
  container: {
    ...theme.utils.container(),
    justifyContent: 'center',
    flexGrow: 1,
  },
  
  // Consistent heading typography
  title: {
    ...theme.typography.heading2,
    marginBottom: theme.spacing.xxxl,
    textAlign: 'center',
  },
  
  // Consistent input styling
  input: {
    ...theme.utils.input(),
  },
  
  // Primary button using theme
  button: {
    ...theme.utils.button('primary'),
    marginTop: theme.spacing.xxxl,
  },
  
  // Text link button
  link: {
    ...sharedComponents.buttons.text,
    marginTop: theme.spacing.xl,
  },
  
  // Radio button row using theme spacing
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
});
