// app/(passenger)/bookings/components/BookingCard.tsx - Individual Booking Card
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

export default function BookingCard({ booking, onPress, onAction }: BookingCardProps) {
    // Helper functions
    const getStatusInfo = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return {
                    icon: 'schedule',
                    color: theme.colors.status.pending,
                    text: 'Pending Payment',
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
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: '2-digit'
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

    const getRoute = () => {
        const start = booking.trip?.route?.startStation?.name || 'Unknown';
        const end = booking.trip?.route?.endStation?.name || 'Unknown';
        return `${start} → ${end}`;
    };

    const statusInfo = getStatusInfo(booking.status);
    const isPending = booking.status.toLowerCase() === 'pending';
    const canCancel = ['pending', 'confirmed'].includes(booking.status.toLowerCase());
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

            {/* Amount and Actions */}
            <View style={styles.footer}>
                <View style={styles.amountContainer}>
                    <Text style={styles.amountLabel}>Total</Text>
                    <Text style={styles.amount}>${booking.amount || '0.00'}</Text>
                </View>

                <View style={styles.actions}>
                    {isPending && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.paymentButton]}
                            onPress={() => onAction('retry_payment')}
                        >
                            <MaterialIcons name="payment" size={16} color="white" />
                            <Text style={styles.actionButtonText}>Pay</Text>
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
            {booking.status === 'confirmed' && booking.trip && (
                <View style={styles.capacityInfo}>
                    <MaterialIcons name="info" size={14} color={theme.colors.text.info} />
                    <Text style={styles.capacityText}>
                        Trip has {booking.trip.availableSeats} seat{booking.trip.availableSeats !== 1 ? 's' : ''} remaining
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
});