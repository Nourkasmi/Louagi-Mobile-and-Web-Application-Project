// 📁 app/(driver)/dashboard/index.style.ts - REPLACE ENTIRE FILE WITH THIS
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.xl,
  },

  loadingText: {
    ...theme.typography.body1,
    marginTop: theme.spacing.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Enhanced header
  header: {
    backgroundColor: theme.colors.background.secondary,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomLeftRadius: theme.borderRadius.large,
    borderBottomRightRadius: theme.borderRadius.large,
    ...theme.shadows.cardLarge,
    elevation: 5,
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },

  greetingSection: {
    flex: 1,
  },

  greeting: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },

  driverName: {
    ...theme.typography.heading2,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },

  logoutButton: {
    backgroundColor: theme.colors.background.light,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.light,
  },

  logoutIcon: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },

  logoutButtonText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Status indicator
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.light,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginTop: theme.spacing.sm,
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.sm,
  },

  statusText: {
    ...theme.typography.body2,
    fontWeight: theme.typography.fontWeight.semiBold,
    flex: 1,
    color: theme.colors.text.primary,
  },

  currentTime: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
  },

  // Scroll container
  scrollContainer: {
    flex: 1,
  },

  // Declare availability section
  declareSection: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },

  declareButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...theme.shadows.button,
    elevation: 4,
  },

  declareButtonIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
    color: theme.colors.text.white,
  },

  declareButtonText: {
    ...theme.typography.buttonMedium,
    fontWeight: theme.typography.fontWeight.bold,
  },

  // Sections
  section: {
    marginBottom: theme.spacing.lg,
  },

  sectionTitle: {
    ...theme.typography.heading3,
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    color: theme.colors.text.primary,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
  },

  viewAllText: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },

  // Stats section
  statsSection: {
    marginBottom: theme.spacing.lg,
  },

  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },

  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.card,
    alignItems: 'center',
    ...theme.shadows.card,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },

  statNumber: {
    ...theme.typography.heading2,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },

  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },

  statTrend: {
    ...theme.typography.caption,
    color: theme.colors.success,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Quick actions section
  quickActionsSection: {
    marginBottom: theme.spacing.lg,
  },

  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },

  quickActionButton: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.card,
    alignItems: 'center',
    ...theme.shadows.light,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },

  quickActionIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.sm,
  },

  quickActionText: {
    ...theme.typography.body2,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },

  // Trip card styles
  tripCard: {
    backgroundColor: theme.colors.background.secondary,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.card,
    overflow: 'hidden',
    ...theme.shadows.cardLarge,
  },

  tripHeader: {
    backgroundColor: theme.colors.background.accent,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  tripTitle: {
    ...theme.typography.heading4,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },

  tripStatus: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.badge,
  },

  tripStatusText: {
    ...theme.typography.caption,
    color: theme.colors.text.white,
    fontWeight: theme.typography.fontWeight.semiBold,
    textTransform: 'uppercase',
  },

  tripContent: {
    padding: theme.spacing.lg,
  },

  routeText: {
    ...theme.typography.heading4,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },

  routeArrow: {
    ...theme.typography.heading3,
    color: theme.colors.primary,
    textAlign: 'center',
    marginVertical: theme.spacing.sm,
  },

  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.light,
  },

  tripDetailItem: {
    alignItems: 'center',
  },

  tripDetailLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },

  tripDetailValue: {
    ...theme.typography.body1,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },

  // Trip actions
  tripActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },

  actionButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    ...theme.shadows.button,
  },

  startButton: {
    backgroundColor: theme.colors.success,
  },

  cancelButton: {
    backgroundColor: theme.colors.danger,
  },

  completeButton: {
    backgroundColor: theme.colors.primary,
  },

  actionButtonText: {
    ...theme.typography.buttonMedium,
    fontWeight: theme.typography.fontWeight.semiBold,
  },

  // Recent trips
  recentTripCard: {
    backgroundColor: theme.colors.background.secondary,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.light,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },

  recentTripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  recentTripRoute: {
    flex: 1,
  },

  recentTripText: {
    ...theme.typography.body1,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },

  recentTripDate: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },

  recentTripDetails: {
    alignItems: 'flex-end',
  },

  recentTripEarnings: {
    ...theme.typography.body1,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.success,
    marginBottom: theme.spacing.xs,
  },

  recentTripStatus: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
  },

  recentTripStatusText: {
    ...theme.typography.caption,
    color: theme.colors.text.white,
    fontWeight: theme.typography.fontWeight.semiBold,
    fontSize: 10,
  },

  // Weekly summary
  weeklyCard: {
    backgroundColor: theme.colors.background.secondary,
    marginHorizontal: theme.spacing.lg,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.card,
    ...theme.shadows.card,
  },

  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
  },

  weeklyStat: {
    alignItems: 'center',
  },

  weeklyStatNumber: {
    ...theme.typography.heading2,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },

  weeklyStatLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  weeklyProgress: {
    marginTop: theme.spacing.md,
  },

  weeklyProgressLabel: {
    ...theme.typography.body2,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },

  progressBar: {
    height: 8,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  weeklyProgressText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },

  // Tips section
  tipsCard: {
    backgroundColor: theme.colors.background.light,
    marginHorizontal: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.card,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },

  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },

  tipIcon: {
    fontSize: 18,
    marginRight: theme.spacing.md,
    marginTop: 2,
  },

  tipText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    flex: 1,
    lineHeight: theme.typography.lineHeight.relaxed,
  },

  // Support section
  supportCard: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },

  supportButton: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.card,
    alignItems: 'center',
    ...theme.shadows.light,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },

  supportIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.sm,
  },

  supportText: {
    ...theme.typography.body2,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },

  // Error states
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background.primary,
  },

  errorIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },

  errorTitle: {
    ...theme.typography.heading2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },

  errorMessage: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: theme.typography.lineHeight.relaxed,
  },

  retryButton: {
    ...theme.utils.button('primary'),
    paddingHorizontal: theme.spacing.xl,
  },

  retryButtonText: {
    ...theme.typography.buttonMedium,
  },

  // Responsive adjustments
  ...(width < 375 && {
    // Small screen adjustments
    header: {
      paddingHorizontal: theme.spacing.md,
    },

    statsContainer: {
      flexDirection: 'column',
      gap: theme.spacing.sm,
    },

    statCard: {
      marginBottom: theme.spacing.sm,
    },

    quickActions: {
      flexDirection: 'column',
      gap: theme.spacing.sm,
    },

    weeklyStats: {
      flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing.lg,
    },

    supportCard: {
      flexDirection: 'column',
      gap: theme.spacing.sm,
    },
  }),

  // Platform-specific styles
  ...Platform.select({
    ios: {
      tripCard: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
    },
    android: {
      tripCard: {
        elevation: 4,
      },
    },
  }),
});