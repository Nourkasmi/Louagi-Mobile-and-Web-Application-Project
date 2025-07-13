// app/(passenger)/bookings/components/BookingsHeader.tsx - FIXED with Real Analytics
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

    // 🔧 FIXED: Calculate real analytics from actual data
    const getAnalytics = () => {
        const { total, pending, confirmed, completed, cancelled } = stats;

        // Active bookings (not completed or cancelled)
        const activeBookings = pending + confirmed;

        // Success rate (completed vs total attempted)
        const attempted = completed + cancelled;
        const successRate = attempted > 0 ? Math.round((completed / attempted) * 100) : 0;

        // Completion rate (completed vs all bookings)
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            activeBookings,
            successRate,
            completionRate,
            needsAttention: pending, // Bookings that need payment
        };
    };

    const analytics = getAnalytics();

    return (
        <View style={styles.container}>
            {/* Main Header */}
            <View style={styles.headerContent}>
                <View style={styles.titleSection}>
                    <Text style={styles.title}>My Bookings</Text>
                    <Text style={styles.subtitle}>
                        {stats.total === 0
                            ? 'No bookings yet'
                            : `${stats.total} booking${stats.total !== 1 ? 's' : ''} total`
                        }
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.createButton}
                    onPress={onCreateBooking}
                    activeOpacity={0.7}
                >
                    <MaterialIcons name="add" size={20} color="white" />
                    <Text style={styles.createButtonText}>Book Trip</Text>
                </TouchableOpacity>
            </View>

            {/* 🔧 FIXED: Real Analytics Dashboard */}
            {stats.total > 0 && (
                <View style={styles.analyticsContainer}>
                    <Text style={styles.analyticsTitle}>📊 Your Booking Analytics</Text>

                    <View style={styles.analyticsGrid}>
                        {/* Active Bookings */}
                        <View style={styles.analyticsCard}>
                            <View style={styles.analyticsCardHeader}>
                                <MaterialIcons name="schedule" size={20} color={theme.colors.status.pending} />
                                <Text style={styles.analyticsCardTitle}>Active</Text>
                            </View>
                            <Text style={styles.analyticsCardValue}>{analytics.activeBookings}</Text>
                            <Text style={styles.analyticsCardLabel}>
                                {analytics.activeBookings === 1 ? 'booking' : 'bookings'}
                            </Text>
                        </View>

                        {/* Completion Rate */}
                        <View style={styles.analyticsCard}>
                            <View style={styles.analyticsCardHeader}>
                                <MaterialIcons name="done-all" size={20} color={theme.colors.status.completed} />
                                <Text style={styles.analyticsCardTitle}>Completed</Text>
                            </View>
                            <Text style={styles.analyticsCardValue}>{analytics.completionRate}%</Text>
                            <Text style={styles.analyticsCardLabel}>completion rate</Text>
                        </View>

                        {/* Success Rate */}
                        <View style={styles.analyticsCard}>
                            <View style={styles.analyticsCardHeader}>
                                <MaterialIcons name="trending-up" size={20} color={theme.colors.status.confirmed} />
                                <Text style={styles.analyticsCardTitle}>Success</Text>
                            </View>
                            <Text style={styles.analyticsCardValue}>{analytics.successRate}%</Text>
                            <Text style={styles.analyticsCardLabel}>success rate</Text>
                        </View>
                    </View>

                    {/* Quick Stats Row */}
                    <View style={styles.quickStatsContainer}>
                        {stats.pending > 0 && (
                            <View style={styles.quickStatItem}>
                                <View style={[styles.quickStatDot, { backgroundColor: theme.colors.status.pending }]} />
                                <Text style={styles.quickStatText}>
                                    {stats.pending} need{stats.pending === 1 ? 's' : ''} payment
                                </Text>
                            </View>
                        )}

                        {stats.confirmed > 0 && (
                            <View style={styles.quickStatItem}>
                                <View style={[styles.quickStatDot, { backgroundColor: theme.colors.status.confirmed }]} />
                                <Text style={styles.quickStatText}>
                                    {stats.confirmed} confirmed trip{stats.confirmed === 1 ? '' : 's'}
                                </Text>
                            </View>
                        )}

                        {stats.completed > 0 && (
                            <View style={styles.quickStatItem}>
                                <View style={[styles.quickStatDot, { backgroundColor: theme.colors.status.completed }]} />
                                <Text style={styles.quickStatText}>
                                    {stats.completed} completed trip{stats.completed === 1 ? '' : 's'}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* 🔧 NEW: Attention Banner */}
                    {analytics.needsAttention > 0 && (
                        <View style={styles.attentionBanner}>
                            <MaterialIcons name="notification-important" size={16} color={theme.colors.warning} />
                            <Text style={styles.attentionText}>
                                {analytics.needsAttention} booking{analytics.needsAttention === 1 ? '' : 's'} need{analytics.needsAttention === 1 ? 's' : ''} your attention
                            </Text>
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
        marginBottom: theme.spacing.lg,
    },

    titleSection: {
        flex: 1,
    },

    title: {
        ...theme.typography.heading1,
    },

    subtitle: {
        ...theme.typography.subtitle1,
        marginTop: theme.spacing.xs,
    },

    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.button.primary,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.button,
        ...theme.shadows.button,
    },

    createButtonText: {
        ...theme.typography.buttonMedium,
        marginLeft: theme.spacing.xs,
    },

    // 🔧 NEW: Analytics container
    analyticsContainer: {
        backgroundColor: theme.colors.background.accent,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.card,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
    },

    analyticsTitle: {
        ...theme.typography.subtitle1,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },

    // Analytics grid
    analyticsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.lg,
        gap: theme.spacing.sm,
    },

    analyticsCard: {
        flex: 1,
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.medium,
        alignItems: 'center',
        ...theme.shadows.light,
    },

    analyticsCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },

    analyticsCardTitle: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.secondary,
        marginLeft: theme.spacing.xs,
    },

    analyticsCardValue: {
        ...theme.typography.heading2,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },

    analyticsCardLabel: {
        ...theme.typography.caption,
        color: theme.colors.text.tertiary,
        textAlign: 'center',
    },

    // Quick stats
    quickStatsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },

    quickStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    quickStatDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: theme.spacing.xs,
    },

    quickStatText: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.medium,
    },

    // 🔧 NEW: Attention banner
    attentionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.warning,
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.small,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.warning,
    },

    attentionText: {
        ...theme.typography.caption,
        color: theme.colors.text.warning,
        fontWeight: theme.typography.fontWeight.medium,
        marginLeft: theme.spacing.xs,
        flex: 1,
    },
});