// 📁 app/(passenger)/booking/components/ErrorState.tsx - ERROR STATE COMPONENT
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ErrorStateProps {
    error: string;
    onRetry: () => void;
    onGoBack: () => void;
}

export default function ErrorState({ error, onRetry, onGoBack }: ErrorStateProps) {
    return (
        <View style={styles.container}>
            <MaterialIcons name="error-outline" size={64} color="#f44336" />
            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity
                style={styles.retryButton}
                onPress={onRetry}
                activeOpacity={0.7}
            >
                <Text style={styles.retryButtonText}>🔄 Retry</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: '#6c757d', marginTop: 12 }]}
                onPress={onGoBack}
                activeOpacity={0.7}
            >
                <Text style={styles.retryButtonText}>← Go Back</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#f44336',
        marginBottom: 20,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    retryButton: {
        backgroundColor: '#0066cc',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        minHeight: 44,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});