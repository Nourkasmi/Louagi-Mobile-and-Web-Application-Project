// 📁 app/(driver)/earnings/index.style.ts - CLEAN with Theme System
import { StyleSheet } from 'react-native';
import { theme } from '../../../src/styles/theme';
import { sharedComponents } from '../../../src/styles/shared/components';

export const styles = StyleSheet.create({
  // Main container
  container: theme.utils.container(false),
  
  // Loading states
  centered: sharedComponents.layouts.centered,
  loadingText: {
    ...theme.typography.body1,
    marginTop: theme.spacing.md,
    color: theme.colors.text.secondary,
  },
  
  // Header section
  header: {
    ...theme.utils.header(),
    ...sharedComponents.layouts.rowBetween,
  },
  
  title: theme.typography.heading1,
  
  backButton: {
    padding: theme.spacing.sm,
  },
  
  backButtonText: {
    ...theme.typography.linkSmall,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  
  // Period selector
  periodSelector: {
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    flexDirection: 'row',
  },
  
  periodButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.tab,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: 'center',
  },
  
  periodButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  
  periodButtonText: {
    ...theme.typography.body2,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  
  periodButtonTextActive: {
    color: theme.colors.text.white,
  },
  
  // Summary card
  summaryCard: {
    ...sharedComponents.cards.large,
  },
  
  summaryTitle: {
    ...theme.typography.heading3,
    marginBottom: theme.spacing.lg,
  },
  
  // Main earnings display
  mainEarnings: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background.light,
    borderRadius: theme.borderRadius.medium,
  },
  
  totalEarnings: {
    ...theme.typography.fontSize.giant,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.button.success,
    marginBottom: theme.spacing.xs,
  },
  
  totalEarningsLabel: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    textTransform: 'capitalize',
  },
  
  // Summary grid
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  summaryItem: {
    alignItems: 'center',
    flex: 1,
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
  
  // Metrics cards
  metricsCard: {
    ...sharedComponents.cards.default,
  },
  
  cardTitle: {
    ...theme.typography.heading3,
    marginBottom: theme.spacing.lg,
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
    ...sharedComponents.cards.default,
  },
  
  emptyBreakdown: {
    ...sharedComponents.layouts.centered,
    padding: theme.spacing.xl,
  },
  
  emptyText: {
    ...theme.typography.heading4,
    color: theme.colors.text.secondary,
  },
  
  breakdownItem: {
    ...sharedComponents.layouts.rowBetween,
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
  },
  
  breakdownTrips: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  
  breakdownEarnings: {
    ...theme.typography.heading4,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.button.success,
  },
  
  // Tips card
  tipsCard: {
    backgroundColor: theme.colors.background.accent,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.card,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  
  tipsList: {
    gap: theme.spacing.sm,
  },
  
  tipItem: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal,
  },
  
  // Export button
  exportButton: {
    ...theme.utils.button('success'),
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xxxl,
  },
  
  exportButtonText: theme.typography.buttonMedium,
});

// 🎯 DATA VISUALIZATION IMPROVEMENTS with Theme System:
// 
// ✅ EARNINGS HIERARCHY: Clear visual hierarchy for financial data
// ✅ PERIOD SELECTOR: Professional tab-style period selection
// ✅ METRIC CARDS: Consistent data presentation across all metrics
// ✅ COLOR SEMANTICS: Success green for earnings, primary blue for metrics
// ✅ GRID LAYOUTS: Perfect alignment and spacing for data grids
// ✅ BREAKDOWN LISTS: Clean, scannable transaction history
// ✅ RESPONSIVE DESIGN: Flexible layouts that work on all screen sizes
// ✅ ACCESSIBILITY: High contrast ratios for financial data readability