// app/(passenger)/booking/components/SpecialRequestsInput.tsx 

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useBookingFlow } from '../hooks/useBookingFlow';

export default function SpecialRequestsInput() {
    const { state, actions } = useBookingFlow();
    const { specialRequests } = state;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Special Requests (Optional)</Text>
            <TextInput
                style={styles.textInput}
                placeholder="Any special requirements or notes..."
                value={specialRequests}
                onChangeText={actions.updateSpecialRequests}
                multiline
                numberOfLines={3}
                maxLength={500}
                editable={state.step !== 'processing'}
            />
            <Text style={styles.characterCount}>
                {specialRequests.length}/500 characters
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    characterCount: {
        textAlign: 'right',
        fontSize: 12,
        color: '#888',
        marginTop: 8,
    },
});