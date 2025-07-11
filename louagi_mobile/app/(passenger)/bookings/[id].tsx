// app/(passenger)/bookings/[id].tsx - Individual Booking Detail Screen
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
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

    // Parse initial booking data if provided
    useEffect(() => {
        const initializeBooking = async () => {
            try {
                // Try to use provided booking data first
                if (bookingData) {
                    try {
                        const parsedBooking = JSON.parse(bookingData);
                        setBooking(parsedBooking);
                        setLoading(false);
                        return;
                    } catch (parseError) {
                        console.warn('Failed to parse booking data:', parseError);
                    }
                }

                // Fallback to API fetch
                if (id) {
                    const response = await getBookingById(id);
                    if (response.success && response.data) {
                        setBooking(response.data);
                    } else {
                        setError(response.message || 'Booking not found');
                    }
                } else {
                    setError('Booking ID is missing');
                }
            } catch (err: any) {
                console.error('Error loading booking:', err);
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
            case 'pending':
                return {
                    icon: 'schedule',
                    color: theme.colors.status.pending,
                    text: 'Pending Payment',
                    description: 'Complete payment to confirm your booking'
                };
            case 'confirmed':
                return {
                    icon: 'check-circle',
                    color: theme.colors.status.confirmed,
                    text: 'Confirmed',
                    description: 'Your booking is confirmed and seat is reserved'
                };
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
                    icon: 'help',
                    color: theme.colors.text.secondary,
                    text: status,
                    description: ''
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
            return { date: 'Invalid Date', time: 'Invalid Time' };
        }
    };

    const handlePayment = () => {
        if (!booking) return;

        router.push({
            pathname: '/(passenger)/payment',
            params: {
                bookingId: booking.id,
                amount: booking.amount?.toString() || '0',
                bookingReference: booking.bookingReference,
                tripData: JSON.stringify(booking.trip),
            }
        });
    };

    const handleCancel = () => {
        Alert.alert(
            'Cancel Booking',
            'Are you sure you want to cancel this booking? This action cannot be undone.',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: () => {
                        // TODO: Implement cancel booking
                        Alert.alert('Info', 'Cancel booking functionality coming soon');
                    }
                }
            ]
        );
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

    const canCancel = ['pending', 'confirmed'].includes(booking.status.toLowerCase());
    const needsPayment = booking.status.toLowerCase() === 'pending';

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Booking Details</Text>
                <View style={styles.headerAction}>
                    <TouchableOpacity onPress={() => Alert.alert('Share', 'Share functionality coming soon')}>
                        <MaterialIcons name="share" size={24} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                </View>
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

                    <View style={styles.routeContainer}>
                        <MaterialIcons name="route" size={24} color={theme.colors.primary} />
                        <View style={styles.routeInfo}>
                            <Text style={styles.routeText}>
                                {booking.trip?.route?.startStation?.name || 'Unknown'} → {booking.trip?.route?.endStation?.name || 'Unknown'}
                            </Text>
                            <Text style={styles.routeDescription}>
                                {booking.trip?.route?.description || 'Trip route'}
                            </Text>
                        </View>
                    </View>

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

                {/* Driver Information */}
                {booking.trip?.driver && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Driver Information</Text>

                        <View style={styles.driverInfo}>
                            <View style={styles.driverAvatar}>
                                <Text style={styles.driverInitial}>
                                    {booking.trip.driver.user?.username?.charAt(0).toUpperCase() || 'D'}
                                </Text>
                            </View>

                            <View style={styles.driverDetails}>
                                <Text style={styles.driverName}>
                                    {booking.trip.driver.user?.username || 'Unknown Driver'}
                                </Text>
                                <View style={styles.driverMeta}>
                                    <MaterialIcons name="star" size={16} color={theme.colors.warning} />
                                    <Text style={styles.driverRating}>
                                        {booking.trip.driver.rating?.toFixed(1) || '5.0'}
                                    </Text>
                                    <Text style={styles.driverExperience}>
                                        • {booking.trip.driver.experience || 5} years experience
                                    </Text>
                                </View>
                                <Text style={styles.vehicleInfo}>
                                    {booking.trip.driver.vehicleType || 'Vehicle'} • {booking.trip.capacity} seats
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Payment Information */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Payment Details</Text>

                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Subtotal</Text>
                        <Text style={styles.paymentValue}>${booking.amount || '0.00'}</Text>
                    </View>

                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Fees</Text>
                        <Text style={styles.paymentValue}>$0.00</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.paymentRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>${booking.amount || '0.00'}</Text>
                    </View>

                    <Text style={styles.paymentStatus}>
                        Status: {needsPayment ? 'Payment Pending' : 'Paid'}
                    </Text>
                </View>

                {/* Booking History */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Booking History</Text>

                    <View style={styles.historyItem}>
                        <View style={styles.historyDot} />
                        <View style={styles.historyContent}>
                            <Text style={styles.historyTitle}>Booking Created</Text>
                            <Text style={styles.historyDate}>{bookingDate}</Text>
                        </View>
                    </View>

                    {!needsPayment && (
                        <View style={styles.historyItem}>
                            <View style={[styles.historyDot, { backgroundColor: theme.colors.status.confirmed }]} />
                            <View style={styles.historyContent}>
                                <Text style={styles.historyTitle}>Payment Completed</Text>
                                <Text style={styles.historyDate}>Payment processed</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Special Requests */}
                {booking.specialRequests && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Special Requests</Text>
                        <Text style={styles.specialRequestsText}>{booking.specialRequests}</Text>
                    </View>
                )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
                {needsPayment && (
                    <TouchableOpacity style={styles.paymentButton} onPress={handlePayment}>
                        <MaterialIcons name="payment" size={20} color="white" />
                        <Text style={styles.paymentButtonText}>Complete Payment</Text>
                    </TouchableOpacity>
                )}

                {canCancel && (
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                        <MaterialIcons name="cancel" size={20} color={theme.colors.text.danger} />
                        <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                    </TouchableOpacity>
                )}

                {!canCancel && !needsPayment && (
                    <TouchableOpacity
                        style={styles.supportButton}
                        onPress={() => Alert.alert('Support', 'Contact support: support@louagi.com')}
                    >
                        <MaterialIcons name="help-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.supportButtonText}>Contact Support</Text>
                    </TouchableOpacity>
                )}
            </View>
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
        ...theme.shadows.header,
    },

    headerTitle: {
        ...theme.typography.heading3,
        flex: 1,
        textAlign: 'center',
        marginHorizontal: theme.spacing.lg,
    },

    headerAction: {
        width: 24,
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
        ...theme.utils.button('primary'),
    },

    retryButtonText: {
        ...theme.typography.buttonMedium,
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

    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },

    paymentLabel: {
        ...theme.typography.body1,
        color: theme.colors.text.secondary,
    },

    paymentValue: {
        ...theme.typography.body1,
        fontWeight: theme.typography.fontWeight.medium,
    },

    divider: {
        height: 1,
        backgroundColor: theme.colors.border.light,
        marginVertical: theme.spacing.md,
    },

    totalLabel: {
        ...theme.typography.heading4,
        fontWeight: theme.typography.fontWeight.bold,
    },

    totalValue: {
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

    actionContainer: {
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background.secondary,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.light,
        gap: theme.spacing.md,
    },

    paymentButton: {
        ...theme.utils.button('warning'),
        flexDirection: 'row',
        justifyContent: 'center',
    },

    paymentButtonText: {
        ...theme.typography.buttonMedium,
        marginLeft: theme.spacing.sm,
    },

    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.border.danger,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.button,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },

    cancelButtonText: {
        ...theme.typography.buttonMedium,
        color: theme.colors.text.danger,
        marginLeft: theme.spacing.sm,
    },

    supportButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.border.primary,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.button,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },

    supportButtonText: {
        ...theme.typography.buttonMedium,
        color: theme.colors.primary,
        marginLeft: theme.spacing.sm,
    },
});