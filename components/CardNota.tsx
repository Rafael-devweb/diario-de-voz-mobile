import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Nota } from '../database/db';
import { fmtSegundos } from '../utils/format';

type Props = { nota: Nota; onPress: () => void };

export default function CardNota({ nota, onPress }: Props) {
  return (
    <Pressable style={s.card} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={s.titulo} numberOfLines={1}>
          {nota.favorita ? '★ ' : ''}
          {nota.titulo}
        </Text>
        <Text style={s.sub}>
          {nota.categoria} • {fmtSegundos(nota.duracao)}
        </Text>
      </View>
      <Text style={nota.sincronizada ? s.ok : s.pendente}>
        {nota.sincronizada ? '☁ enviada' : '⏳ pendente'}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  titulo: { fontSize: 16, fontWeight: '700', color: '#222' },
  sub: { fontSize: 13, color: '#666', marginTop: 2 },
  ok: { color: '#2e7d32', fontSize: 12, fontWeight: '600' },
  pendente: { color: '#ef6c00', fontSize: 12, fontWeight: '600' },
});
