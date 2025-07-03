// 📁 app/(passenger)/bookings/index.style.ts - UPDATED with Theme System
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
  
  // Header using theme utility
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
  
  // Summary card using shared card
  summaryCard: sharedComponents.cards.default,
  
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
  
  // Filter buttons using theme
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
  
  // Booking cards using shared card
  bookingCard: {
    ...sharedComponents.cards.default,
    marginBottom: theme.spacing.sm,
  },
  
  // Card header
  bookingHeader: {
    ...sharedComponents.layouts.rowBetween,
    marginBottom: theme.spacing.sm,
  },
  
  routeText: {
    ...theme.typography.heading4,
    flex: 1,
  },
  
  // Status badge using theme utility
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
  
  // Booking details
  bookingDetails: {
    marginBottom: theme.spacing.sm,
  },
  
  bookingReference: {
    ...theme.typography.body2,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.link,
    marginBottom: theme.spacing.xs,
  },
  
  dateTime: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
  
  // Trip info
  tripInfo: {
    marginBottom: theme.spacing.sm,
  },
  
  routeDetails: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  
  seatInfo: {
    ...theme.typography.body2,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  
  driverInfo: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.md,
  },
  
  // Cancel button using theme utility
  cancelButton: {
    ...theme.utils.button('danger'),
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
  },
  
  cancelButtonText: theme.typography.buttonSmall,
  
  // View details button
  viewDetailsButton: {
    alignSelf: 'flex-end',
  },
  
  viewDetailsText: {
    ...theme.typography.body2,
    color: theme.colors.text.link,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  
  // Loading footer
  loadingFooter: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  
  // Empty states
  emptyContainer: {
    flexGrow: 1,
  },
  
  emptyState: {
    ...sharedComponents.layouts.centered,
    padding: theme.spacing.huge,
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
    marginBottom: theme.spacing.xxxl,
    lineHeight: theme.typography.lineHeight.relaxed,
  },
  
  // Explore button using theme utility
  exploreButton: theme.utils.button('primary'),
  exploreButtonText: theme.typography.buttonMedium,
});

// 🎯 MAJOR IMPROVEMENTS with Theme System:
// 
// ✅ STATUS BADGES: Consistent status colors across app
// ✅ FILTER BUTTONS: Professional tab-like appearance
// ✅ CARD HIERARCHY: Clear visual hierarchy in booking cards
// ✅ BUTTON CONSISTENCY: All buttons follow same style patterns
// ✅ TYPOGRAPHY SYSTEM: Perfect text hierarchy and readability
// ✅ SPACING RHYTHM: Harmonious spacing throughout complex layout
// ✅ COLOR SEMANTICS: Meaningful use of colors (links, status, etc.)
// ✅ COMPONENT REUSE: Cards, buttons, layouts are now reusable