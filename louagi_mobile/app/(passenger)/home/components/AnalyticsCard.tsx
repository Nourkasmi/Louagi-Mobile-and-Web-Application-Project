// app/(passenger)/home/components/AnalyticsCard.tsx - Enhanced Analytics Component
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    Dimensions,
    StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DESIGN_TOKENS } from '../index.styles';

const { width } = Dimensions.get('window');

interface AnalyticsData {
    totalTrips: number;
    completedTrips: number;
    totalSpent: number;
    averagePerTrip: number;
    co2Saved: number;
    timesSaved: number;
    successRate: number;
    favoriteRoute: string;
    monthlySpending: Array<{ month: string; amount: number }>;
}

interface AnalyticsCardProps {
    data: AnalyticsData;
    onViewDetails?: () => void;
    isNewUser?: boolean;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
    data,
    onViewDetails,
    isNewUser = false,
}) => {
    const [animatedValue] = useState(new Animated.Value(0));
    const [expandedView, setExpandedView] = useState(false);

    useEffect(() => {
        Animated.spring(animatedValue, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
        }).start();
    }, []);

    const toggleExpanded = () => {
        setExpandedView(!expandedView);
    };

    const getImpactMessage = () => {
        if (isNewUser) {
            return "Start your sustainable journey with Louagi!";
        }

        if (data.totalTrips === 0) {
            return "No trips yet - book your first eco-friendly ride!";
        }

        if (data.co2Saved > 10) {
            return `Amazing! You've saved ${data.co2Saved.toFixed(1)}kg of CO₂ 🌱`;
        }

        if (data.co2Saved > 5) {
            return `Great work! ${data.co2Saved.toFixed(1)}kg CO₂ saved 🌿`;
        }

        return `Good start! ${data.co2Saved.toFixed(1)}kg CO₂ saved ♻️`;
    };

    const getProgressColor = () => {
        if (isNewUser || data.totalTrips === 0) return DESIGN_TOKENS.colors.text.tertiary;
        if (data.successRate >= 90) return DESIGN_TOKENS.colors.status.success;
        if (data.successRate >= 75) return DESIGN_TOKENS.colors.status.info;
        if (data.successRate >= 60) return DESIGN_TOKENS.colors.status.warning;
        return DESIGN_TOKENS.colors.status.error;
    };

    const renderProgressBar = (value: number, maxValue: number, color: string) => (
        <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
                <Animated.View
                    style={[
                        styles.progressBarFill,
                        {
                            width: `${(value / maxValue) * 100}%`,
                            backgroundColor: color,
                            transform: [{
                                scaleX: animatedValue.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 1],
                                })
                            }]
                        }
                    ]}
                />
            </View>
        </View>
    );

    const renderStatItem = (
        icon: string,
        value: string | number,
        label: string,
        color: string = DESIGN_TOKENS.colors.primary,
        subtitle?: string
    ) => (
        <Animated.View
            style={[
                styles.statItem,
                {
                    opacity: animatedValue,
                    transform: [{
                        translateY: animatedValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                        })
                    }]
                }
            ]}
        >
            <View style={[styles.statIcon, { backgroundColor: color }]}>
                <MaterialIcons name={icon as any} size={24} color="white" />
            </View>
            <View style={styles.statContent}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
                {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
            </View>
        </Animated.View>
    );

    const renderDetailedView = () => (
        <Animated.View
            style={[
                styles.detailedView,
                {
                    opacity: expandedView ? 1 : 0,
                    height: expandedView ? 'auto' : 0,
                }
            ]}
        >
            <View style={styles.detailsGrid}>
                {renderStatItem(
                    'trending-up',
                    `${data.successRate.toFixed(0)}%`,
                    'Success Rate',
                    getProgressColor()
                )}

                {renderStatItem(
                    'attach-money',
                    `$${data.averagePerTrip.toFixed(0)}`,
                    'Avg per Trip',
                    DESIGN_TOKENS.colors.status.info
                )}

                {renderStatItem(
                    'place',
                    data.favoriteRoute.split(' → ')[0] || 'None',
                    'Favorite Station',
                    DESIGN_TOKENS.colors.accent
                )}

                {renderStatItem(
                    'savings',
                    `$${(data.totalSpent * 0.4).toFixed(0)}`,
                    'Money Saved',
                    DESIGN_TOKENS.colors.status.success,
                    'vs traditional transport'
                )}
            </View>

            {/* Monthly Spending Chart Placeholder */}
            {data.monthlySpending.length > 0 && (
                <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>Monthly Spending Trend</Text>
                    <View style={styles.chartBars}>
                        {data.monthlySpending.slice(-6).map((month, index) => {
                            const maxAmount = Math.max(...data.monthlySpending.map(m => m.amount));
                            const height = (month.amount / maxAmount) * 60;

                            return (
                                <View key={month.month} style={styles.chartBarContainer}>
                                    <Animated.View
                                        style={[
                                            styles.chartBar,
                                            {
                                                height: height,
                                                backgroundColor: DESIGN_TOKENS.colors.primary,
                                                transform: [{
                                                    scaleY: animatedValue.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [0, 1],
                                                    })
                                                }]
                                            }
                                        ]}
                                    />
                                    <Text style={styles.chartLabel}>
                                        {month.month.split(' ')[0]}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}
        </Animated.View>
    );

    if (isNewUser) {
        return (
            <Animated.View
                style={[
                    styles.container,
                    styles.newUserContainer,
                    {
                        opacity: animatedValue,
                        transform: [{
                            translateY: animatedValue.interpolate({
                                inputRange: [0, 1],
                                outputRange: [30, 0],
                            })
                        }]
                    }
                ]}
            >
                <View style={styles.newUserHeader}>
                    <MaterialIcons name="eco" size={32} color={DESIGN_TOKENS.colors.status.success} />
                    <View style={styles.newUserContent}>
                        <Text style={styles.newUserTitle}>Start Your Impact Journey! 🌱</Text>
                        <Text style={styles.newUserSubtitle}>
                            Join thousands of eco-conscious travelers saving money and the planet
                        </Text>
                    </View>
                </View>

                <View style={styles.newUserFeatures}>
                    <View style={styles.featureItem}>
                        <MaterialIcons name="savings" size={20} color={DESIGN_TOKENS.colors.status.success} />
                        <Text style={styles.featureText}>Save up to 60% on transport costs</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <MaterialIcons name="eco" size={20} color={DESIGN_TOKENS.colors.status.success} />
                        <Text style={styles.featureText}>Reduce your carbon footprint</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <MaterialIcons name="people" size={20} color={DESIGN_TOKENS.colors.status.success} />
                        <Text style={styles.featureText}>Meet like-minded travelers</Text>
                    </View>
                </View>
            </Animated.View>
        );
    }

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: animatedValue,
                    transform: [{
                        translateY: animatedValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [30, 0],
                        })
                    }]
                }
            ]}
        >
            {/* Main Impact Header */}
            <View style={styles.header}>
                <View style={styles.impactIcon}>
                    <MaterialIcons name="eco" size={28} color={DESIGN_TOKENS.colors.status.success} />
                </View>
                <View style={styles.headerContent}>
                    <Text style={styles.impactTitle}>Your Environmental Impact</Text>
                    <Text style={styles.impactMessage}>{getImpactMessage()}</Text>
                </View>
                <TouchableOpacity
                    style={styles.expandButton}
                    onPress={toggleExpanded}
                >
                    <MaterialIcons
                        name={expandedView ? "expand-less" : "expand-more"}
                        size={24}
                        color={DESIGN_TOKENS.colors.text.secondary}
                    />
                </TouchableOpacity>
            </View>

            {/* Key Metrics */}
            <View style={styles.metricsContainer}>
                <View style={styles.metricItem}>
                    <Text style={styles.metricValue}>{data.co2Saved.toFixed(1)}kg</Text>
                    <Text style={styles.metricLabel}>CO₂ Saved</Text>
                    {renderProgressBar(data.co2Saved, 50, DESIGN_TOKENS.colors.status.success)}
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricItem}>
                    <Text style={styles.metricValue}>{data.timesSaved.toFixed(0)}h</Text>
                    <Text style={styles.metricLabel}>Time Saved</Text>
                    {renderProgressBar(data.timesSaved, 100, DESIGN_TOKENS.colors.status.info)}
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricItem}>
                    <Text style={styles.metricValue}>{data.totalTrips}</Text>
                    <Text style={styles.metricLabel}>Eco Trips</Text>
                    {renderProgressBar(data.totalTrips, 50, DESIGN_TOKENS.colors.primary)}
                </View>
            </View>

            {/* Detailed View */}
            {renderDetailedView()}

            {/* View More Button */}
            {onViewDetails && (
                <TouchableOpacity
                    style={styles.viewMoreButton}
                    onPress={onViewDetails}
                >
                    <Text style={styles.viewMoreText}>View Detailed Analytics</Text>
                    <MaterialIcons name="arrow-forward" size={16} color={DESIGN_TOKENS.colors.primary} />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: DESIGN_TOKENS.colors.surface,
        borderRadius: DESIGN_TOKENS.borderRadius.large,
        padding: DESIGN_TOKENS.spacing.xl,
        marginBottom: DESIGN_TOKENS.spacing.lg,
        borderLeftWidth: 4,
        borderLeftColor: DESIGN_TOKENS.colors.status.success,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    newUserContainer: {
        borderLeftColor: DESIGN_TOKENS.colors.primary,
        backgroundColor: 'linear-gradient(135deg, #f8f9ff 0%, #e8f4fd 100%)',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: DESIGN_TOKENS.spacing.lg,
    },

    impactIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: DESIGN_TOKENS.spacing.md,
    },

    headerContent: {
        flex: 1,
    },

    impactTitle: {
        fontSize: DESIGN_TOKENS.typography.sizes.subtitle2,
        fontWeight: DESIGN_TOKENS.typography.weights.bold,
        color: DESIGN_TOKENS.colors.text.primary,
        marginBottom: DESIGN_TOKENS.spacing.xs,
    },

    impactMessage: {
        fontSize: DESIGN_TOKENS.typography.sizes.body2,
        color: DESIGN_TOKENS.colors.text.secondary,
        fontWeight: DESIGN_TOKENS.typography.weights.medium,
    },

    expandButton: {
        padding: DESIGN_TOKENS.spacing.sm,
        borderRadius: DESIGN_TOKENS.borderRadius.round,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },

    metricsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: DESIGN_TOKENS.spacing.lg,
        borderRadius: DESIGN_TOKENS.borderRadius.medium,
        marginBottom: DESIGN_TOKENS.spacing.md,
    },

    metricItem: {
        alignItems: 'center',
        flex: 1,
    },

    metricValue: {
        fontSize: DESIGN_TOKENS.typography.sizes.subtitle1,
        fontWeight: DESIGN_TOKENS.typography.weights.bold,
        color: DESIGN_TOKENS.colors.text.primary,
        marginBottom: DESIGN_TOKENS.spacing.xs,
    },

    metricLabel: {
        fontSize: DESIGN_TOKENS.typography.sizes.caption,
        color: DESIGN_TOKENS.colors.text.secondary,
        fontWeight: DESIGN_TOKENS.typography.weights.medium,
        textAlign: 'center',
        marginBottom: DESIGN_TOKENS.spacing.sm,
    },

    metricDivider: {
        width: 1,
        height: 40,
        backgroundColor: DESIGN_TOKENS.colors.text.tertiary,
        opacity: 0.3,
        marginHorizontal: DESIGN_TOKENS.spacing.md,
    },

    progressBarContainer: {
        width: '100%',
        alignItems: 'center',
    },

    progressBarBackground: {
        width: 60,
        height: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },

    progressBarFill: {
        height: '100%',
        borderRadius: 2,
    },

    detailedView: {
        overflow: 'hidden',
    },

    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: DESIGN_TOKENS.spacing.lg,
    },

    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '48%',
        marginBottom: DESIGN_TOKENS.spacing.md,
        backgroundColor: DESIGN_TOKENS.colors.surface,
        padding: DESIGN_TOKENS.spacing.md,
        borderRadius: DESIGN_TOKENS.borderRadius.medium,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },

    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: DESIGN_TOKENS.spacing.sm,
    },

    statContent: {
        flex: 1,
    },

    statValue: {
        fontSize: DESIGN_TOKENS.typography.sizes.body1,
        fontWeight: DESIGN_TOKENS.typography.weights.bold,
        color: DESIGN_TOKENS.colors.text.primary,
        marginBottom: 2,
    },

    statLabel: {
        fontSize: DESIGN_TOKENS.typography.sizes.caption,
        color: DESIGN_TOKENS.colors.text.secondary,
        fontWeight: DESIGN_TOKENS.typography.weights.medium,
    },

    statSubtitle: {
        fontSize: 10,
        color: DESIGN_TOKENS.colors.text.tertiary,
        fontWeight: DESIGN_TOKENS.typography.weights.medium,
        marginTop: 2,
    },

    chartContainer: {
        marginTop: DESIGN_TOKENS.spacing.lg,
        padding: DESIGN_TOKENS.spacing.md,
        backgroundColor: 'rgba(0, 102, 204, 0.05)',
        borderRadius: DESIGN_TOKENS.borderRadius.medium,
    },

    chartTitle: {
        fontSize: DESIGN_TOKENS.typography.sizes.body2,
        fontWeight: DESIGN_TOKENS.typography.weights.semiBold,
        color: DESIGN_TOKENS.colors.text.primary,
        marginBottom: DESIGN_TOKENS.spacing.md,
        textAlign: 'center',
    },

    chartBars: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 80,
    },

    chartBarContainer: {
        alignItems: 'center',
        flex: 1,
    },

    chartBar: {
        width: 20,
        borderRadius: 2,
        marginBottom: DESIGN_TOKENS.spacing.sm,
    },

    chartLabel: {
        fontSize: 10,
        color: DESIGN_TOKENS.colors.text.tertiary,
        fontWeight: DESIGN_TOKENS.typography.weights.medium,
    },

    viewMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: DESIGN_TOKENS.spacing.md,
        paddingHorizontal: DESIGN_TOKENS.spacing.lg,
        backgroundColor: 'rgba(0, 102, 204, 0.1)',
        borderRadius: DESIGN_TOKENS.borderRadius.medium,
        marginTop: DESIGN_TOKENS.spacing.md,
        gap: DESIGN_TOKENS.spacing.sm,
    },

    viewMoreText: {
        fontSize: DESIGN_TOKENS.typography.sizes.body2,
        color: DESIGN_TOKENS.colors.primary,
        fontWeight: DESIGN_TOKENS.typography.weights.semiBold,
    },

    // New User Specific Styles
    newUserHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: DESIGN_TOKENS.spacing.lg,
    },

    newUserContent: {
        marginLeft: DESIGN_TOKENS.spacing.md,
        flex: 1,
    },

    newUserTitle: {
        fontSize: DESIGN_TOKENS.typography.sizes.subtitle2,
        fontWeight: DESIGN_TOKENS.typography.weights.bold,
        color: DESIGN_TOKENS.colors.text.primary,
        marginBottom: DESIGN_TOKENS.spacing.xs,
    },

    newUserSubtitle: {
        fontSize: DESIGN_TOKENS.typography.sizes.body2,
        color: DESIGN_TOKENS.colors.text.secondary,
        lineHeight: 20,
        fontWeight: DESIGN_TOKENS.typography.weights.medium,
    },

    newUserFeatures: {
        gap: DESIGN_TOKENS.spacing.md,
    },

    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        padding: DESIGN_TOKENS.spacing.md,
        borderRadius: DESIGN_TOKENS.borderRadius.medium,
        gap: DESIGN_TOKENS.spacing.md,
    },

    featureText: {
        fontSize: DESIGN_TOKENS.typography.sizes.body2,
        color: DESIGN_TOKENS.colors.text.primary,
        fontWeight: DESIGN_TOKENS.typography.weights.medium,
        flex: 1,
    },
});

export default AnalyticsCard;