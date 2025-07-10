// 📁 app/(passenger)/booking/components/BookingHeader.tsx - HEADER COMPONENT
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useBookingFlow } from '../hooks/useBookingFlow';

export default function BookingHeader() {
    const { actions } = useBookingFlow();

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={actions.goBack}
                style={styles.backButton}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <MaterialIcons name="arrow-back" size={24} color="#0066cc" />
                <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Book Your Trip</Text>

            <View style={styles.mockIndicator}>
                <View style={styles.statusDot} />
                <Text style={styles.mockText}>Mock Pay</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        justifyContent: 'space-between',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 8,
        minHeight: 44,
        minWidth: 60,
    },
    backButtonText: {
        fontSize: 16,
        color: '#0066cc',
        fontWeight: '600',
        marginLeft: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    mockIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff3cd',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ff9800',
        marginRight: 4,
    },
    mockText: {
        fontSize: 12,
        color: '#856404',
        fontWeight: '600',
    },
});