// 📁 app/(passenger)/home/index.styles.ts - ENHANCED Modern Styles
import { StyleSheet, Dimensions } from 'react-native';
import { theme } from '../../../src/styles/theme';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // Account for margins and padding

export const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },

  // Header section
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...theme.shadows.card,
  },

  userSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },

  greetingContainer: {
    flex: 1,
  },

  greeting: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },

  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },

  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  profileButton: {
    padding: 4,
  },

  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#ffebee',
  },

  // Stats section
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background.accent,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },

  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },

  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Loading and error states
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },

  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 16,
    textAlign: 'center',
  },

  errorText: {
    fontSize: 18,
    color: theme.colors.text.danger,
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 24,
  },

  retryButton: {
    backgroundColor: theme.colors.button.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },

  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Section headers
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  seeAllLink: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // Quick actions
  quickActionsContainer: {
    padding: 20,
    paddingTop: 24,
  },

  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },

  quickActionCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    position: 'relative',
    minHeight: 120,
    width: (width - 56) / 2, // Two cards per row
    ...theme.shadows.card,
  },

  primaryActionCard: {
    backgroundColor: '#0066cc',
    width: width - 40, // Full width for primary action
  },

  primaryActionGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  primaryActionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },

  primaryActionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },

  actionChevron: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },

  quickActionSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  actionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Next trip section
  nextTripContainer: {
    padding: 20,
    paddingTop: 0,
  },

  nextTripCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    ...theme.shadows.card,
  },

  nextTripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  routeInfo: {
    flex: 1,
  },

  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },

  nextTripTime: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },

  tripStatusBadge: {
    backgroundColor: theme.colors.background.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  tripStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.success,
  },

  nextTripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  tripDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  tripDetailText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },

  // Recent bookings
  recentBookingsContainer: {
    padding: 20,
    paddingTop: 0,
  },

  recentBookingCard: {
    backgroundColor: '#ffffff',
    marginBottom: 12,
    borderRadius: 12,
    ...theme.shadows.light,
  },

  bookingCardContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  bookingRoute: {
    flex: 1,
  },

  bookingRouteText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },

  bookingDate: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },

  bookingStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  bookingStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  bookingAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  // Stations section
  stationsContainer: {
    padding: 20,
    paddingTop: 0,
  },

  stationsList: {
    paddingBottom: 8,
  },

  stationRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  stationCard: {
    backgroundColor: '#ffffff',
    width: cardWidth,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.light,
  },

  stationCardLeft: {
    marginRight: 6,
  },

  stationCardRight: {
    marginLeft: 6,
  },

  stationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  stationInfo: {
    flex: 1,
  },

  stationName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },

  stationLocation: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },

  amenitiesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  amenitiesText: {
    fontSize: 10,
    color: theme.colors.warning,
    fontWeight: '500',
  },

  // Empty states
  emptyStations: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 8,
  },

  emptyStationsText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginTop: 12,
    marginBottom: 4,
  },

  emptyStationsSubtext: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },

  // Footer
  footerContainer: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 40,
  },

  footerText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },

  versionText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },

  // Legacy styles for compatibility
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },

  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },

  welcomeCard: {
    backgroundColor: theme.colors.background.accent,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },

  welcomeText: {
    fontSize: 14,
    color: theme.colors.text.info,
    fontWeight: '500',
  },

  listContainer: {
    padding: 16,
  },

  emptyState: {
    alignItems: 'center',
    padding: 40,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },

  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },

  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: 24,
  },
});