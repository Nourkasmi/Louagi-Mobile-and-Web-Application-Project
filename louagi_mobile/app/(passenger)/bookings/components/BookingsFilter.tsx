// app/(passenger)/bookings/components/BookingsFilter.tsx - FIXED Filter with Working Logic
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { theme } from '../../../../src/styles/theme';
import { BookingStatus, BookingStats } from '../types/booking.types';

interface BookingsFilterProps {
    selectedFilter: BookingStatus | 'all';
    onFilterChange: (filter: BookingStatus | 'all') => void;
    stats: BookingStats;
}

// 🔧 FIXED: Updated filter options with real status mapping
const FILTER_OPTIONS: Array<{
    key: BookingStatus | 'all';
    label: string;
    color: string;
    getCount: (stats: BookingStats) => number;
    description: string;
}> = [
        {
            key: 'all',
            label: 'All',
            color: theme.colors.button.primary,
            getCount: (stats) => stats.total,
            description: 'All bookings'
        },
        {
            key: 'pending',
            label: 'Pending',
            color: theme.colors.status.pending,
            getCount: (stats) => stats.pending,
            description: 'Needs payment or confirmation'
        },
        {
            key: 'confirmed',
            label: 'Confirmed',
            color: theme.colors.status.confirmed,
            getCount: (stats) => stats.confirmed,
            description: 'Paid and confirmed'
        },
        {
            key: 'completed',
            label: 'Completed',
            color: theme.colors.status.completed,
            getCount: (stats) => stats.completed,
            description: 'Trip finished'
        },
        {
            key: 'cancelled',
            label: 'Cancelled',
            color: theme.colors.status.cancelled,
            getCount: (stats) => stats.cancelled,
            description: 'Cancelled bookings'
        },
    ];

export default function BookingsFilter({ selectedFilter, onFilterChange, stats }: BookingsFilterProps) {

    // 🔧 FIXED: Handle filter change with validation
    const handleFilterChange = (filter: BookingStatus | 'all') => {
        console.log(`🔍 Filter changed from ${selectedFilter} to ${filter}`);
        onFilterChange(filter);
    };

    return (
        <View style={styles.container}>
            {/* 🔧 NEW: Filter header with total count */}
            <View style={styles.filterHeader}>
                <Text style={styles.filterHeaderText}>
                    Filter Bookings ({stats.total} total)
                </Text>
                {selectedFilter !== 'all' && (
                    <TouchableOpacity
                        style={styles.clearFilterButton}
                        onPress={() => handleFilterChange('all')}
                    >
                        <Text style={styles.clearFilterText}>Clear</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContainer}
            >
                {FILTER_OPTIONS.map((option) => {
                    const isSelected = selectedFilter === option.key;
                    const count = option.getCount(stats);
                    const hasBookings = count > 0;

                    return (
                        <TouchableOpacity
                            key={option.key}
                            style={[
                                styles.filterButton,
                                isSelected && styles.filterButtonSelected,
                                { borderColor: option.color },
                                isSelected && { backgroundColor: option.color },
                                !hasBookings && !isSelected && styles.filterButtonDisabled
                            ]}
                            onPress={() => handleFilterChange(option.key)}
                            activeOpacity={0.7}
                            disabled={!hasBookings && option.key !== 'all'}
                        >
                            <View style={styles.filterContent}>
                                <Text
                                    style={[
                                        styles.filterText,
                                        isSelected && styles.filterTextSelected,
                                        !isSelected && { color: option.color },
                                        !hasBookings && !isSelected && styles.filterTextDisabled
                                    ]}
                                >
                                    {option.label}
                                </Text>

                                {/* 🔧 FIXED: Always show count, even if 0 */}
                                <View
                                    style={[
                                        styles.countBadge,
                                        isSelected ? styles.countBadgeSelected : { backgroundColor: option.color },
                                        !hasBookings && !isSelected && styles.countBadgeDisabled
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.countText,
                                            isSelected && styles.countTextSelected,
                                            !hasBookings && !isSelected && styles.countTextDisabled
                                        ]}
                                    >
                                        {count}
                                    </Text>
                                </View>
                            </View>

                            {/* 🔧 NEW: Show description on long press */}
                            {isSelected && (
                                <Text style={styles.filterDescription}>
                                    {option.description}
                                </Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* 🔧 NEW: Active filter indicator */}
            {selectedFilter !== 'all' && (
                <View style={styles.activeFilterIndicator}>
                    <Text style={styles.activeFilterText}>
                        Showing {stats[selectedFilter]} {selectedFilter} booking{stats[selectedFilter] !== 1 ? 's' : ''}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.background.secondary,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
    },

    // 🔧 NEW: Filter header styles
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
    },

    filterHeaderText: {
        ...theme.typography.body2,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },

    clearFilterButton: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: theme.borderRadius.small,
    },

    clearFilterText: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.medium,
    },

    filtersContainer: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        gap: theme.spacing.sm,
    },

    filterButton: {
        borderRadius: theme.borderRadius.button,
        borderWidth: 1,
        backgroundColor: theme.colors.background.secondary,
        minHeight: 44, // Minimum touch target
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        justifyContent: 'center',
    },

    filterButtonSelected: {
        backgroundColor: theme.colors.button.primary,
    },

    // 🔧 NEW: Disabled filter styles
    filterButtonDisabled: {
        opacity: 0.5,
        backgroundColor: theme.colors.background.tertiary,
    },

    // 🔧 NEW: Filter content container
    filterContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    filterText: {
        ...theme.typography.body2,
        fontWeight: theme.typography.fontWeight.medium,
    },

    filterTextSelected: {
        color: theme.colors.text.white,
    },

    filterTextDisabled: {
        color: theme.colors.text.tertiary,
    },

    countBadge: {
        marginLeft: theme.spacing.xs,
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.badge,
        minWidth: 20,
        alignItems: 'center',
    },

    countBadgeSelected: {
        backgroundColor: theme.colors.background.secondary,
    },

    countBadgeDisabled: {
        backgroundColor: theme.colors.background.tertiary,
    },

    countText: {
        ...theme.typography.caption,
        color: theme.colors.text.white,
        fontWeight: theme.typography.fontWeight.semiBold,
        fontSize: 11,
    },

    countTextSelected: {
        color: theme.colors.text.primary,
    },

    countTextDisabled: {
        color: theme.colors.text.tertiary,
    },

    // 🔧 NEW: Filter description
    filterDescription: {
        ...theme.typography.caption,
        color: theme.colors.text.white,
        marginTop: theme.spacing.xs,
        textAlign: 'center',
        fontSize: 10,
    },

    // 🔧 NEW: Active filter indicator
    activeFilterIndicator: {
        backgroundColor: theme.colors.background.accent,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.light,
    },

    activeFilterText: {
        ...theme.typography.caption,
        color: theme.colors.text.info,
        fontWeight: theme.typography.fontWeight.medium,
        textAlign: 'center',
    },
});