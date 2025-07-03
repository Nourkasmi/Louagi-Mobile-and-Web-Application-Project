// 📁 app/login.style.ts - UPDATED with Theme System
import { StyleSheet } from 'react-native';
import { theme } from '../src/styles/theme';
import { sharedComponents } from '../src/styles/shared/components';

export const styles = StyleSheet.create({
  // Using theme utility for consistent container
  container: {
    ...theme.utils.container(),
    justifyContent: 'center',
  },
  
  // Using typography from theme (more consistent)
  title: {
    ...theme.typography.heading2,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  
  // Using input utility from theme (consistent across app)
  input: {
    ...theme.utils.input(),
  },
  
  // Using button utility from theme
  button: {
    ...theme.utils.button('primary'),
    marginTop: theme.spacing.md,
  },
  
  // Using shared button component for text links
  link: {
    ...sharedComponents.buttons.text,
    marginTop: theme.spacing.sm,
  },
});
