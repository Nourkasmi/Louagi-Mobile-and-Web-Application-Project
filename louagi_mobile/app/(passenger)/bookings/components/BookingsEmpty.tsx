// app/(passenger)/bookings/components/BookingsEmpty.tsx - FIXED Empty State Component
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../../../src/styles/theme';
import { BookingStatus } from '../types/booking.types';

interface BookingsEmptyProps {
    filter: BookingStatus | 'all';
    onCreateBooking: () => void;
    onClearFilter: () => void;
}

export default function BookingsEmpty({ filter, onCreateBooking, onClearFilter }: BookingsEmptyProps) {
    const getEmptyStateInfo = () => {
        switch (filter) {
            case 'all':
                return {
                    icon: '🎫',
                    title: 'No Bookings Yet',
                    subtitle: 'Start your journey by booking your first trip with Louagi!',
                    description: 'Browse available routes and book your seat on shared transportation.',
                    primaryAction: {
                        text: 'Book Your First Trip',
                        onPress: onCreateBooking,
                        icon: 'add-circle',
                        color: theme.colors.button.primary,
                    },
                };

            case 'pending':
                return {
                    icon: '⏳',
                    title: 'No Pending Bookings',
                    subtitle: 'All your bookings have been processed or completed.',
                    description: 'Pending bookings are those that need payment or confirmation.',
                    primaryAction: {
                        text: 'Book New Trip',
                        onPress: onCreateBooking,
                        icon: 'add',
                        color: theme.colors.button.primary,
                    },
                    secondaryAction: {
                        text: 'View All Bookings',
                        onPress: onClearFilter,
                        icon: 'list',
                        color: theme.colors.button.secondary,
                    },
                };

            case 'confirmed':
                return {
                    icon: '✅',
                    title: 'No Confirmed Bookings',
                    subtitle: 'You don\'t have any confirmed upcoming trips.',
                    description: 'Confirmed bookings are paid and ready for travel.',
                    primaryAction: {
                        text: 'Book New Trip',
                        onPress: onCreateBooking,
                        icon: 'add',
                        color: theme.colors.button.primary,
                    },
                    secondaryAction: {
                        text: 'View All Bookings',
                        onPress: onClearFilter,
                        icon: 'list',
                        color: theme.colors.button.secondary,
                    },
                };

            case 'completed':
                return {
                    icon: '🏁',
                    title: 'No Completed Trips',
                    subtitle: 'Your completed travel history will appear here.',
                    description: 'Once you finish a trip, it will show up in this section.',
                    primaryAction: {
                        text: 'Book New Trip',
                        onPress: onCreateBooking,
                        icon: 'add',
                        color: theme.colors.button.primary,
                    },
                    secondaryAction: {
                        text: 'View All Bookings',
                        onPress: onClearFilter,
                        icon: 'list',
                        color: theme.colors.button.secondary,
                    },
                };

            case 'cancelled':
                return {
                    icon: '❌',
                    title: 'No Cancelled Bookings',
                    subtitle: 'Great! You haven\'t cancelled any trips.',
                    description: 'Cancelled bookings would appear here if you had any.',
                    primaryAction: {
                        text: 'Book New Trip',
                        onPress: onCreateBooking,
                        icon: 'add',
                        color: theme.colors.button.primary,
                    },
                    secondaryAction: {
                        text: 'View All Bookings',
                        onPress: onClearFilter,
                        icon: 'list',
                        color: theme.colors.button.secondary,
                    },
                };

            default:
                return {
                    icon: '🔍',
                    title: 'No Results Found',
                    subtitle: 'No bookings match your current filter.',
                    description: 'Try changing your filter or create a new booking.',
                    primaryAction: {
                        text: 'Clear Filter',
                        onPress: onClearFilter,
                        icon: 'clear',
                        color: theme.colors.button.secondary,
                    },
                    secondaryAction: {
                        text: 'Book New Trip',
                        onPress: onCreateBooking,
                        icon: 'add',
                        color: theme.colors.button.primary,
                    },
                };
        }
    };

    const emptyState = getEmptyStateInfo();

    return (
        <View style={styles.container}>
            {/* Icon */}
            <View style={styles.iconContainer}>
                <Text style={styles.iconEmoji}>{emptyState.icon}</Text>
            </View>

            {/* Content */}
            <Text style={styles.title}>{emptyState.title}</Text>
            <Text style={styles.subtitle}>{emptyState.subtitle}</Text>
            <Text style={styles.description}>{emptyState.description}</Text>

            {/* Actions */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: emptyState.primaryAction.color }]}
                    onPress={emptyState.primaryAction.onPress}
                    activeOpacity={0.8}
                >
                    <MaterialIcons
                        name={emptyState.primaryAction.icon as any}
                        size={20}
                        color="white"
                    />
                    <Text style={styles.primaryButtonText}>
                        {emptyState.primaryAction.text}
                    </Text>
                </TouchableOpacity>

                {emptyState.secondaryAction && (
                    <TouchableOpacity
                        style={[styles.secondaryButton, { borderColor: emptyState.secondaryAction.color }]}
                        onPress={emptyState.secondaryAction.onPress}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons
                            name={emptyState.secondaryAction.icon as any}
                            size={20}
                            color={emptyState.secondaryAction.color}
                        />
                        <Text style={[styles.secondaryButtonText, { color: emptyState.secondaryAction.color }]}>
                            {emptyState.secondaryAction.text}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Tips for new users (only show on 'all' filter) */}
            {filter === 'all' && (
                <View style={styles.tipsContainer}>
                    <Text style={styles.tipsTitle}>💡 How Louagi Works:</Text>

                    <View style={styles.tipsList}>
                        <View style={styles.tipItem}>
                            <View style={styles.tipNumber}>
                                <Text style={styles.tipNumberText}>1</Text>
                            </View>
                            <Text style={styles.tipText}>Choose your departure station and destination</Text>
                        </View>

                        <View style={styles.tipItem}>
                            <View style={styles.tipNumber}>
                                <Text style={styles.tipNumberText}>2</Text>
                            </View>
                            <Text style={styles.tipText}>Select an available trip that fits your schedule</Text>
                        </View>

                        <View style={styles.tipItem}>
                            <View style={styles.tipNumber}>
                                <Text style={styles.tipNumberText}>3</Text>
                            </View>
                            <Text style={styles.tipText}>Book your seats and complete payment</Text>
                        </View>

                        <View style={styles.tipItem}>
                            <View style={styles.tipNumber}>
                                <Text style={styles.tipNumberText}>4</Text>
                            </View>
                            <Text style={styles.tipText}>Get ready to travel when the trip starts!</Text>
                        </View>
                    </View>

                    <View style={styles.benefitsContainer}>
                        <Text style={styles.benefitsTitle}>🌟 Why Choose Louagi?</Text>
                        <View style={styles.benefitsList}>
                            <Text style={styles.benefitItem}>🚗 Shared rides, lower costs</Text>
                            <Text style={styles.benefitItem}>⏰ Flexible departure times</Text>
                            <Text style={styles.benefitItem}>🛡️ Safe and reliable drivers</Text>
                            <Text style={styles.benefitItem}>📱 Easy mobile booking</Text>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.huge,
        paddingTop: theme.spacing.huge * 1.5,
    },

    iconContainer: {
        marginBottom: theme.spacing.xl,
    },

    iconEmoji: {
        fontSize: 64,
        textAlign: 'center',
    },

    title: {
        ...theme.typography.heading2,
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },

    subtitle: {
        ...theme.typography.body1,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: theme.typography.lineHeight.relaxed,
        marginBottom: theme.spacing.sm,
    },

    description: {
        ...theme.typography.body2,
        color: theme.colors.text.tertiary,
        textAlign: 'center',
        lineHeight: theme.typography.lineHeight.normal,
        marginBottom: theme.spacing.xxxl,
    },

    actionsContainer: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl,
    },

    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.button,
        ...theme.shadows.button,
        minWidth: 220,
        justifyContent: 'center',
    },

    primaryButtonText: {
        ...theme.typography.buttonMedium,
        marginLeft: theme.spacing.sm,
    },

    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.button,
        borderWidth: 1,
        minWidth: 200,
        justifyContent: 'center',
    },

    secondaryButtonText: {
        ...theme.typography.buttonMedium,
        marginLeft: theme.spacing.sm,
    },

    // Tips section
    tipsContainer: {
        backgroundColor: theme.colors.background.accent,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.card,
        width: '100%',
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
    },

    tipsTitle: {
        ...theme.typography.subtitle1,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },

    tipsList: {
        marginBottom: theme.spacing.lg,
    },

    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.sm,
    },

    tipNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
        marginTop: 2,
    },

    tipNumberText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.white,
        fontSize: 12,
    },

    tipText: {
        ...theme.typography.body2,
        color: theme.colors.text.secondary,
        flex: 1,
        lineHeight: theme.typography.lineHeight.normal,
    },

    // Benefits section
    benefitsContainer: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.light,
        paddingTop: theme.spacing.md,
    },

    benefitsTitle: {
        ...theme.typography.subtitle2,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },

    benefitsList: {
        alignItems: 'center',
    },

    benefitItem: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
        textAlign: 'center',
    },
});