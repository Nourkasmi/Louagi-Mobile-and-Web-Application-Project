//  src/styles/shared/components.ts
import { theme } from '../theme';

export const sharedComponents = {
  // Button variants
  buttons: {
    primary: {
      backgroundColor: theme.colors.button.primary,
      paddingHorizontal: theme.spacing.button.horizontal,
      paddingVertical: theme.spacing.button.vertical,
      borderRadius: theme.borderRadius.button,
      alignItems: 'center' as const,
      ...theme.shadows.button,
    },
    
    secondary: {
      backgroundColor: theme.colors.button.secondary,
      paddingHorizontal: theme.spacing.button.horizontal,
      paddingVertical: theme.spacing.button.vertical,
      borderRadius: theme.borderRadius.button,
      alignItems: 'center' as const,
      ...theme.shadows.button,
    },
    
    danger: {
      backgroundColor: theme.colors.button.danger,
      paddingHorizontal: theme.spacing.button.horizontal,
      paddingVertical: theme.spacing.button.vertical,
      borderRadius: theme.borderRadius.button,
      alignItems: 'center' as const,
      ...theme.shadows.button,
    },
    
    success: {
      backgroundColor: theme.colors.button.success,
      paddingHorizontal: theme.spacing.button.horizontal,
      paddingVertical: theme.spacing.button.vertical,
      borderRadius: theme.borderRadius.button,
      alignItems: 'center' as const,
      ...theme.shadows.button,
    },
    
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.button.primary,
      paddingHorizontal: theme.spacing.button.horizontal,
      paddingVertical: theme.spacing.button.vertical,
      borderRadius: theme.borderRadius.button,
      alignItems: 'center' as const,
    },
    
    text: {
      backgroundColor: 'transparent',
      paddingHorizontal: theme.spacing.button.horizontal,
      paddingVertical: theme.spacing.button.verticalSmall,
      alignItems: 'center' as const,
    },
    
    disabled: {
      backgroundColor: theme.colors.button.disabled,
      paddingHorizontal: theme.spacing.button.horizontal,
      paddingVertical: theme.spacing.button.vertical,
      borderRadius: theme.borderRadius.button,
      alignItems: 'center' as const,
    },
  },
  
  // Card variants
  cards: {
    default: {
      backgroundColor: theme.colors.background.card,
      borderRadius: theme.borderRadius.card,
      padding: theme.spacing.card.padding,
      margin: theme.spacing.card.margin,
      marginBottom: theme.spacing.card.marginBottom,
      ...theme.shadows.card,
    },
    
    large: {
      backgroundColor: theme.colors.background.card,
      borderRadius: theme.borderRadius.card,
      padding: theme.spacing.card.paddingLarge,
      margin: theme.spacing.card.margin,
      marginBottom: theme.spacing.card.marginBottom,
      ...theme.shadows.cardLarge,
    },
    
    compact: {
      backgroundColor: theme.colors.background.card,
      borderRadius: theme.borderRadius.card,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.card.marginSmall,
      ...theme.shadows.light,
    },
    
    flat: {
      backgroundColor: theme.colors.background.card,
      borderRadius: theme.borderRadius.card,
      padding: theme.spacing.card.padding,
      margin: theme.spacing.card.margin,
      marginBottom: theme.spacing.card.marginBottom,
      borderWidth: 1,
      borderColor: theme.colors.border.light,
    },
  },
  
  // Header variants
  headers: {
    main: {
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing.header.padding,
      paddingTop: theme.spacing.header.paddingTop,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.light,
      ...theme.shadows.header,
    },
    
    simple: {
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing.lg,
      paddingTop: theme.spacing.header.paddingTop,
    },
    
    withStats: {
      backgroundColor: theme.colors.background.secondary,
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.light,
    },
  },
  
  // List variants
  lists: {
    container: {
      padding: theme.spacing.list.padding,
      paddingBottom: theme.spacing.list.paddingBottom,
    },
    
    item: {
      backgroundColor: theme.colors.background.card,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.list.itemMargin,
      borderRadius: theme.borderRadius.card,
      ...theme.shadows.card,
    },
    
    itemCompact: {
      backgroundColor: theme.colors.background.card,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderRadius: theme.borderRadius.medium,
      ...theme.shadows.light,
    },
  },
  
  // Input variants
  inputs: {
    default: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.input,
      paddingHorizontal: theme.spacing.input.horizontal,
      paddingVertical: theme.spacing.input.vertical,
      fontSize: theme.typography.fontSize.lg,
      borderWidth: 1,
      borderColor: theme.colors.border.light,
      marginBottom: theme.spacing.input.margin,
      color: theme.colors.text.primary,
    },
    
    focused: {
      borderColor: theme.colors.border.primary,
      borderWidth: 2,
    },
    
    error: {
      borderColor: theme.colors.border.danger,
      borderWidth: 2,
    },
  },
  
  // Status badges
  statusBadges: {
    pending: {
      backgroundColor: theme.colors.status.pending,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.badge,
    },
    
    confirmed: {
      backgroundColor: theme.colors.status.confirmed,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.badge,
    },
    
    completed: {
      backgroundColor: theme.colors.status.completed,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.badge,
    },
    
    cancelled: {
      backgroundColor: theme.colors.status.cancelled,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.badge,
    },
  },
  
  // Layout helpers
  layouts: {
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    
    containerWithPadding: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
      padding: theme.spacing.container.horizontal,
      paddingTop: theme.spacing.container.paddingTop,
    },
    
    centered: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    
    rowBetween: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    
    rowAround: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
      alignItems: 'center' as const,
    },
  },
};