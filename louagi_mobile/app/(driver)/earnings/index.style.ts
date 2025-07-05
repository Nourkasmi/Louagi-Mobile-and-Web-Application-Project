// 📁 app/(driver)/earnings/index.style.ts - ENHANCED WITH CHART SUPPORT
import { StyleSheet, Dimensions, Platform } from 'react-native';
import { theme } from '../../../src/styles/theme';
import { sharedComponents } from '../../../src/styles/shared/components';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  // Main container
  container: {
    ...theme.utils.container(false),
    backgroundColor: theme.colors.background.primary,
  },

  // Loading states
  centered: {
    ...sharedComponents.layouts.centered,
    backgroundColor: theme.colors.background.primary,
  },

  loadingText: {
    ...theme.typography.body1,
    marginTop: theme.spacing.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Header section
  header: {
    backgroundColor: theme.colors.background.secondary,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: theme.borderRadius.large,
    borderBottomRightRadius: theme.borderRadius.large,
    ...theme.shadows.cardLarge,
    elevation: 5,
  },

  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.md,
  },

  backButtonText: {
    ...theme.typography.linkSmall,
    fontWeight: theme.typography.fontWeight.semiBold,
    fontSize: 16,
  },

  title: {
    ...theme.typography.heading1,
    flex: 1,
  },

  // Period selector
  periodSelector: {
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },

  periodButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.tab,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: 'center',
    ...theme.shadows.light,
  },

  periodButtonActive: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.button,
  },

  periodButtonText: {
    ...theme.typography.body2,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },

  periodButtonTextActive: {
    color: theme.colors.text.white,
    fontWeight: theme.typography.fontWeight.semiBold,
  },

  // Summary card
  summaryCard: {
    backgroundColor: theme.colors.background.secondary,
    margin: theme.spacing.lg,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.card,
    ...theme.shadows.cardLarge,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },

  summaryTitle: {
    ...theme.typography.heading3,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    color: theme.colors.text.primary,
  },

  // Main earnings display
  mainEarnings: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background.light,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.light,
  },

  totalEarnings: {
    fontSize: 36,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.success,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },

  totalEarningsLabel: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    textTransform: 'capitalize',
    textAlign: 'center',
  },

  // Summary grid
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },

  summaryItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: theme.spacing.md,
  },

  summaryNumber: {
    ...theme.typography.heading3,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },

  summaryLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Chart cards
  chartCard: {
    backgroundColor: theme.colors.background.secondary,
    margin: theme.spacing.lg,
    marginTop: 0,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.card,
    ...theme.shadows.card,
  },

  cardTitle: {
    ...theme.typography.heading3,
    marginBottom: theme.spacing.lg,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },

  chartContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background.light,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
  },

  chartNote: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  chartLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontSize: 10,
  },

  // Metrics cards
  metricsCard: {
    backgroundColor: theme.colors.background.secondary,
    margin: theme.spacing.lg,
    marginTop: 0,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.card,
    ...theme.shadows.card,
  },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  metricItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: theme.colors.background.light,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.md,
    ...theme.shadows.light,
  },

  metricNumber: {
    ...theme.typography.heading3,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },

  metricLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Breakdown card
  breakdownCard: {
    backgroundColor: theme.colors.background.secondary,
    margin: theme.spacing.lg,
    marginTop: 0,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.card,
    ...theme.shadows.card,
  },

  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.tertiary,
  },

  breakdownInfo: {
    flex: 1,
  },

  breakdownDate: {
    ...theme.typography.body2,
    fontWeight: theme.typography.fontWeight.semiBold,
    marginBottom: theme.spacing.xs,
    color: theme.colors.text.primary,
  },

  breakdownTrips: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },

  breakdownEarnings: {
    ...theme.typography.heading4,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.success,
  },

  // Tips card
  tipsCard: {
    backgroundColor: theme.colors.background.accent,
    margin: theme.spacing.lg,
    marginTop: 0,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.card,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
    ...theme.shadows.card,
  },

  tipsList: {
    gap: theme.spacing.sm,
  },

  tipItem: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.relaxed,
    marginBottom: theme.spacing.sm,
  },

  // Export button
  exportButton: {
    backgroundColor: theme.colors.success,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    ...theme.shadows.button,
    elevation: 4,
  },

  exportButtonText: {
    ...theme.typography.buttonMedium,
    fontWeight: theme.typography.fontWeight.bold,
  },

  // Responsive adjustments
  ...(width < 375 && {
    // Small screen adjustments
    summaryGrid: {
      flexDirection: 'column',
      alignItems: 'center',
    },

    summaryItem: {
      width: '100%',
      marginBottom: theme.spacing.lg,
    },

    metricsGrid: {
      flexDirection: 'column',
      alignItems: 'center',
    },

    metricItem: {
      width: '100%',
      marginBottom: theme.spacing.md,
    },
  }),

  // Platform-specific styles
  ...Platform.select({
    ios: {
      summaryCard: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },

      chartCard: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    },
    android: {
      summaryCard: {
        elevation: 5,
      },

      chartCard: {
        elevation: 3,
      },

      metricsCard: {
        elevation: 3,
      },

      breakdownCard: {
        elevation: 3,
      },
    },
  }),
});