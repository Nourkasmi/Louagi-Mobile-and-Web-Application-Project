// app/(passenger)/home/index.styles.ts 

import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Design tokens for enhanced home screen
const DESIGN_TOKENS = {
  colors: {
    primary: '#0066cc',
    secondary: '#28a745',
    accent: '#ff9800',
    surface: '#ffffff',
    background: '#f8f9fa',
    text: {
      primary: '#333333',
      secondary: '#666666',
      tertiary: '#999999',
      inverse: '#ffffff',
    },
    status: {
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      info: '#17a2b8',
    },
    gradients: {
      primary: ['#667eea', '#764ba2'],
      success: ['#56ab2f', '#a8e6cf'],
      warning: ['#f093fb', '#f5576c'],
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
  },
  typography: {
    sizes: {
      caption: 12,
      body2: 14,
      body1: 16,
      subtitle2: 18,
      subtitle1: 20,
      h6: 22,
      h5: 24,
      h4: 28,
      h3: 32,
      h2: 36,
      h1: 40,
    },
    weights: {
      light: '300' as const,
      regular: '400' as const,
      medium: '500' as const,
      semiBold: '600' as const,
      bold: '700' as const,
      extraBold: '800' as const,
    }
  },
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    xlarge: 20,
    round: 50,
  },
  shadows: {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    heavy: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    fab: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    }
  }
};

export const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },

  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DESIGN_TOKENS.spacing.huge,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },

  loadingText: {
    fontSize: DESIGN_TOKENS.typography.sizes.body1,
    color: DESIGN_TOKENS.colors.text.secondary,
    marginTop: DESIGN_TOKENS.spacing.lg,
    textAlign: 'center',
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DESIGN_TOKENS.spacing.huge,
  },

  errorText: {
    fontSize: DESIGN_TOKENS.typography.sizes.subtitle2,
    color: DESIGN_TOKENS.colors.status.error,
    textAlign: 'center',
    marginVertical: DESIGN_TOKENS.spacing.lg,
    lineHeight: 24,
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
  },

  retryButton: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
    paddingHorizontal: DESIGN_TOKENS.spacing.xxl,
    paddingVertical: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
    ...DESIGN_TOKENS.shadows.medium,
  },

  retryButtonText: {
    color: DESIGN_TOKENS.colors.text.inverse,
    fontSize: DESIGN_TOKENS.typography.sizes.body1,
    fontWeight: DESIGN_TOKENS.typography.weights.semiBold,
  },

  scrollContent: {
    paddingBottom: 100, // Space for FAB
  },

  // Enhanced Hero Section
  heroSection: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: DESIGN_TOKENS.spacing.xxxl,
    paddingHorizontal: DESIGN_TOKENS.spacing.xl,
    borderBottomLeftRadius: DESIGN_TOKENS.borderRadius.xlarge + 4,
    borderBottomRightRadius: DESIGN_TOKENS.borderRadius.xlarge + 4,
    ...DESIGN_TOKENS.shadows.heavy,
  },

  userSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DESIGN_TOKENS.spacing.xxxl,
  },

  userInfo: {
    flex: 1,
  },

  greeting: {
    fontSize: DESIGN_TOKENS.typography.sizes.body1,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: DESIGN_TOKENS.spacing.xs,
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
  },

  userName: {
    fontSize: DESIGN_TOKENS.typography.sizes.h4,
    fontWeight: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.text.inverse,
    marginBottom: DESIGN_TOKENS.spacing.sm,
    lineHeight: 34,
  },

  newUserBadge: {
    fontSize: DESIGN_TOKENS.typography.sizes.caption,
    color: DESIGN_TOKENS.colors.status.warning,
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
    paddingVertical: DESIGN_TOKENS.spacing.xs,
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
    alignSelf: 'flex-start',
    fontWeight: DESIGN_TOKENS.typography.weights.semiBold,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_TOKENS.spacing.lg,
  },

  notificationButton: {
    padding: DESIGN_TOKENS.spacing.sm,
    position: 'relative',
    borderRadius: DESIGN_TOKENS.borderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: DESIGN_TOKENS.colors.status.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: DESIGN_TOKENS.colors.primary,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.text.inverse,
  },

  profileButton: {
    padding: DESIGN_TOKENS.spacing.xs,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: DESIGN_TOKENS.colors.text.inverse,
    ...DESIGN_TOKENS.shadows.light,
  },

  avatarText: {
    fontSize: DESIGN_TOKENS.typography.sizes.subtitle2,
    fontWeight: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.text.inverse,
  },

  // Enhanced Stats Container
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: DESIGN_TOKENS.spacing.xxxl,
    gap: DESIGN_TOKENS.spacing.md,
  },

  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.borderRadius.large,
    gap: DESIGN_TOKENS.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...DESIGN_TOKENS.shadows.light,
  },

  statNumber: {
    fontSize: DESIGN_TOKENS.typography.sizes.subtitle2,
    fontWeight: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.text.inverse,
    lineHeight: 22,
  },

  statLabel: {
    fontSize: DESIGN_TOKENS.typography.sizes.caption - 1,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
    lineHeight: 14,
  },

  // Primary Search Button
  primarySearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_TOKENS.colors.surface,
    paddingHorizontal: DESIGN_TOKENS.spacing.xxl,
    paddingVertical: DESIGN_TOKENS.spacing.subtitle2,
    borderRadius: 28,
    gap: DESIGN_TOKENS.spacing.md,
    ...DESIGN_TOKENS.shadows.heavy,
    marginHorizontal: DESIGN_TOKENS.spacing.xs,
  },

  searchButtonText: {
    fontSize: DESIGN_TOKENS.typography.sizes.body1,
    fontWeight: DESIGN_TOKENS.typography.weights.semiBold,
    color: DESIGN_TOKENS.colors.primary,
    flex: 1,
  },

  // Section Styles
  section: {
    paddingHorizontal: DESIGN_TOKENS.spacing.xl,
    paddingVertical: DESIGN_TOKENS.spacing.xl,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },

  sectionTitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.subtitle1,
    fontWeight: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.text.primary,
    lineHeight: 24,
  },

  seeAllLink: {
    fontSize: DESIGN_TOKENS.typography.sizes.body2,
    color: DESIGN_TOKENS.colors.primary,
    fontWeight: DESIGN_TOKENS.typography.weights.semiBold,
  },

  // Enhanced Card Styles
  cardBase: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderRadius: DESIGN_TOKENS.borderRadius.large,
    padding: DESIGN_TOKENS.spacing.xl,
    ...DESIGN_TOKENS.shadows.medium,
  },

  // Next Trip Card
  nextTripCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    padding: DESIGN_TOKENS.spacing.xl,
    borderRadius: DESIGN_TOKENS.borderRadius.large,
    borderLeftWidth: 4,
    borderLeftColor: DESIGN_TOKENS.colors.secondary,
    ...DESIGN_TOKENS.shadows.medium,
  },

  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },

  routeInfo: {
    flex: 1,
  },

  routeText: {
    fontSize: DESIGN_TOKENS.typography.sizes.subtitle2,
    fontWeight: DESIGN_TOKENS.typography.weights.semiBold,
    color: DESIGN_TOKENS.colors.text.primary,
    marginBottom: DESIGN_TOKENS.spacing.xs,
    lineHeight: 22,
  },

  tripTime: {
    fontSize: DESIGN_TOKENS.typography.sizes.body2,
    color: DESIGN_TOKENS.colors.text.secondary,
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
  },

  tripBadge: {
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.xs,
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
    backgroundColor: '#e8f5e8',
  },

  tripBadgeText: {
    fontSize: DESIGN_TOKENS.typography.sizes.caption,
    fontWeight: DESIGN_TOKENS.typography.weights.semiBold,
    color: DESIGN_TOKENS.colors.secondary,
  },

  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  tripDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_TOKENS.spacing.xs,
  },

  tripDetailText: {
    fontSize: DESIGN_TOKENS.typography.sizes.caption,
    color: DESIGN_TOKENS.colors.text.secondary,
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
  },

  // Quick Actions Grid
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DESIGN_TOKENS.spacing.lg,
    justifyContent: 'space-between',
  },

  quickActionCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    width: (width - (DESIGN_TOKENS.spacing.xl * 2) - DESIGN_TOKENS.spacing.lg) / 2,
    padding: DESIGN_TOKENS.spacing.xl,
    borderRadius: DESIGN_TOKENS.borderRadius.large,
    borderLeftWidth: 4,
    ...DESIGN_TOKENS.shadows.medium,
    minHeight: 130,
    justifyContent: 'space-between',
  },

  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DESIGN_TOKENS.spacing.md,
  },

  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    ...DESIGN_TOKENS.shadows.light,
  },

  actionBadge: {
    backgroundColor: DESIGN_TOKENS.colors.status.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: DESIGN_TOKENS.colors.surface,
  },

  actionBadgeText: {
    fontSize: DESIGN_TOKENS.typography.sizes.caption,
    fontWeight: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.text.inverse,
  },

  actionTitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.body1,
    fontWeight: DESIGN_TOKENS.typography.weights.semiBold,
    color: DESIGN_TOKENS.colors.text.primary,
    marginBottom: DESIGN_TOKENS.spacing.xs,
    lineHeight: 20,
  },

  actionSubtitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.caption,
    color: DESIGN_TOKENS.colors.text.secondary,
    lineHeight: 16,
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
  },

  // Activity Cards
  activityCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    padding: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
    marginBottom: DESIGN_TOKENS.spacing.md,
    ...DESIGN_TOKENS.shadows.light,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },

  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DESIGN_TOKENS.spacing.md,
    ...DESIGN_TOKENS.shadows.light,
  },

  activityDetails: {
    flex: 1,
  },

  activityTitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.body1,
    fontWeight: DESIGN_TOKENS.typography.weights.semiBold,
    color: DESIGN_TOKENS.colors.text.primary,
    marginBottom: DESIGN_TOKENS.spacing.xs,
    lineHeight: 20,
  },

  activitySubtitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.body2,
    color: DESIGN_TOKENS.colors.text.secondary,
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
  },

  activityMeta: {
    alignItems: 'flex-end',
  },

  activityAmount: {
    fontSize: DESIGN_TOKENS.typography.sizes.body1,
    fontWeight: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.text.primary,
    marginBottom: DESIGN_TOKENS.spacing.xs,
  },

  activityStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Stations Horizontal Scroll
  stationsScrollContainer: {
    paddingRight: DESIGN_TOKENS.spacing.xl,
  },

  stationCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    width: 150,
    padding: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
    marginRight: DESIGN_TOKENS.spacing.md,
    alignItems: 'center',
    ...DESIGN_TOKENS.shadows.medium,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    minHeight: 140,
  },

  stationIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DESIGN_TOKENS.spacing.md,
    ...DESIGN_TOKENS.shadows.light,
  },

  stationName: {
    fontSize: DESIGN_TOKENS.typography.sizes.body2,
    fontWeight: DESIGN_TOKENS.typography.weights.semiBold,
    color: DESIGN_TOKENS.colors.text.primary,
    textAlign: 'center',
    marginBottom: DESIGN_TOKENS.spacing.xs,
    lineHeight: 18,
  },

  stationLocation: {
    fontSize: DESIGN_TOKENS.typography.sizes.caption,
    color: DESIGN_TOKENS.colors.text.secondary,
    textAlign: 'center',
    marginBottom: DESIGN_TOKENS.spacing.sm,
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
  },

  amenitiesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_TOKENS.spacing.xs,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
    paddingVertical: DESIGN_TOKENS.spacing.xs,
    borderRadius: DESIGN_TOKENS.borderRadius.small,
  },

  amenitiesText: {
    fontSize: 10,
    color: DESIGN_TOKENS.colors.status.warning,
    fontWeight: DESIGN_TOKENS.typography.weights.semiBold,
  },

  // Analytics Insight Card
  insightCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    padding: DESIGN_TOKENS.spacing.xl,
    borderRadius: DESIGN_TOKENS.borderRadius.large,
    borderLeftWidth: 4,
    borderLeftColor: DESIGN_TOKENS.colors.secondary,
    ...DESIGN_TOKENS.shadows.medium,
  },

  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN_TOKENS.spacing.xl,
  },

  insightContent: {
    marginLeft: DESIGN_TOKENS.spacing.lg,
    flex: 1,
  },

  insightTitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.subtitle2,
    fontWeight: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.text.primary,
    marginBottom: DESIGN_TOKENS.spacing.xs,
    lineHeight: 22,
  },

  insightSubtitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.body2,
    color: DESIGN_TOKENS.colors.text.secondary,
    lineHeight: 20,
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
  },

  impactStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    padding: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },

  impactStat: {
    alignItems: 'center',
    flex: 1,
  },

  impactNumber: {
    fontSize: DESIGN_TOKENS.typography.sizes.subtitle2,
    fontWeight: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.secondary,
    marginBottom: DESIGN_TOKENS.spacing.xs,
    lineHeight: 22,
  },

  impactLabel: {
    fontSize: DESIGN_TOKENS.typography.sizes.caption,
    color: DESIGN_TOKENS.colors.text.secondary,
    textAlign: 'center',
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
    lineHeight: 14,
  },

  // Welcome Card for New Users
  welcomeCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    padding: DESIGN_TOKENS.spacing.xxl,
    borderRadius: DESIGN_TOKENS.borderRadius.large,
    ...DESIGN_TOKENS.shadows.heavy,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
  },

  welcomeTitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.h5,
    fontWeight: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.text.primary,
    textAlign: 'center',
    marginBottom: DESIGN_TOKENS.spacing.md,
    lineHeight: 28,
  },

  welcomeText: {
    fontSize: DESIGN_TOKENS.typography.sizes.body1,
    color: DESIGN_TOKENS.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: DESIGN_TOKENS.spacing.xxl,
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
  },

  welcomeFeatures: {
    marginBottom: DESIGN_TOKENS.spacing.xxl,
  },

  welcomeFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN_TOKENS.spacing.md,
    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
  },

  featureText: {
    fontSize: DESIGN_TOKENS.typography.sizes.body2,
    color: DESIGN_TOKENS.colors.text.primary,
    marginLeft: DESIGN_TOKENS.spacing.md,
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
    flex: 1,
    lineHeight: 18,
  },

  welcomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DESIGN_TOKENS.colors.primary,
    padding: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
    gap: DESIGN_TOKENS.spacing.sm,
    ...DESIGN_TOKENS.shadows.medium,
  },

  welcomeButtonText: {
    fontSize: DESIGN_TOKENS.typography.sizes.body1,
    fontWeight: DESIGN_TOKENS.typography.weights.semiBold,
    color: DESIGN_TOKENS.colors.text.inverse,
  },

  // Footer
  footer: {
    alignItems: 'center',
    padding: DESIGN_TOKENS.spacing.xxl,
    paddingBottom: DESIGN_TOKENS.spacing.huge,
  },

  footerText: {
    fontSize: DESIGN_TOKENS.typography.sizes.body2,
    color: DESIGN_TOKENS.colors.text.secondary,
    marginBottom: DESIGN_TOKENS.spacing.xs,
    textAlign: 'center',
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
  },

  versionText: {
    fontSize: DESIGN_TOKENS.typography.sizes.caption,
    color: DESIGN_TOKENS.colors.text.tertiary,
  },

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: DESIGN_TOKENS.spacing.xxl,
    right: DESIGN_TOKENS.spacing.xxl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: DESIGN_TOKENS.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...DESIGN_TOKENS.shadows.fab,
    borderWidth: 4,
    borderColor: DESIGN_TOKENS.colors.surface,
  },

  // Responsive Design Utilities
  responsiveContainer: {
    paddingHorizontal: width > 400 ? DESIGN_TOKENS.spacing.xxl : DESIGN_TOKENS.spacing.lg,
  },

  responsiveText: {
    fontSize: width > 400 ? DESIGN_TOKENS.typography.sizes.body1 : DESIGN_TOKENS.typography.sizes.body2,
  },

  // Animation Ready Styles
  fadeInContainer: {
    opacity: 1,
  },

  slideUpContainer: {
    transform: [{ translateY: 0 }],
  },

  // Dark Mode Support (Future Enhancement)
  darkModeContainer: {
    backgroundColor: '#121212',
  },

  darkModeText: {
    color: '#ffffff',
  },

  darkModeCard: {
    backgroundColor: '#1e1e1e',
  },

  // Accessibility Enhancements
  accessibleTouchTarget: {
    minHeight: 44,
    minWidth: 44,
  },

  highContrastText: {
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // Component State Styles
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  disabled: {
    opacity: 0.5,
  },

  loading: {
    opacity: 0.8,
  },

  // Utility Classes
  hidden: {
    display: 'none',
  },

  visible: {
    display: 'flex',
  },

  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  fullWidth: {
    width: '100%',
  },

  flexRow: {
    flexDirection: 'row',
  },

  flexColumn: {
    flexDirection: 'column',
  },

  spaceBetween: {
    justifyContent: 'space-between',
  },

  spaceAround: {
    justifyContent: 'space-around',
  },

  spaceEvenly: {
    justifyContent: 'space-evenly',
  },

  alignStart: {
    alignItems: 'flex-start',
  },

  alignEnd: {
    alignItems: 'flex-end',
  },

  alignCenter: {
    alignItems: 'center',
  },

  textCenter: {
    textAlign: 'center',
  },

  textLeft: {
    textAlign: 'left',
  },

  textRight: {
    textAlign: 'right',
  },

  // Platform Specific Styles
  iosOnly: Platform.select({
    ios: { display: 'flex' },
    android: { display: 'none' },
    default: { display: 'none' },
  }),

  androidOnly: Platform.select({
    ios: { display: 'none' },
    android: { display: 'flex' },
    default: { display: 'flex' },
  }),

  // Performance Optimized Styles
  optimizedImage: {
    resizeMode: 'cover',
    backgroundColor: DESIGN_TOKENS.colors.background,
  },

  hardwareAccelerated: {
    transform: [{ translateZ: 0 }], // Force hardware acceleration
  },
});

// Export design tokens for use in other components
export { DESIGN_TOKENS };

// Export utility functions for dynamic styling
export const getResponsiveSpacing = (baseSpacing: number) => {
  return width > 400 ? baseSpacing * 1.2 : baseSpacing;
};

export const getResponsiveFontSize = (baseFontSize: number) => {
  return width > 400 ? baseFontSize : baseFontSize * 0.9;
};

export const getStatusColor = (status: string) => {
  const statusColors = {
    success: DESIGN_TOKENS.colors.status.success,
    warning: DESIGN_TOKENS.colors.status.warning,
    error: DESIGN_TOKENS.colors.status.error,
    info: DESIGN_TOKENS.colors.status.info,
    pending: DESIGN_TOKENS.colors.accent,
    confirmed: DESIGN_TOKENS.colors.secondary,
    completed: DESIGN_TOKENS.colors.status.info,
    cancelled: DESIGN_TOKENS.colors.status.error,
  };

  return statusColors[status as keyof typeof statusColors] || DESIGN_TOKENS.colors.text.secondary;
};

export const createCardShadow = (elevation: 'light' | 'medium' | 'heavy' = 'medium') => {
  return DESIGN_TOKENS.shadows[elevation];
};

export const createGradientStyle = (gradientType: keyof typeof DESIGN_TOKENS.colors.gradients) => {
  // This would need a gradient library in a real implementation
  return {
    backgroundColor: DESIGN_TOKENS.colors.gradients[gradientType][0],
  };
};