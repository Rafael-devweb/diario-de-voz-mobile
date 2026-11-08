import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from 'expo-audio';
// SDK 54+: 'expo-file-system/legacy'. Se seu projeto for SDK 53 ou menor, use: 'expo-file-system'
import * as FileSystem from 'expo-file-system/legacy';
import { inserirNota, marcarSincronizada } from '../database/db';
import { enviarNota } from '../services/api';
import PlayerAudio from '../components/PlayerAudio';
import { fmtSegundos } from '../utils/format';

type Form = {
  titulo: string;
  categoria: string;
  descricao: string;
  favorita: boolean;
};

const CATEGORIAS = ['Ideia', 'Estudo', 'Lembrete', 'Pessoal'];

export default function Nova() {
  const router = useRouter();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const estado = useAudioRecorderState(recorder);
  const [uri, setUri] = useState<string | null>(null);
  const [duracao, setDuracao] = useState(0);
  const [salvando, setSalvando] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    defaultValues: { titulo: '', categoria: '', descricao: '', favorita: false },
  });

  async function iniciar() {
    const { granted } = await AudioModule.requestRecordingPermissionsAsync();
    if (!granted) {
      Alert.alert(
        'Permissão negada',
        'Para gravar suas notas, permita o acesso ao microfone nas configurações do aparelho.'
      );
      return;
    }
    try {
      setUri(null);
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível iniciar a gravação.');
    }
  }

  async function parar() {
    const segundos = estado.durationMillis / 1000;
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      setDuracao(segundos);
      setUri(recorder.uri);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível finalizar a gravação.');
    }
  }

  async function salvar(dados: Form) {
    if (!uri) {
      Alert.alert('Atenção', 'Grave um áudio antes de salvar a nota.');
      return;
    }

    setSalvando(true);
    let idLocal: number;

    // 1) salva localmente (arquivo + SQLite)
    try {
      const destino = `${FileSystem.documentDirectory}nota_${Date.now()}.m4a`;
      await FileSystem.copyAsync({ from: uri, to: destino });
      idLocal = await inserirNota({
        titulo: dados.titulo.trim(),
        categoria: dados.categoria,
        descricao: dados.descricao.trim(),
        favorita: dados.favorita ? 1 : 0,
        uri: destino,
        duracao,
      });
    } catch (e) {
      setSalvando(false);
      Alert.alert('Erro', 'Não foi possível salvar a nota no aparelho.');
      return;
    }

    // 2) envia para a API (se falhar, fica como "pendente")
    try {
      await enviarNota({
        titulo: dados.titulo.trim(),
        categoria: dados.categoria,
        descricao: dados.descricao.trim(),
        duracao,
      });
      await marcarSincronizada(idLocal);
      Alert.alert('Sucesso', 'Nota salva e enviada para a API!');
    } catch (e) {
      Alert.alert(
        'Salva no aparelho',
        'Não foi possível enviar para a API agora. Você pode sincronizar depois na tela inicial.'
      );
    } finally {
      setSalvando(false);
      router.back();
    }
  }

  return (
    <ScrollView
      contentContainerStyle={s.container}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        style={[s.botaoGravar, estado.isRecording && { backgroundColor: '#c62828' }]}
        onPress={estado.isRecording ? parar : iniciar}
      >
        <Text style={s.botaoTxt}>{estado.isRecording ? '■ Parar gravação' : '● Gravar'}</Text>
      </Pressable>
      <Text style={s.tempo}>{fmtSegundos(estado.durationMillis / 1000)}</Text>

      {uri && !estado.isRecording && (
        <>
          <Text style={s.label}>Ouça antes de salvar:</Text>
          <PlayerAudio key={uri} uri={uri} />
        </>
      )}

      <Text style={s.label}>Título</Text>
      <Controller
        control={control}
        name="titulo"
        rules={{
          required: 'Informe o título',
          minLength: { value: 3, message: 'Mínimo de 3 caracteres' },
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[s.input, errors.titulo && s.inputErro]}
            placeholder="Ex: Ideia para o TCC"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      {errors.titulo && <Text style={s.erro}>{errors.titulo.message}</Text>}

      <Text style={s.label}>Categoria</Text>
      <Controller
        control={control}
        name="categoria"
        rules={{ required: 'Escolha uma categoria' }}
        render={({ field: { onChange, value } }) => (
          <View style={s.chips}>
            {CATEGORIAS.map((c) => (
              <Pressable
                key={c}
                onPress={() => onChange(c)}
                style={[s.chip, value === c && s.chipAtivo]}
              >
                <Text style={value === c ? { color: '#fff' } : { color: '#333' }}>{c}</Text>
              </Pressable>
            ))}
          </View>
        )}
      />
      {errors.categoria && <Text style={s.erro}>{errors.categoria.message}</Text>}

      <Text style={s.label}>Descrição</Text>
      <Controller
        control={control}
        name="descricao"
        rules={{
          required: 'Descreva a nota',
          minLength: { value: 5, message: 'Mínimo de 5 caracteres' },
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[s.input, { height: 90, textAlignVertical: 'top' }, errors.descricao && s.inputErro]}
            multiline
            placeholder="Sobre o que é essa nota?"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      {errors.descricao && <Text style={s.erro}>{errors.descricao.message}</Text>}

      <Controller
        control={control}
        name="favorita"
        render={({ field: { onChange, value } }) => (
          <View style={s.linha}>
            <Text style={s.label}>Marcar como favorita</Text>
            <Switch value={value} onValueChange={onChange} />
          </View>
        )}
      />

      <Pressable
        style={[s.botaoSalvar, salvando && { opacity: 0.7 }]}
        onPress={handleSubmit(salvar)}
        disabled={salvando || estado.isRecording}
      >
        {salvando ? <ActivityIndicator color="#fff" /> : <Text style={s.botaoTxt}>Salvar nota</Text>}
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 20, gap: 8, paddingBottom: 40 },
  botaoGravar: {
    backgroundColor: '#1565c0',
    padding: 18,
    borderRadius: 40,
    alignItems: 'center',
  },
  botaoSalvar: {
    backgroundColor: '#2e7d32',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  botaoTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  tempo: { textAlign: 'center', fontSize: 28, fontWeight: '300', marginBottom: 4 },
  label: { fontWeight: '600', color: '#333', marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
  },
  inputErro: { borderColor: '#c62828' },
  erro: { color: '#c62828', fontSize: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#fff',
  },
  chipAtivo: { backgroundColor: '#1565c0', borderColor: '#1565c0' },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
