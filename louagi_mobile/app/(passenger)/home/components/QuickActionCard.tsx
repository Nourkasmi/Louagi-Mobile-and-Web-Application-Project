// app/(passenger)/home/components/QuickActionCard.tsx 
import React, { useState } from 'react';
import {
    TouchableOpacity,
    Text,
    View,
    Animated,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DESIGN_TOKENS } from '../index.styles';

const { width } = Dimensions.get('window');

export interface QuickAction {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    onPress: () => void;
    badge?: number;
    disabled?: boolean;
    featured?: boolean;
    gradient?: string[];
}

interface QuickActionCardProps {
    action: QuickAction;
    index: number;
    style?: any;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
    action,
    index,
    style,
}) => {
    const [scaleValue] = useState(new Animated.Value(1));
    const [pressed, setPressed] = useState(false);

    const handlePressIn = () => {
        setPressed(true);
        Animated.spring(scaleValue, {
            toValue: 0.95,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
        }).start();
    };

    const handlePressOut = () => {
        setPressed(false);
        Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
        }).start();
    };

    const handlePress = () => {
        if (!action.disabled) {
            action.onPress();
        }
    };

    const cardStyles = [
        styles.card,
        action.featured ? styles.featuredCard : styles.regularCard,
        { borderLeftColor: action.color },
        action.disabled && styles.disabledCard,
        style,
    ];

    const iconBackgroundColor = action.featured
        ? 'rgba(255, 255, 255, 0.2)'
        : action.color;

    return (
        <Animated.View
            style={[
                cardStyles,
                {
                    transform: [{ scale: scaleValue }],
                    opacity: action.disabled ? 0.6 : 1,
                }
            ]}
        >
            <TouchableOpacity
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={action.disabled}
                activeOpacity={1}
                style={styles.touchableContent}
            >
                {/* Header with Icon and Badge */}
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
                        <MaterialIcons
                            name={action.icon as any}
                            size={action.featured ? 28 : 24}
                            color={action.featured ? action.color : 'white'}
                        />
                    </View>

                    {action.badge && action.badge > 0 && (
                        <Animated.View
                            style={[
                                styles.badge,
                                {
                                    transform: [{
                                        scale: pressed ? 0.9 : 1
                                    }]
                                }
                            ]}
                        >
                            <Text style={styles.badgeText}>
                                {action.badge > 99 ? '99+' : action.badge}
                            </Text>
                        </Animated.View>
                    )}
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={[
                        styles.title,
                        action.featured && styles.featuredTitle,
                        action.disabled && styles.disabledText
                    ]}>
                        {action.title}
                    </Text>

                    <Text style={[
                        styles.subtitle,
                        action.featured && styles.featuredSubtitle,
                        action.disabled && styles.disabledText
                    ]}>
                        {action.subtitle}
                    </Text>
                </View>

                {/* Featured card additional content */}
                {action.featured && (
                    <View style={styles.featuredFooter}>
                        <Text style={styles.featuredCta}>Tap to start</Text>
                        <MaterialIcons name="arrow-forward" size={16} color="rgba(255, 255, 255, 0.8)" />
                    </View>
                )}

                {/* Disabled overlay */}
                {action.disabled && (
                    <View style={styles.disabledOverlay}>
                        <MaterialIcons name="lock" size={20} color={DESIGN_TOKENS.colors.text.tertiary} />
                        <Text style={styles.disabledLabel}>Coming Soon</Text>
                    </View>
                )}

                {/* Pulse animation for high priority actions */}
                {action.badge && action.badge > 0 && !action.disabled && (
                    <Animated.View
                        style={[
                            styles.pulseOverlay,
                            {
                                opacity: scaleValue.interpolate({
                                    inputRange: [0.95, 1],
                                    outputRange: [0.2, 0],
                                })
                            }
                        ]}
                    />
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

// Quick Actions Grid Component
interface QuickActionsGridProps {
    actions: QuickAction[];
    columns?: number;
    onActionPress?: (action: QuickAction) => void;
}

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({
    actions,
    columns = 2,
    onActionPress,
}) => {
    const cardWidth = (width - (DESIGN_TOKENS.spacing.xl * 2) - (DESIGN_TOKENS.spacing.lg * (columns - 1))) / columns;

    return (
        <View style={styles.grid}>
            {actions.map((action, index) => {
                // Featured actions take full width
                const isFullWidth = action.featured;
                const cardStyle = {
                    width: isFullWidth ? '100%' : cardWidth,
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                };

                return (
                    <QuickActionCard
                        key={action.id}
                        action={{
                            ...action,
                            onPress: () => {
                                action.onPress();
                                onActionPress?.(action);
                            }
                        }}
                        index={index}
                        style={cardStyle}
                    />
                );
            })}
        </View>
    );
};

// Quick Action Factory - helps create common action types
export const createQuickAction = {
    // Primary actions
    bookTrip: (onPress: () => void): QuickAction => ({
        id: 'book-trip',
        title: 'Book New Trip',
        subtitle: 'Find your next ride',
        icon: 'search',
        color: DESIGN_TOKENS.colors.primary,
        onPress,
        featured: true,
    }),

    myTrips: (onPress: () => void, pendingCount?: number): QuickAction => ({
        id: 'my-trips',
        title: 'My Trips',
        subtitle: 'View bookings',
        icon: 'confirmation-number',
        color: DESIGN_TOKENS.colors.secondary,
        onPress,
        badge: pendingCount,
    }),

    // Support actions
    support: (onPress: () => void): QuickAction => ({
        id: 'support',
        title: 'Get Help',
        subtitle: '24/7 support',
        icon: 'help-outline',
        color: DESIGN_TOKENS.colors.accent,
        onPress,
    }),

    profile: (onPress: () => void): QuickAction => ({
        id: 'profile',
        title: 'Profile',
        subtitle: 'Account settings',
        icon: 'person',
        color: DESIGN_TOKENS.colors.text.secondary,
        onPress,
    }),

    // Feature actions
    rewards: (onPress: () => void, disabled = true): QuickAction => ({
        id: 'rewards',
        title: 'Rewards',
        subtitle: 'Earn points',
        icon: 'star',
        color: '#ffc107',
        onPress,
        disabled,
    }),

    referral: (onPress: () => void): QuickAction => ({
        id: 'referral',
        title: 'Invite Friends',
        subtitle: 'Get $10 credit',
        icon: 'person-add',
        color: '#e91e63',
        onPress,
    }),

    // Emergency actions
    emergency: (onPress: () => void): QuickAction => ({
        id: 'emergency',
        title: 'Emergency',
        subtitle: 'Quick assistance',
        icon: 'warning',
        color: DESIGN_TOKENS.colors.status.error,
        onPress,
    }),
};

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: DESIGN_TOKENS.spacing.lg,
    },

    card: {
        borderRadius: DESIGN_TOKENS.borderRadius.large,
        borderLeftWidth: 4,
        overflow: 'hidden',
        position: 'relative',
    },

    regularCard: {
        backgroundColor: DESIGN_TOKENS.colors.surface,
        minHeight: 130,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    featuredCard: {
        backgroundColor: DESIGN_TOKENS.colors.primary,
        minHeight: 160,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },

    disabledCard: {
        backgroundColor: '#f5f5f5',
    },

    touchableContent: {
        flex: 1,
        padding: DESIGN_TOKENS.spacing.xl,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: DESIGN_TOKENS.spacing.md,
    },

    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },

    badge: {
        backgroundColor: DESIGN_TOKENS.colors.status.error,
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: -8,
        right: -8,
        borderWidth: 2,
        borderColor: DESIGN_TOKENS.colors.surface,
    },

    badgeText: {
        fontSize: 11,
        fontWeight: DESIGN_TOKENS.typography.weights.bold,
        color: DESIGN_TOKENS.colors.text.inverse,
    },

    content: {
        flex: 1,
        justifyContent: 'center',
    },

    title: {
        fontSize: DESIGN_TOKENS.typography.sizes.body1,
        fontWeight: DESIGN_TOKENS.typography.weights.semiBold,
        color: DESIGN_TOKENS.colors.text.primary,
        marginBottom: DESIGN_TOKENS.spacing.xs,
        lineHeight: 20,
    },

    featuredTitle: {
        color: DESIGN_TOKENS.colors.text.inverse,
        fontSize: DESIGN_TOKENS.typography.sizes.subtitle2,
    },

    subtitle: {
        fontSize: DESIGN_TOKENS.typography.sizes.caption,
        color: DESIGN_TOKENS.colors.text.secondary,
        lineHeight: 16,
        fontWeight: DESIGN_TOKENS.typography.weights.medium,
    },

    featuredSubtitle: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: DESIGN_TOKENS.typography.sizes.body2,
    },

    featuredFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: DESIGN_TOKENS.spacing.md,
        paddingTop: DESIGN_TOKENS.spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.2)',
        gap: DESIGN_TOKENS.spacing.sm,
    },

    featuredCta: {
        fontSize: DESIGN_TOKENS.typography.sizes.body2,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: DESIGN_TOKENS.typography.weights.semiBold,
    },

    disabledOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: DESIGN_TOKENS.spacing.sm,
    },

    disabledText: {
        color: DESIGN_TOKENS.colors.text.tertiary,
    },

    disabledLabel: {
        fontSize: DESIGN_TOKENS.typography.sizes.caption,
        color: DESIGN_TOKENS.colors.text.tertiary,
        fontWeight: DESIGN_TOKENS.typography.weights.semiBold,
    },

    pulseOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: DESIGN_TOKENS.colors.primary,
        borderRadius: DESIGN_TOKENS.borderRadius.large,
    },
});

export default QuickActionCard;