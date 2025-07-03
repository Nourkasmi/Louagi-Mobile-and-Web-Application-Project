// 📁 src/styles/theme/index.ts
import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';
import { shadows, borderRadius, opacity } from './shadows';

export const theme = {
  colors,
  spacing,
  typography,
  shadows,
  borderRadius,
  opacity,
  
  // Convenience methods
  utils: {
    // Create consistent button styles
    button: (variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' = 'primary') => ({
      backgroundColor: colors.button[variant],
      paddingHorizontal: spacing.button.horizontal,
      paddingVertical: spacing.button.vertical,
      borderRadius: borderRadius.button,
      alignItems: 'center' as const,
      ...shadows.button,
    }),
    
    // Create consistent card styles
    card: (padding: 'small' | 'medium' | 'large' = 'medium') => ({
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.card,
      padding: spacing.card[padding === 'small' ? 'padding' : padding === 'large' ? 'paddingLarge' : 'padding'],
      margin: spacing.card.margin,
      marginBottom: spacing.card.marginBottom,
      ...shadows.card,
    }),
    
    // Create consistent container styles
    container: (withPadding = true) => ({
      flex: 1,
      backgroundColor: colors.background.primary,
      ...(withPadding && {
        padding: spacing.container.horizontal,
        paddingTop: spacing.container.paddingTop,
      }),
    }),
    
    // Create consistent header styles
    header: () => ({
      backgroundColor: colors.background.secondary,
      padding: spacing.header.padding,
      paddingTop: spacing.header.paddingTop,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
      ...shadows.header,
    }),
    
    // Create consistent input styles
    input: () => ({
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.input,
      paddingHorizontal: spacing.input.horizontal,
      paddingVertical: spacing.input.vertical,
      fontSize: typography.fontSize.lg,
      borderWidth: 1,
      borderColor: colors.border.light,
      marginBottom: spacing.input.margin,
      color: colors.text.primary,
    }),
    
    // Create status badge styles
    statusBadge: (status: keyof typeof colors.status) => ({
      backgroundColor: colors.status[status],
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.badge,
    }),
    
    // Create text styles
    text: (variant: keyof typeof typography) => typography[variant],
  },
};

// Export individual pieces for direct import
export { colors } from './colors';
export { spacing } from './spacing';
export { typography } from './typography';
export { shadows, borderRadius, opacity } from './shadows';

// Type exports for TypeScript
export type Theme = typeof theme;
export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Typography = typeof typography; 