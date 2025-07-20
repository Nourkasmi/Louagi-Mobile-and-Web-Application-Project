//  app/(passenger)/booking/components/MockPaymentNotice.tsx 

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function MockPaymentNotice() {
    return (
        <View style={styles.container}>
            <MaterialIcons name="info" size={20} color="#ff9800" />
            <Text style={styles.text}>
                🎭 Mock Payment Mode: No real money will be charged during testing!
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff3cd',
        padding: 12,
        margin: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#ff9800',
    },
    text: {
        fontSize: 14,
        color: '#856404',
        fontWeight: '500',
        marginLeft: 8,
        flex: 1,
    },
});
