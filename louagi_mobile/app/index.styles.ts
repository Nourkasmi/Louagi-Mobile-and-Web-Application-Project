// 📁 app/index.style.ts - UPDATED with Theme System
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

// 🎯 BENEFITS Even for Simple Components:
// 
// ✅ CONSISTENT BACKGROUND: Uses theme background color
// ✅ SHARED LAYOUT: Reuses centered layout pattern
// ✅ MAINTAINABLE: Easy to modify app-wide loading appearance
// ✅ THEME READY: Automatically supports theme switching
// 
// Though simple, this ensures even loading states are consistent!