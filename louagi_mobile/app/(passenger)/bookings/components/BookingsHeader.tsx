// app/(passenger)/bookings/components/BookingsHeader.tsx - Header Component
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../../../src/styles/theme';
import { BookingStats } from '../types/booking.types';

interface BookingsHeaderProps {
    stats: BookingStats;
    onCreateBooking: () => void;
}

export default function BookingsHeader({ stats, onCreateBooking }: BookingsHeaderProps) {
    return (
        <View style={styles.container}>
            <View style={styles.headerContent}>
                <Text style={styles.title}>My Bookings</Text>
                <Text style={styles.subtitle}>
                    {stats.total} booking{stats.total !== 1 ? 's' : ''} total
                </Text>
            </View>

            <TouchableOpacity
                style={styles.createButton}
                onPress={onCreateBooking}
                activeOpacity={0.7}
            >
                <MaterialIcons name="add" size={20} color="white" />
                <Text style={styles.createButtonText}>New</Text>
            </TouchableOpacity>

            {/* Quick Stats */}
            {stats.total > 0 && (
                <View style={styles.statsContainer}>
                    {stats.pending > 0 && (
                        <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: theme.colors.status.pending }]} />
                            <Text style={styles.statText}>{stats.pending} pending</Text>
                        </View>
                    )}

                    {stats.confirmed > 0 && (
                        <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: theme.colors.status.confirmed }]} />
                            <Text style={styles.statText}>{stats.confirmed} confirmed</Text>
                        </View>
                    )}

                    {stats.completed > 0 && (
                        <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: theme.colors.status.completed }]} />
                            <Text style={styles.statText}>{stats.completed} completed</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.background.secondary,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.header.paddingTop,
        paddingBottom: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
        ...theme.shadows.header,
    },

    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },

    title: {
        ...theme.typography.heading1,
        flex: 1,
    },

    subtitle: {
        ...theme.typography.subtitle1,
        marginTop: theme.spacing.xs,
    },

    createButton: {
        position: 'absolute',
        top: theme.spacing.header.paddingTop,
        right: theme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.button.primary,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.button,
        ...theme.shadows.button,
    },

    createButtonText: {
        ...theme.typography.buttonSmall,
        marginLeft: theme.spacing.xs,
    },

    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.lg,
        marginTop: theme.spacing.sm,
    },

    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    statDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: theme.spacing.xs,
    },

    statText: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.medium,
    },
});