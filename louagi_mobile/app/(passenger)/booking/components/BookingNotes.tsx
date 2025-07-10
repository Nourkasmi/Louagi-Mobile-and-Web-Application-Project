// 📁 app/(passenger)/booking/components/BookingNotes.tsx - FIXED VERSION
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function BookingNotes() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>🎭 Mock Payment Information:</Text>

            <View style={styles.noteItem}>
                <MaterialIcons name="info" size={16} color="#ff9800" />
                <Text style={styles.noteText}>This is a test environment - no real payments</Text>
            </View>

            <View style={styles.noteItem}>
                <MaterialIcons name="credit-card" size={16} color="#ff9800" />
                <Text style={styles.noteText}>Try different mock cards to test scenarios</Text>
            </View>

            <View style={styles.noteItem}>
                <MaterialIcons name="check-circle" size={16} color="#ff9800" />
                <Text style={styles.noteText}>Visa •••• 4242 and MasterCard •••• 5555 succeed</Text>
            </View>

            <View style={styles.noteItem}>
                <MaterialIcons name="error" size={16} color="#ff9800" />
                <Text style={styles.noteText}>Amex •••• 1234 and Visa •••• 0000 fail for testing</Text>
            </View>

            <View style={styles.noteItem}>
                <MaterialIcons name="flash-on" size={16} color="#ff9800" />
                <Text style={styles.noteText}>Trip starts automatically when capacity is full</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff3cd',
        margin: 16,
        padding: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#ff9800',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#856404',
        marginBottom: 12,
    },
    noteItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    noteText: {
        fontSize: 14,
        color: '#856404',
        marginLeft: 8,
        flex: 1,
    },
});