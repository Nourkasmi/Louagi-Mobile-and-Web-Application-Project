// app/(passenger)/bookings/[id].tsx - FIXED TO SHOW REAL DATA ONLY
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getBookingById, type Booking } from '../../../src/services/api';
import { theme } from '../../../src/styles/theme';

export default function BookingDetailScreen() {
    const { id, bookingData } = useLocalSearchParams<{
        id: string;
        bookingData?: string;
    }>();

    const router = useRouter();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get real route names from booking data
    const getRouteNames = (booking: Booking) => {
        if (!booking?.trip?.route) {
            return { startName: null, endName: null };
        }

        // Get real station names from API
        const startName = booking.trip.route.startStation?.name || null;
        const endName = booking.trip.route.endStation?.name || null;

        // If we have both station names, return them
        if (startName && endName) {
            return { startName, endName };
        }

        // Try to parse from route description if stations are partially missing
        if (booking.trip.route.description) {
            const patterns = [
                /(.+?)\s*(?:to|→|-|->|–)\s*(.+)/i,
                /from\s+(.+?)\s+to\s+(.+)/i,
            ];

            for (const pattern of patterns) {
                const match = booking.trip.route.description.match(pattern);
                if (match && match[1] && match[2]) {
                    return {
                        startName: startName || match[1].trim(),
                        endName: endName || match[2].trim()
                    };
                }
            }
        }

        // Return whatever we have, even if partial
        return { startName, endName };
    };

    // Get real driver information from the booking data
    const getDriverInfo = (booking: Booking) => {
        const driver = booking.trip?.driver;

        if (!driver) {
            return null; // No driver assigned yet
        }

        // Return real driver data from API
        return {
            name: driver.user?.username || driver.user?.name || null,
            rating: driver.rating || null,
            experience: driver.experience || null,
            vehicleType: driver.vehicleType || null,
            vehicleCapacity: driver.vehicleCapacity || booking.trip?.capacity || null
        };
    };

    // Parse initial booking data
    useEffect(() => {
        const initializeBooking = async () => {
            try {
                console.log('📋 Loading real booking data for ID:', id);

                // Try to use provided booking data first
                if (bookingData) {
                    try {
                        const parsedBooking = JSON.parse(bookingData);
                        console.log('✅ Using provided booking data');
                        setBooking(parsedBooking);
                        setLoading(false);
                        return;
                    } catch (parseError) {
                        console.warn('⚠️ Failed to parse booking data, fetching from API');
                    }
                }

                // Fallback to API fetch
                if (id && id !== 'undefined') {
                    console.log('📡 Fetching booking from API...');
                    const response = await getBookingById(id);

                    if (response.success && response.data) {
                        console.log('✅ Real booking data loaded:', {
                            id: response.data.id,
                            hasTrip: !!response.data.trip,
                            hasDriver: !!response.data.trip?.driver,
                            driverName: response.data.trip?.driver?.user?.username || 'No driver assigned'
                        });
                        setBooking(response.data);
                    } else {
                        console.error('❌ Failed to load booking:', response.message);
                        setError(response.message || 'Booking not found');
                    }
                } else {
                    setError('Invalid booking ID');
                }
            } catch (err: any) {
                console.error('❌ Error loading booking:', err);
                setError('Failed to load booking details');
            } finally {
                setLoading(false);
            }
        };

        initializeBooking();
    }, [id, bookingData]);

    // Helper functions
    const getStatusInfo = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return {
                    icon: 'done-all',
                    color: theme.colors.status.completed,
                    text: 'Completed',
                    description: 'Trip has been completed successfully'
                };
            case 'cancelled':
                return {
                    icon: 'cancel',
                    color: theme.colors.status.cancelled,
                    text: 'Cancelled',
                    description: 'This booking has been cancelled'
                };
            default:
                return {
                    icon: 'check-circle',
                    color: theme.colors.status.confirmed,
                    text: 'Confirmed',
                    description: 'Your booking is confirmed and paid'
                };
        }
    };

    const formatDateTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return {
                date: date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                time: date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                })
            };
        } catch {
            return { date: 'Date not available', time: 'Time not available' };
        }
    };

    // Loading state
    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Booking Details</Text>
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Loading booking details...</Text>
                </View>
            </View>
        );
    }

    // Error state
    if (error || !booking) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Booking Details</Text>
                </View>
                <View style={styles.centered}>
                    <MaterialIcons name="error-outline" size={64} color={theme.colors.text.danger} />
                    <Text style={styles.errorText}>{error || 'Booking not found'}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
                        <Text style={styles.retryButtonText}>← Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const statusInfo = getStatusInfo(booking.status);
    const departureDateTime = booking.trip?.departureTime || booking.createdAt;
    const { date: departureDate, time: departureTime } = formatDateTime(departureDateTime);
    const { date: bookingDate } = formatDateTime(booking.createdAt);

    // Get REAL route names (no fallbacks)
    const { startName, endName } = getRouteNames(booking);

    // Get REAL driver info (no fallbacks)
    const driverInfo = getDriverInfo(booking);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Booking Details</Text>
                <TouchableOpacity onPress={() => console.log('Share booking')}>
                    <MaterialIcons name="share" size={24} color={theme.colors.text.secondary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Status Card */}
                <View style={[styles.statusCard, { backgroundColor: statusInfo.color + '20' }]}>
                    <View style={styles.statusHeader}>
                        <MaterialIcons
                            name={statusInfo.icon as any}
                            size={32}
                            color={statusInfo.color}
                        />
                        <View style={styles.statusContent}>
                            <Text style={[styles.statusTitle, { color: statusInfo.color }]}>
                                {statusInfo.text}
                            </Text>
                            <Text style={styles.statusDescription}>
                                {statusInfo.description}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.referenceContainer}>
                        <Text style={styles.referenceLabel}>Booking Reference</Text>
                        <Text style={styles.referenceValue}>#{booking.bookingReference}</Text>
                    </View>
                </View>

                {/* Trip Information */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Trip Information</Text>

                    {/* REAL Route Information */}
                    {startName && endName ? (
                        <View style={styles.routeContainer}>
                            <MaterialIcons name="route" size={24} color={theme.colors.primary} />
                            <View style={styles.routeInfo}>
                                <Text style={styles.routeText}>
                                    {startName} → {endName}
                                </Text>
                                <Text style={styles.routeDescription}>
                                    {booking.trip?.route?.description || `Trip from ${startName} to ${endName}`}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.routeContainer}>
                            <MaterialIcons name="info" size={24} color={theme.colors.text.secondary} />
                            <View style={styles.routeInfo}>
                                <Text style={styles.routeText}>Route Information</Text>
                                <Text style={styles.routeDescription}>
                                    {booking.trip?.route?.description || 'Route details are being updated'}
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.tripDetails}>
                        <View style={styles.tripDetailItem}>
                            <MaterialIcons name="event" size={20} color={theme.colors.text.secondary} />
                            <View style={styles.tripDetailContent}>
                                <Text style={styles.tripDetailLabel}>Departure Date</Text>
                                <Text style={styles.tripDetailValue}>{departureDate}</Text>
                            </View>
                        </View>

                        <View style={styles.tripDetailItem}>
                            <MaterialIcons name="schedule" size={20} color={theme.colors.text.secondary} />
                            <View style={styles.tripDetailContent}>
                                <Text style={styles.tripDetailLabel}>Departure Time</Text>
                                <Text style={styles.tripDetailValue}>
                                    {booking.trip?.departureTime ? departureTime : 'When trip is full'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.tripDetailItem}>
                            <MaterialIcons name="people" size={20} color={theme.colors.text.secondary} />
                            <View style={styles.tripDetailContent}>
                                <Text style={styles.tripDetailLabel}>Passengers</Text>
                                <Text style={styles.tripDetailValue}>
                                    {booking.seats} seat{booking.seats > 1 ? 's' : ''}
                                </Text>
                            </View>
                        </View>

                        {booking.trip?.route?.estimatedDuration && (
                            <View style={styles.tripDetailItem}>
                                <MaterialIcons name="timer" size={20} color={theme.colors.text.secondary} />
                                <View style={styles.tripDetailContent}>
                                    <Text style={styles.tripDetailLabel}>Duration</Text>
                                    <Text style={styles.tripDetailValue}>
                                        {Math.floor(booking.trip.route.estimatedDuration / 60)}h {booking.trip.route.estimatedDuration % 60}m
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Payment Information */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Payment Details</Text>

                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Total Amount</Text>
                        <Text style={styles.paymentValue}>${booking.amount || '0.00'}</Text>
                    </View>

                    <Text style={styles.paymentStatus}>Status: Paid</Text>
                </View>

                {/* Booking History */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Booking History</Text>

                    <View style={styles.historyItem}>
                        <View style={styles.historyDot} />
                        <View style={styles.historyContent}>
                            <Text style={styles.historyTitle}>Booking Created & Paid</Text>
                            <Text style={styles.historyDate}>{bookingDate}</Text>
                        </View>
                    </View>

                    <View style={styles.historyItem}>
                        <View style={[styles.historyDot, { backgroundColor: theme.colors.status.confirmed }]} />
                        <View style={styles.historyContent}>
                            <Text style={styles.historyTitle}>Booking Confirmed</Text>
                            <Text style={styles.historyDate}>Payment processed successfully</Text>
                        </View>
                    </View>
                </View>

                {/* Special Requests */}
                {booking.specialRequests && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Special Requests</Text>
                        <Text style={styles.specialRequestsText}>{booking.specialRequests}</Text>
                    </View>
                )}

                {/* Contact Support Info */}
                <View style={styles.supportCard}>
                    <MaterialIcons name="help-outline" size={20} color={theme.colors.primary} />
                    <Text style={styles.supportText}>
                        Need help with your booking? Contact support at support@louagi.com
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.header.paddingTop,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
        justifyContent: 'space-between',
    },

    headerTitle: {
        ...theme.typography.heading3,
        flex: 1,
        textAlign: 'center',
        marginHorizontal: theme.spacing.lg,
    },

    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.huge,
    },

    loadingText: {
        ...theme.typography.body1,
        marginTop: theme.spacing.md,
        color: theme.colors.text.secondary,
    },

    errorText: {
        ...theme.typography.heading4,
        color: theme.colors.text.danger,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
    },

    retryButton: {
        backgroundColor: theme.colors.button.primary,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.button,
    },

    retryButtonText: {
        ...theme.typography.buttonMedium,
        color: theme.colors.text.white,
    },

    scrollContainer: {
        flex: 1,
    },

    statusCard: {
        margin: theme.spacing.lg,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.card,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
    },

    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },

    statusContent: {
        marginLeft: theme.spacing.md,
        flex: 1,
    },

    statusTitle: {
        ...theme.typography.heading3,
        fontWeight: theme.typography.fontWeight.bold,
    },

    statusDescription: {
        ...theme.typography.body2,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
    },

    referenceContainer: {
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.light,
    },

    referenceLabel: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },

    referenceValue: {
        ...theme.typography.heading4,
        color: theme.colors.primary,
        fontWeight: theme.typography.fontWeight.bold,
    },

    card: {
        backgroundColor: theme.colors.background.card,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.card,
        ...theme.shadows.card,
    },

    cardTitle: {
        ...theme.typography.heading4,
        marginBottom: theme.spacing.md,
    },

    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
        backgroundColor: theme.colors.background.accent,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.medium,
    },

    routeInfo: {
        marginLeft: theme.spacing.md,
        flex: 1,
    },

    routeText: {
        ...theme.typography.heading4,
        color: theme.colors.primary,
        fontWeight: theme.typography.fontWeight.semiBold,
    },

    routeDescription: {
        ...theme.typography.body2,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
    },

    tripDetails: {
        gap: theme.spacing.md,
    },

    tripDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    tripDetailContent: {
        marginLeft: theme.spacing.md,
        flex: 1,
    },

    tripDetailLabel: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },

    tripDetailValue: {
        ...theme.typography.body1,
        fontWeight: theme.typography.fontWeight.medium,
    },

    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    driverAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },

    driverInitial: {
        ...theme.typography.heading3,
        color: theme.colors.text.white,
        fontWeight: theme.typography.fontWeight.bold,
    },

    driverDetails: {
        flex: 1,
    },

    driverName: {
        ...theme.typography.heading4,
        marginBottom: theme.spacing.xs,
    },

    driverMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },

    driverRating: {
        ...theme.typography.body2,
        marginLeft: theme.spacing.xs,
        fontWeight: theme.typography.fontWeight.medium,
    },

    driverExperience: {
        ...theme.typography.body2,
        color: theme.colors.text.secondary,
        marginLeft: theme.spacing.xs,
    },

    vehicleInfo: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
    },

    // Driver pending info styles
    driverPendingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.tertiary,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.medium,
    },

    driverPendingText: {
        ...theme.typography.body2,
        color: theme.colors.text.secondary,
        marginLeft: theme.spacing.sm,
        flex: 1,
    },

    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },

    paymentLabel: {
        ...theme.typography.heading4,
        fontWeight: theme.typography.fontWeight.bold,
    },

    paymentValue: {
        ...theme.typography.heading3,
        color: theme.colors.primary,
        fontWeight: theme.typography.fontWeight.bold,
    },

    paymentStatus: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.sm,
        textAlign: 'center',
        fontStyle: 'italic',
    },

    historyItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.md,
    },

    historyDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.primary,
        marginTop: 4,
        marginRight: theme.spacing.md,
    },

    historyContent: {
        flex: 1,
    },

    historyTitle: {
        ...theme.typography.body1,
        fontWeight: theme.typography.fontWeight.medium,
        marginBottom: theme.spacing.xs,
    },

    historyDate: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
    },

    specialRequestsText: {
        ...theme.typography.body1,
        lineHeight: theme.typography.lineHeight.relaxed,
        color: theme.colors.text.secondary,
        fontStyle: 'italic',
    },

    supportCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.colors.background.accent,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.card,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
    },

    supportText: {
        ...theme.typography.body2,
        color: theme.colors.text.info,
        marginLeft: theme.spacing.sm,
        flex: 1,
        lineHeight: theme.typography.lineHeight.normal,
    },
});