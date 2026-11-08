import axios from 'axios';

/**
 * Por padrão usa o JSONPlaceholder (funciona sem cadastro, mas NÃO guarda os dados).
 * Para uma API que realmente guarda suas notas:
 *  1. crie um projeto em https://mockapi.io com um recurso chamado "notas"
 *     com os campos: titulo, categoria, descricao, duracao
 *  2. cole a URL base abaixo, ex: 'https://abc123.mockapi.io/api/v1'
 */
const MOCKAPI_URL = '';

const usaMock = MOCKAPI_URL.length > 0;

const api = axios.create({
  baseURL: usaMock ? MOCKAPI_URL : 'https://jsonplaceholder.typicode.com',
  timeout: 10000,
});

export type NotaNuvem = {
  id: string;
  titulo: string;
  descricao: string;
  categoria?: string;
};

export type NotaEnvio = {
  titulo: string;
  categoria: string;
  descricao: string;
  duracao: number;
};

// POST
export async function enviarNota(d: NotaEnvio) {
  if (usaMock) {
    const r = await api.post('/notas', d);
    return r.data;
  }
  const r = await api.post('/posts', {
    title: d.titulo,
    body: d.descricao,
    userId: 1,
  });
  return r.data;
}

// GET
export async function listarNotasNuvem(): Promise<NotaNuvem[]> {
  if (usaMock) {
    const r = await api.get('/notas');
    return r.data.map((n: any) => ({
      id: String(n.id),
      titulo: n.titulo,
      descricao: n.descricao,
      categoria: n.categoria,
    }));
  }
  const r = await api.get('/posts', { params: { _limit: 20 } });
  return r.data.map((p: any) => ({
    id: String(p.id),
    titulo: p.title,
    descricao: p.body,
  }));
}
