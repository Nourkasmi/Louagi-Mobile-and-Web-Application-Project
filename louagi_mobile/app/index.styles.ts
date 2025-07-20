//  app/index.style.ts 
import { StyleSheet } from 'react-native';
import { theme } from '../src/styles/theme';
import { sharedComponents } from '../src/styles/shared/components';

export const styles = StyleSheet.create({
  // Using shared layout for consistent centering
  container: {
    ...sharedComponents.layouts.centered,
    backgroundColor: theme.colors.background.primary,
  },
});
