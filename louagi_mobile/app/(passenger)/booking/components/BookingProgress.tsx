//  app/(passenger)/booking/components/BookingProgress.tsx 
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BookingProgressProps {
    progress: number;
    step: string;
}

export default function BookingProgress({ progress, step }: BookingProgressProps) {
    const getStepTitle = (currentStep: string) => {
        const titles = {
            'selecting': 'Step 1: Select Seats',
            'confirming': 'Step 2: Confirm Details',
            'processing': 'Step 3: Processing...',
            'payment': 'Step 4: Mock Payment',
            'completed': 'Completed!',
            'failed': 'Please Try Again'
        };
        return titles[currentStep as keyof typeof titles] || 'Booking';
    };

    return (
        <View style={styles.container}>
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{getStepTitle(step)}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    progressBar: {
        height: 4,
        backgroundColor: '#e9ecef',
        borderRadius: 2,
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#0066cc',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        fontWeight: '500',
    },
});
