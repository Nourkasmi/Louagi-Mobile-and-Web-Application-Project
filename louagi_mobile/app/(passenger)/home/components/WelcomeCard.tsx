// app/(passenger)/home/components/WelcomeCard.tsx - Beautiful Welcome Card
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

const { width } = Dimensions.get('window');

interface WelcomeCardProps {
    onBookTrip: () => void;
    userName?: string;
}

export const WelcomeCard: React.FC<WelcomeCardProps> = ({
    onBookTrip,
    userName = 'Traveler'
}) => {
    const [animatedValue] = useState(new Animated.Value(0));
    const [pulseValue] = useState(new Animated.Value(1));

    useEffect(() => {
        // Entrance animation
        Animated.spring(animatedValue, {
            toValue: 1,
            tension: 80,
            friction: 8,
            useNativeDriver: true,
        }).start();

        // Pulse animation for the main button
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseValue, {
                    toValue: 1.05,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseValue, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulseAnimation.start();

        return () => pulseAnimation.stop();
    }, []);

    const renderFeature = (icon: string, text: string, color: string, delay: number) => (
        <Animated.View
            style={[
                styles.featureItem,
                {
                    opacity: animatedValue,
                    transform: [{
                        translateX: animatedValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-50, 0],
                        })
                    }]
                }
            ]}
        >
            <View style={[styles.featureIcon, { backgroundColor: color }]}>
                <MaterialIcons name={icon as any} size={20} color="white" />
            </View>
            <Text style={styles.featureText}>{text}</Text>
        </Animated.View>
    );

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
            {/* Background with subtle gradient */}
            <View style={styles.gradientBackground} />

            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.welcomeIconContainer}>
                    <MaterialIcons name="eco" size={32} color="#4CAF50" />
                    <View style={styles.sparkles}>
                        <Text style={styles.sparkle}>✨</Text>
                        <Text style={[styles.sparkle, styles.sparkle2]}>✨</Text>
                        <Text style={[styles.sparkle, styles.sparkle3]}>✨</Text>
                    </View>
                </View>
                <Text style={styles.welcomeTitle}>Welcome to Louagi!</Text>
                <Text style={styles.welcomeSubtitle}>
                    Hello {userName}! Ready to start your sustainable journey?
                </Text>
            </View>

            {/* Features Grid */}
            <View style={styles.featuresContainer}>
                {renderFeature('savings', 'Save up to 60%', '#FF9800', 0)}
                {renderFeature('eco', 'Go Green', '#4CAF50', 200)}
                {renderFeature('schedule', 'Flexible Times', '#2196F3', 400)}
            </View>

            {/* Stats Preview */}
            <View style={styles.statsPreview}>
                <Text style={styles.statsTitle}>Join thousands of eco-travelers</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>10K+</Text>
                        <Text style={styles.statLabel}>Happy Users</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>50K</Text>
                        <Text style={styles.statLabel}>Trips Completed</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>2.5T</Text>
                        <Text style={styles.statLabel}>CO₂ Saved</Text>
                    </View>
                </View>
            </View>

            {/* Main Action Button */}
            <Animated.View
                style={[
                    styles.actionContainer,
                    {
                        transform: [{ scale: pulseValue }]
                    }
                ]}
            >
                <TouchableOpacity
                    style={styles.mainButton}
                    onPress={onBookTrip}
                    activeOpacity={0.9}
                >
                    <View style={styles.buttonGradient}>
                        <MaterialIcons name="search" size={24} color="white" />
                        <Text style={styles.buttonText}>Start Your Journey</Text>
                        <MaterialIcons name="arrow-forward" size={20} color="white" />
                    </View>
                </TouchableOpacity>
            </Animated.View>

            {/* Bottom Info */}
            <View style={styles.bottomInfo}>
                <View style={styles.infoRow}>
                    <MaterialIcons name="info" size={16} color="#2196F3" />
                    <Text style={styles.infoText}>
                        Book your first trip and join the sustainable transport revolution
                    </Text>
                </View>
            </View>

            {/* Decorative Elements */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
            <View style={styles.decorativeWave} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 20,
        margin: 16,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
    },

    gradientBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        opacity: 0.03,
    },

    header: {
        alignItems: 'center',
        paddingTop: 32,
        paddingHorizontal: 24,
        paddingBottom: 24,
    },

    welcomeIconContainer: {
        position: 'relative',
        marginBottom: 16,
    },

    sparkles: {
        position: 'absolute',
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },

    sparkle: {
        position: 'absolute',
        fontSize: 12,
        opacity: 0.8,
    },

    sparkle2: {
        top: -10,
        right: -15,
        animationDelay: '0.5s',
    },

    sparkle3: {
        bottom: -10,
        left: -15,
        animationDelay: '1s',
    },

    welcomeTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
    },

    welcomeSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '400',
    },

    featuresContainer: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },

    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: 'transparent',
    },

    featureIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    featureText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },

    statsPreview: {
        backgroundColor: '#f8fafe',
        marginHorizontal: 24,
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e3f2fd',
    },

    statsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2196F3',
        textAlign: 'center',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    statItem: {
        alignItems: 'center',
        flex: 1,
    },

    statNumber: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 4,
    },

    statLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: '#666',
        textAlign: 'center',
        lineHeight: 14,
    },

    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 16,
    },

    actionContainer: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },

    mainButton: {
        backgroundColor: '#2196F3',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#2196F3',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },

    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 24,
        gap: 12,
    },

    buttonText: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
        flex: 1,
        textAlign: 'center',
    },

    bottomInfo: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#e3f2fd',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#2196F3',
    },

    infoText: {
        fontSize: 13,
        color: '#1565C0',
        marginLeft: 8,
        flex: 1,
        lineHeight: 18,
        fontWeight: '500',
    },

    // Decorative Elements
    decorativeCircle1: {
        position: 'absolute',
        top: -30,
        right: -30,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E3F2FD',
        opacity: 0.5,
    },

    decorativeCircle2: {
        position: 'absolute',
        bottom: -20,
        left: -20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E8F5E8',
        opacity: 0.6,
    },

    decorativeWave: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: 'linear-gradient(90deg, #2196F3, #4CAF50, #FF9800)',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
});

export default WelcomeCard;