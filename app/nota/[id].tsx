import { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy'; // SDK ≤53: 'expo-file-system'
import { Nota, buscarNota, excluirNota } from '../../database/db';
import PlayerAudio from '../../components/PlayerAudio';
import { fmtSegundos } from '../../utils/format';

export default function Detalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [nota, setNota] = useState<Nota | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      const n = await buscarNota(Number(id));
      setNota(n ?? null);
      setCarregando(false);
    })();
  }, [id]);

  function confirmarExclusao() {
    Alert.alert('Excluir nota', 'Tem certeza? Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          if (!nota) return;
          try {
            await FileSystem.deleteAsync(nota.uri, { idempotent: true });
          } catch {}
          await excluirNota(nota.id);
          router.back();
        },
      },
    ]);
  }

  if (carregando) return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;
  if (!nota) return <Text style={{ padding: 20 }}>Nota não encontrada.</Text>;

  return (
    <View style={s.container}>
      <Text style={s.titulo}>
        {nota.favorita ? '★ ' : ''}
        {nota.titulo}
      </Text>
      <Text style={s.sub}>
        {nota.categoria} • {fmtSegundos(nota.duracao)}
      </Text>
      <Text style={s.desc}>{nota.descricao}</Text>

      <PlayerAudio uri={nota.uri} />

      <Pressable style={s.btnExcluir} onPress={confirmarExclusao}>
        <Text style={s.btnExcluirTxt}>Excluir nota</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  titulo: { fontSize: 22, fontWeight: '700' },
  sub: { color: '#666' },
  desc: { fontSize: 15, lineHeight: 22, marginBottom: 8 },
  btnExcluir: {
    borderWidth: 1,
    borderColor: '#c62828',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  btnExcluirTxt: { color: '#c62828', fontWeight: '700' },
});
