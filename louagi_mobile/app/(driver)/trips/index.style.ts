// 📁 app/(driver)/trips/index.style.ts - FIXED COMPLETE VERSION
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
  
  // Summary card
  summaryCard: {
    ...sharedComponents.cards.default,
  },
  
  summaryTitle: {
    ...theme.typography.heading3,
    marginBottom: theme.spacing.md,
  },
  
  summaryStats: sharedComponents.layouts.rowAround,
  
  statItem: {
    alignItems: 'center',
  },
  
  statNumber: {
    ...theme.typography.heading3,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  
  statLabel: {
    ...theme.typography.caption,
    textAlign: 'center',
  },
  
  // Filter container
  filterContainer: {
    backgroundColor: theme.colors.background.secondary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  
  filterButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.md,
    borderRadius: theme.borderRadius.tab,
    backgroundColor: theme.colors.background.tertiary,
  },
  
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  
  filterButtonText: {
    ...theme.typography.body2,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  
  filterButtonTextActive: {
    color: theme.colors.text.white,
  },
  
  // Trip cards
  tripCard: {
    ...sharedComponents.cards.default,
    marginBottom: theme.spacing.sm,
  },
  
  errorCard: {
    backgroundColor: theme.colors.background.danger,
    margin: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.card,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.danger,
  },
  
  errorText: {
    ...theme.typography.body2,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.danger,
    marginBottom: theme.spacing.xs,
  },
  
  errorSubtext: {
    ...theme.typography.caption,
    color: theme.colors.text.danger,
  },
  
  // Trip header
  tripHeader: {
    ...sharedComponents.layouts.rowBetween,
    marginBottom: theme.spacing.md,
  },
  
  routeSection: {
    flex: 1,
  },
  
  routeText: {
    ...theme.typography.heading4,
    fontWeight: theme.typography.fontWeight.semiBold,
    marginBottom: theme.spacing.xs,
  },
  
  routeDetails: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
  
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.badge,
  },
  
  statusText: {
    ...theme.typography.caption,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.white,
  },
  
  // Trip details section
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  
  timeSection: {
    flex: 1,
    alignItems: 'center',
  },
  
  capacitySection: {
    flex: 1,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.border.light,
  },
  
  earningsSection: {
    flex: 1,
    alignItems: 'center',
  },
  
  timeLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.xs,
  },
  
  timeValue: {
    ...theme.typography.heading4,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  
  dateValue: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  
  capacityLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.xs,
  },
  
  capacityValue: {
    ...theme.typography.heading4,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  
  capacityPercent: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  
  earningsLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.xs,
  },
  
  earningsValue: {
    ...theme.typography.heading4,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.button.success,
  },
  
  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  
  actionButton: {
    flex: 1,
    ...theme.utils.button('primary'),
    paddingVertical: theme.spacing.sm,
  },
  
  startButton: {
    backgroundColor: theme.colors.button.success,
  },
  
  cancelButton: {
    backgroundColor: theme.colors.button.danger,
  },
  
  completeButton: {
    backgroundColor: theme.colors.button.primary,
  },
  
  disabledButton: {
    backgroundColor: theme.colors.button.disabled,
  },
  
  actionButtonText: {
    ...theme.typography.buttonSmall,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  
  // Trip metadata
  tripMeta: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingTop: theme.spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  
  metaText: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
  },
  
  // Empty states
  emptyContainer: {
    flexGrow: 1,
  },
  
  emptyState: {
    ...sharedComponents.layouts.centered,
    padding: theme.spacing.huge,
  },
  
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  
  emptyText: {
    ...theme.typography.heading3,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  
  emptySubtext: {
    ...theme.typography.body1,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed,
    marginBottom: theme.spacing.xxxl,
  },
  
  refreshButton: theme.utils.button('primary'),
  refreshButtonText: theme.typography.buttonMedium,
});