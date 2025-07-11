// app/(passenger)/bookings/components/BookingsEmpty.tsx - Empty State Component
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
                    icon: 'assignment',
                    title: 'No Bookings Yet',
                    subtitle: 'Start your journey by booking your first trip!',
                    primaryAction: {
                        text: 'Book Your First Trip',
                        onPress: onCreateBooking,
                        icon: 'add',
                    },
                };

            case 'pending':
                return {
                    icon: 'schedule',
                    title: 'No Pending Bookings',
                    subtitle: 'All your bookings have been processed.',
                    primaryAction: {
                        text: 'View All Bookings',
                        onPress: onClearFilter,
                        icon: 'list',
                    },
                    secondaryAction: {
                        text: 'Book New Trip',
                        onPress: onCreateBooking,
                        icon: 'add',
                    },
                };

            case 'confirmed':
                return {
                    icon: 'check-circle',
                    title: 'No Confirmed Bookings',
                    subtitle: 'You don\'t have any confirmed upcoming trips.',
                    primaryAction: {
                        text: 'Book New Trip',
                        onPress: onCreateBooking,
                        icon: 'add',
                    },
                    secondaryAction: {
                        text: 'View All Bookings',
                        onPress: onClearFilter,
                        icon: 'list',
                    },
                };

            case 'completed':
                return {
                    icon: 'done-all',
                    title: 'No Completed Trips',
                    subtitle: 'Your completed trips will appear here.',
                    primaryAction: {
                        text: 'Book New Trip',
                        onPress: onCreateBooking,
                        icon: 'add',
                    },
                    secondaryAction: {
                        text: 'View All Bookings',
                        onPress: onClearFilter,
                        icon: 'list',
                    },
                };

            case 'cancelled':
                return {
                    icon: 'cancel',
                    title: 'No Cancelled Bookings',
                    subtitle: 'Great! You haven\'t cancelled any trips.',
                    primaryAction: {
                        text: 'Book New Trip',
                        onPress: onCreateBooking,
                        icon: 'add',
                    },
                    secondaryAction: {
                        text: 'View All Bookings',
                        onPress: onClearFilter,
                        icon: 'list',
                    },
                };

            default:
                return {
                    icon: 'search-off',
                    title: 'No Results',
                    subtitle: 'No bookings match your current filter.',
                    primaryAction: {
                        text: 'Clear Filter',
                        onPress: onClearFilter,
                        icon: 'clear',
                    },
                };
        }
    };

    const emptyState = getEmptyStateInfo();

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <MaterialIcons
                    name={emptyState.icon as any}
                    size={64}
                    color={theme.colors.text.tertiary}
                />
            </View>

            <Text style={styles.title}>{emptyState.title}</Text>
            <Text style={styles.subtitle}>{emptyState.subtitle}</Text>

            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={emptyState.primaryAction.onPress}
                    activeOpacity={0.7}
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
                        style={styles.secondaryButton}
                        onPress={emptyState.secondaryAction.onPress}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons
                            name={emptyState.secondaryAction.icon as any}
                            size={20}
                            color={theme.colors.primary}
                        />
                        <Text style={styles.secondaryButtonText}>
                            {emptyState.secondaryAction.text}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Tips for new users */}
            {filter === 'all' && (
                <View style={styles.tipsContainer}>
                    <Text style={styles.tipsTitle}>💡 How to book:</Text>
                    <View style={styles.tipItem}>
                        <Text style={styles.tipNumber}>1</Text>
                        <Text style={styles.tipText}>Choose your departure station</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Text style={styles.tipNumber}>2</Text>
                        <Text style={styles.tipText}>Select your destination</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Text style={styles.tipNumber}>3</Text>
                        <Text style={styles.tipText}>Pick an available trip and book</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Text style={styles.tipNumber}>4</Text>
                        <Text style={styles.tipText}>Complete payment and you're set!</Text>
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
        paddingTop: theme.spacing.huge * 2,
    },

    iconContainer: {
        marginBottom: theme.spacing.xl,
    },

    title: {
        ...theme.typography.heading2,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },

    subtitle: {
        ...theme.typography.body1,
        color: theme.colors.text.tertiary,
        textAlign: 'center',
        lineHeight: theme.typography.lineHeight.relaxed,
        marginBottom: theme.spacing.xxxl,
    },

    actionsContainer: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing.md,
    },

    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.button.primary,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.button,
        ...theme.shadows.button,
        minWidth: 200,
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
        borderColor: theme.colors.border.primary,
        minWidth: 180,
        justifyContent: 'center',
    },

    secondaryButtonText: {
        ...theme.typography.buttonMedium,
        color: theme.colors.primary,
        marginLeft: theme.spacing.sm,
    },

    tipsContainer: {
        marginTop: theme.spacing.huge,
        backgroundColor: theme.colors.background.accent,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.card,
        width: '100%',
    },

    tipsTitle: {
        ...theme.typography.subtitle1,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },

    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },

    tipNumber: {
        ...theme.typography.body2,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary,
        backgroundColor: theme.colors.background.secondary,
        width: 24,
        height: 24,
        borderRadius: 12,
        textAlign: 'center',
        lineHeight: 24,
        marginRight: theme.spacing.md,
    },

    tipText: {
        ...theme.typography.body2,
        color: theme.colors.text.secondary,
        flex: 1,
    },
});