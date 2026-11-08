import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { initDb } from '../database/db';

export default function RootLayout() {
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    initDb().then(() => setPronto(true));
  }, []);

  if (!pronto) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1565c0' },
        headerTintColor: '#fff',
        contentStyle: { backgroundColor: '#f2f4f7' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Diário de Voz' }} />
      <Stack.Screen name="nova" options={{ title: 'Nova nota' }} />
      <Stack.Screen name="nota/[id]" options={{ title: 'Detalhes' }} />
      <Stack.Screen name="nuvem" options={{ title: 'Notas na nuvem' }} />
    </Stack>
  );
}
