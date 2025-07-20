// app/(passenger)/bookings/components/BookingCard.tsx 

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../../../src/styles/theme';
import { Booking } from '../../../../src/services/api';
import { BookingAction } from '../types/booking.types';

interface BookingCardProps {
    booking: Booking;
    onPress: () => void;
    onAction: (action: BookingAction) => void;
}

const getActualBookingStatus = (booking: Booking) => {

    if (booking.paymentStatus === 'completed') {
        return 'confirmed';
    }

    if (booking.paymentStatus === 'pending' || booking.paymentStatus === 'failed') {
        return 'pending';
    }


    if (booking.trip?.status === 'completed') {
        return 'completed';
    }

    if (booking.trip?.status === 'cancelled' || booking.status === 'cancelled') {
        return 'cancelled';
    }

    const statusMap: Record<string, string> = {
        'pending': 'pending',
        'confirmed': 'confirmed',
        'completed': 'completed',
        'cancelled': 'cancelled',
        'canceled': 'cancelled',
        'no_show': 'cancelled',
        'in_progress': 'confirmed',
    };

    return statusMap[booking.status.toLowerCase()] || 'pending';
};

export default function BookingCard({ booking, onPress, onAction }: BookingCardProps) {

    const actualStatus = getActualBookingStatus(booking);


    const getRoute = () => {
        let startName = 'Departure';
        let endName = 'Destination';


        if (booking.trip?.route?.startStation?.name) {
            startName = booking.trip.route.startStation.name;
        }
        if (booking.trip?.route?.endStation?.name) {
            endName = booking.trip.route.endStation.name;
        }

        if ((startName === 'Departure' || endName === 'Destination') && booking.trip?.route?.description) {
            const description = booking.trip.route.description;

            const patterns = [
                /(.+?)\s*(?:to|→|-|->|–)\s*(.+)/i,
                /from\s+(.+?)\s+to\s+(.+)/i,
                /(.+?)\s*\/\s*(.+)/,
            ];

            for (const pattern of patterns) {
                const match = description.match(pattern);
                if (match && match[1] && match[2]) {
                    if (startName === 'Departure') startName = match[1].trim();
                    if (endName === 'Destination') endName = match[2].trim();
                    break;
                }
            }
        }


        if (startName === 'Departure' && booking.metadata?.startStationName) {
            startName = booking.metadata.startStationName;
        }
        if (endName === 'Destination' && booking.metadata?.endStationName) {
            endName = booking.metadata.endStationName;
        }

        const route = `${startName} → ${endName}`;
        return route;
    };

    const getStatusInfo = (status: string, booking: Booking) => {
        const needsPayment = booking.paymentStatus === 'pending' || booking.paymentStatus === 'failed';

        switch (status.toLowerCase()) {
            case 'pending':
                return {
                    icon: needsPayment ? 'payment' : 'schedule',
                    color: theme.colors.status.pending,
                    text: needsPayment ? 'Payment Required' : 'Pending Confirmation',
                    bgColor: theme.colors.background.warning
                };
            case 'confirmed':
                return {
                    icon: 'check-circle',
                    color: theme.colors.status.confirmed,
                    text: 'Confirmed',
                    bgColor: theme.colors.background.success
                };
            case 'completed':
                return {
                    icon: 'done-all',
                    color: theme.colors.status.completed,
                    text: 'Completed',
                    bgColor: theme.colors.background.accent
                };
            case 'cancelled':
                return {
                    icon: 'cancel',
                    color: theme.colors.status.cancelled,
                    text: 'Cancelled',
                    bgColor: theme.colors.background.danger
                };
            default:
                return {
                    icon: 'help',
                    color: theme.colors.text.secondary,
                    text: status,
                    bgColor: theme.colors.background.tertiary
                };
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            if (date.toDateString() === today.toDateString()) return 'Today';
            if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? '2-digit' : undefined
            });
        } catch {
            return 'Invalid Date';
        }
    };

    const formatTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return 'Invalid Time';
        }
    };

    const statusInfo = getStatusInfo(actualStatus, booking);
    const needsPayment = booking.paymentStatus === 'pending' || booking.paymentStatus === 'failed';
    const canCancel = ['pending', 'confirmed'].includes(actualStatus.toLowerCase()) &&
        booking.trip?.departureTime &&
        new Date(booking.trip.departureTime) > new Date();
    const departureTime = booking.trip?.departureTime || booking.createdAt;

    return (
        <TouchableOpacity
            style={[styles.container, { borderLeftColor: statusInfo.color }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Header Row */}
            <View style={styles.header}>
                <View style={styles.referenceContainer}>
                    <Text style={styles.reference}>#{booking.bookingReference}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                        <MaterialIcons
                            name={statusInfo.icon as any}
                            size={14}
                            color={statusInfo.color}
                        />
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>
                            {statusInfo.text}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.moreButton}
                    onPress={() => onAction('view_trip')}
                >
                    <MaterialIcons name="more-vert" size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>
            </View>

            {/* Route Information */}
            <View style={styles.routeContainer}>
                <MaterialIcons name="route" size={20} color={theme.colors.primary} />
                <Text style={styles.route}>{getRoute()}</Text>
            </View>

            {/* Trip Details */}
            <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                    <MaterialIcons name="event" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.detailText}>{formatDate(departureTime)}</Text>
                </View>

                <View style={styles.detailItem}>
                    <MaterialIcons name="schedule" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.detailText}>
                        {booking.trip?.departureTime ? formatTime(departureTime) : 'When full'}
                    </Text>
                </View>

                <View style={styles.detailItem}>
                    <MaterialIcons name="people" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.detailText}>{booking.seats} seat{booking.seats > 1 ? 's' : ''}</Text>
                </View>
            </View>

            {/* 🔧 FIXED: Payment Status Display */}
            {booking.paymentStatus && (
                <View style={styles.paymentStatusContainer}>
                    <MaterialIcons
                        name={booking.paymentStatus === 'completed' ? 'check-circle' : 'payment'}
                        size={14}
                        color={booking.paymentStatus === 'completed' ? theme.colors.status.confirmed : theme.colors.status.pending}
                    />
                    <Text style={[
                        styles.paymentStatusText,
                        { color: booking.paymentStatus === 'completed' ? theme.colors.status.confirmed : theme.colors.status.pending }
                    ]}>
                        Payment: {booking.paymentStatus === 'completed' ? 'Paid' :
                            booking.paymentStatus === 'pending' ? 'Pending' :
                                booking.paymentStatus === 'failed' ? 'Failed' : booking.paymentStatus}
                    </Text>
                </View>
            )}

            {/* Amount and Actions */}
            <View style={styles.footer}>
                <View style={styles.amountContainer}>
                    <Text style={styles.amountLabel}>Total</Text>
                    <Text style={styles.amount}>${booking.amount || '0.00'}</Text>
                </View>

                <View style={styles.actions}>
                    {needsPayment && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.paymentButton]}
                            onPress={() => onAction('retry_payment')}
                        >
                            <MaterialIcons name="payment" size={16} color="white" />
                            <Text style={styles.actionButtonText}>Pay Now</Text>
                        </TouchableOpacity>
                    )}

                    {canCancel && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={() => onAction('cancel')}
                        >
                            <MaterialIcons name="cancel" size={16} color={theme.colors.text.danger} />
                            <Text style={[styles.actionButtonText, { color: theme.colors.text.danger }]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Trip Capacity Info (for confirmed bookings) */}
            {actualStatus === 'confirmed' && booking.trip && (
                <View style={styles.capacityInfo}>
                    <MaterialIcons name="info" size={14} color={theme.colors.text.info} />
                    <Text style={styles.capacityText}>
                        Trip has {booking.trip.availableSeats} seat{booking.trip.availableSeats !== 1 ? 's' : ''} remaining
                    </Text>
                </View>
            )}

            {/*  FIXED: Debug info for development */}
            {__DEV__ && (
                <View style={styles.debugInfo}>
                    <Text style={styles.debugText}>
                        📊 Status: {booking.status} → {actualStatus} | Payment: {booking.paymentStatus || 'unknown'}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.background.card,
        borderRadius: theme.borderRadius.card,
        padding: theme.spacing.lg,
        borderLeftWidth: 4,
        ...theme.shadows.card,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.md,
    },

    referenceContainer: {
        flex: 1,
    },

    reference: {
        ...theme.typography.heading4,
        color: theme.colors.primary,
        marginBottom: theme.spacing.xs,
    },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.badge,
        alignSelf: 'flex-start',
    },

    statusText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.medium,
        marginLeft: theme.spacing.xs,
    },

    moreButton: {
        padding: theme.spacing.xs,
    },

    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.background.accent,
        borderRadius: theme.borderRadius.medium,
        paddingHorizontal: theme.spacing.md,
    },

    route: {
        ...theme.typography.subtitle1,
        fontWeight: theme.typography.fontWeight.semiBold,
        marginLeft: theme.spacing.sm,
        flex: 1,
    },

    detailsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },

    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    detailText: {
        ...theme.typography.body2,
        marginLeft: theme.spacing.xs,
        color: theme.colors.text.secondary,
    },

    paymentStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.sm,
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: theme.borderRadius.small,
    },

    paymentStatusText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.medium,
        marginLeft: theme.spacing.xs,
    },

    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    amountContainer: {
        flex: 1,
    },

    amountLabel: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },

    amount: {
        ...theme.typography.heading3,
        color: theme.colors.primary,
        fontWeight: theme.typography.fontWeight.bold,
    },

    actions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },

    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.button,
        borderWidth: 1,
    },

    paymentButton: {
        backgroundColor: theme.colors.button.warning,
        borderColor: theme.colors.button.warning,
    },

    cancelButton: {
        backgroundColor: 'transparent',
        borderColor: theme.colors.border.danger,
    },

    actionButtonText: {
        ...theme.typography.buttonSmall,
        marginLeft: theme.spacing.xs,
    },

    capacityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.md,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.light,
    },

    capacityText: {
        ...theme.typography.caption,
        color: theme.colors.text.info,
        marginLeft: theme.spacing.xs,
    },

    debugInfo: {
        marginTop: theme.spacing.md,
        padding: theme.spacing.sm,
        backgroundColor: '#fff3cd',
        borderRadius: theme.borderRadius.small,
        borderWidth: 1,
        borderColor: '#ffeaa7',
    },

    debugText: {
        fontSize: 10,
        color: '#856404',
        marginBottom: 2,
    },
});