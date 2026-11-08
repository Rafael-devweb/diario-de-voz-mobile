import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Nota, listarNotas, marcarSincronizada } from '../database/db';
import { enviarNota } from '../services/api';
import CardNota from '../components/CardNota';

export default function Home() {
  const router = useRouter();
  const [notas, setNotas] = useState<Nota[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setNotas(await listarNotas());
    setCarregando(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  const pendentes = notas.filter((n) => !n.sincronizada);

  async function sincronizar() {
    setSincronizando(true);
    let ok = 0;
    const total = pendentes.length;
    for (const n of pendentes) {
      try {
        await enviarNota({
          titulo: n.titulo,
          categoria: n.categoria,
          descricao: n.descricao,
          duracao: n.duracao,
        });
        await marcarSincronizada(n.id);
        ok++;
      } catch {
        // continua tentando as demais
      }
    }
    setSincronizando(false);
    await carregar();
    Alert.alert(
      ok === total ? 'Sucesso' : 'Atenção',
      `${ok} de ${total} nota(s) enviada(s) para a API.`
    );
  }

  return (
    <View style={s.container}>
      {carregando ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notas}
          keyExtractor={(n) => String(n.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
          ListEmptyComponent={
            <Text style={s.vazio}>
              Nenhuma nota ainda.{'\n'}Toque em “+ Nova nota” para gravar a primeira.
            </Text>
          }
          renderItem={({ item }) => (
            <CardNota nota={item} onPress={() => router.push(`/nota/${item.id}`)} />
          )}
        />
      )}

      <View style={s.rodape}>
        {pendentes.length > 0 && (
          <Pressable style={s.btnSinc} onPress={sincronizar} disabled={sincronizando}>
            {sincronizando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnTxt}>Sincronizar {pendentes.length} pendente(s)</Text>
            )}
          </Pressable>
        )}
        <View style={s.linha}>
          <Pressable style={[s.btn, { flex: 1 }]} onPress={() => router.push('/nova')}>
            <Text style={s.btnTxt}>+ Nova nota</Text>
          </Pressable>
          <Pressable style={[s.btnSec, { flex: 1 }]} onPress={() => router.push('/nuvem')}>
            <Text style={s.btnSecTxt}>☁ Nuvem</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  vazio: { textAlign: 'center', color: '#777', marginTop: 60, lineHeight: 22 },
  rodape: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    gap: 10,
    backgroundColor: '#f2f4f7',
  },
  linha: { flexDirection: 'row', gap: 10 },
  btn: { backgroundColor: '#1565c0', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnSec: {
    backgroundColor: '#e3f2fd',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnSinc: { backgroundColor: '#ef6c00', padding: 12, borderRadius: 10, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSecTxt: { color: '#1565c0', fontWeight: '700', fontSize: 15 },
});
