// app/(passenger)/bookings/components/BookingsFilter.tsx - Filter Component
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { theme } from '../../../../src/styles/theme';
import { BookingStatus, BookingStats } from '../types/booking.types';

interface BookingsFilterProps {
    selectedFilter: BookingStatus | 'all';
    onFilterChange: (filter: BookingStatus | 'all') => void;
    stats: BookingStats;
}

const FILTER_OPTIONS: Array<{
    key: BookingStatus | 'all';
    label: string;
    color: string;
    getCount: (stats: BookingStats) => number;
}> = [
        {
            key: 'all',
            label: 'All',
            color: theme.colors.button.primary,
            getCount: (stats) => stats.total,
        },
        {
            key: 'pending',
            label: 'Pending',
            color: theme.colors.status.pending,
            getCount: (stats) => stats.pending,
        },
        {
            key: 'confirmed',
            label: 'Confirmed',
            color: theme.colors.status.confirmed,
            getCount: (stats) => stats.confirmed,
        },
        {
            key: 'completed',
            label: 'Completed',
            color: theme.colors.status.completed,
            getCount: (stats) => stats.completed,
        },
        {
            key: 'cancelled',
            label: 'Cancelled',
            color: theme.colors.status.cancelled,
            getCount: (stats) => stats.cancelled,
        },
    ];

export default function BookingsFilter({ selectedFilter, onFilterChange, stats }: BookingsFilterProps) {
    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContainer}
            >
                {FILTER_OPTIONS.map((option) => {
                    const isSelected = selectedFilter === option.key;
                    const count = option.getCount(stats);

                    return (
                        <TouchableOpacity
                            key={option.key}
                            style={[
                                styles.filterButton,
                                isSelected && styles.filterButtonSelected,
                                { borderColor: option.color },
                                isSelected && { backgroundColor: option.color }
                            ]}
                            onPress={() => onFilterChange(option.key)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    isSelected && styles.filterTextSelected,
                                    !isSelected && { color: option.color }
                                ]}
                            >
                                {option.label}
                            </Text>

                            {count > 0 && (
                                <View
                                    style={[
                                        styles.countBadge,
                                        isSelected ? styles.countBadgeSelected : { backgroundColor: option.color }
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.countText,
                                            isSelected && styles.countTextSelected
                                        ]}
                                    >
                                        {count}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.background.secondary,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
    },

    filtersContainer: {
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.sm,
    },

    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.button,
        borderWidth: 1,
        backgroundColor: theme.colors.background.secondary,
        minHeight: 36,
    },

    filterButtonSelected: {
        backgroundColor: theme.colors.button.primary,
    },

    filterText: {
        ...theme.typography.body2,
        fontWeight: theme.typography.fontWeight.medium,
    },

    filterTextSelected: {
        color: theme.colors.text.white,
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

    countText: {
        ...theme.typography.caption,
        color: theme.colors.text.white,
        fontWeight: theme.typography.fontWeight.semiBold,
        fontSize: 11,
    },

    countTextSelected: {
        color: theme.colors.text.primary,
    },
});