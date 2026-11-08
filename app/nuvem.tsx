import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { NotaNuvem, listarNotasNuvem } from '../services/api';

export default function Nuvem() {
  const [dados, setDados] = useState<NotaNuvem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setDados(await listarNotasNuvem());
    } catch {
      setErro('Não foi possível carregar as notas. Verifique sua conexão.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carregando) return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;

  if (erro) {
    return (
      <View style={s.centro}>
        <Text style={s.erro}>{erro}</Text>
        <Pressable
          style={s.btn}
          onPress={() => {
            setCarregando(true);
            carregar();
          }}
        >
          <Text style={s.btnTxt}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={dados}
      keyExtractor={(n) => n.id}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={async () => {
            await carregar();
          }}
        />
      }
      ListEmptyComponent={<Text style={s.vazio}>Nada na nuvem ainda.</Text>}
      renderItem={({ item }) => (
        <View style={s.card}>
          <Text style={s.titulo}>{item.titulo}</Text>
          {item.categoria ? <Text style={s.cat}>{item.categoria}</Text> : null}
          <Text style={s.desc} numberOfLines={3}>
            {item.descricao}
          </Text>
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  erro: { color: '#c62828', textAlign: 'center' },
  btn: { backgroundColor: '#1565c0', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  btnTxt: { color: '#fff', fontWeight: '700' },
  vazio: { textAlign: 'center', color: '#777', marginTop: 40 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, gap: 4 },
  titulo: { fontWeight: '700', fontSize: 15 },
  cat: { color: '#1565c0', fontSize: 12, fontWeight: '600' },
  desc: { color: '#555' },
});
