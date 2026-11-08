import * as SQLite from 'expo-sqlite';

export type Nota = {
  id: number;
  titulo: string;
  categoria: string;
  descricao: string;
  favorita: number; // 0 | 1
  uri: string;
  duracao: number; // segundos
  sincronizada: number; // 0 | 1
};

let db: SQLite.SQLiteDatabase;

export async function initDb() {
  db = await SQLite.openDatabaseAsync('diario.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS notas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      categoria TEXT,
      descricao TEXT,
      favorita INTEGER DEFAULT 0,
      uri TEXT NOT NULL,
      duracao REAL DEFAULT 0,
      sincronizada INTEGER DEFAULT 0
    );
  `);
}

export async function inserirNota(
  n: Omit<Nota, 'id' | 'sincronizada'>
): Promise<number> {
  const r = await db.runAsync(
    'INSERT INTO notas (titulo, categoria, descricao, favorita, uri, duracao) VALUES (?,?,?,?,?,?)',
    [n.titulo, n.categoria, n.descricao, n.favorita, n.uri, n.duracao]
  );
  return r.lastInsertRowId;
}

export const listarNotas = () =>
  db.getAllAsync<Nota>('SELECT * FROM notas ORDER BY id DESC');

export const buscarNota = (id: number) =>
  db.getFirstAsync<Nota>('SELECT * FROM notas WHERE id = ?', [id]);

export const marcarSincronizada = (id: number) =>
  db.runAsync('UPDATE notas SET sincronizada = 1 WHERE id = ?', [id]);

export const excluirNota = (id: number) =>
  db.runAsync('DELETE FROM notas WHERE id = ?', [id]);
