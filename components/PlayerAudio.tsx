import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { fmtSegundos } from '../utils/format';

export default function PlayerAudio({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const progresso =
    status.duration > 0 ? Math.min(status.currentTime / status.duration, 1) : 0;

  async function alternar() {
    if (status.playing) {
      player.pause();
      return;
    }
    // garante saída pelo alto-falante (no iOS, após gravar, o áudio vai para o fone de ouvido)
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    if (status.didJustFinish || progresso >= 1) player.seekTo(0);
    player.play();
  }

  function voltar10() {
    player.seekTo(Math.max(status.currentTime - 10, 0));
  }

  function avancar10() {
    player.seekTo(Math.min(status.currentTime + 10, status.duration));
  }

  return (
    <View style={s.box}>
      <View style={s.controles}>
        <Pressable style={s.btnPequeno} onPress={voltar10}>
          <Text style={s.txtPequeno}>⟲ 10</Text>
        </Pressable>
        <Pressable style={s.btn} onPress={alternar}>
          <Text style={s.icone}>{status.playing ? '❚❚' : '▶'}</Text>
        </Pressable>
        <Pressable style={s.btnPequeno} onPress={avancar10}>
          <Text style={s.txtPequeno}>10 ⟳</Text>
        </Pressable>
      </View>
      <View style={s.barra}>
        <View style={[s.preenchido, { width: `${progresso * 100}%` }]} />
      </View>
      <Text style={s.tempo}>
        {fmtSegundos(status.currentTime)} / {fmtSegundos(status.duration)}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: { gap: 12, alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 12 },
  controles: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  btn: {
    backgroundColor: '#1565c0',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icone: { color: '#fff', fontSize: 24 },
  btnPequeno: { padding: 10, borderRadius: 8, backgroundColor: '#e3f2fd' },
  txtPequeno: { color: '#1565c0', fontWeight: '700' },
  barra: { height: 6, alignSelf: 'stretch', backgroundColor: '#ddd', borderRadius: 3 },
  preenchido: { height: 6, backgroundColor: '#1565c0', borderRadius: 3 },
  tempo: { color: '#444' },
});
