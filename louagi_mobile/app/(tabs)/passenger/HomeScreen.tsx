import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Config from '../../../src/config';

type Station = {
  id: string;
  name: string;
  city: string;
};

export default function HomeScreen() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`${Config.API_BASE_URL}/stations`)
      .then((res) => res.json())
      .then((data) => {
        setStations(data.stations);  // <-- This is key!
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching stations:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>Select a Station</Text>
      <FlatList
        data={stations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.stationCard}
            // Correct navigation: go to SearchScreen for next step
            onPress={() =>
              router.push({
                pathname: '/(tabs)/passenger/SearchScreen',
                params: { stationId: item.id, stationName: item.name }
              })
            }
          >
            <Text style={{ fontSize: 18 }}>{item.name} ({item.city})</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stationCard: {
    padding: 16,
    backgroundColor: '#f1f1f1',
    marginBottom: 8,
    borderRadius: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
