import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function SearchScreen() {
  const { stationId, stationName } = useLocalSearchParams<{ stationId: string; stationName: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search for Trips</Text>
      <Text>Station ID: {stationId}</Text>
      <Text>Station Name: {stationName}</Text>
      {/* We'll add destination selection and trip fetching here in the next step! */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});
