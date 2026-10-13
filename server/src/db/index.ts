import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/mcd-assist.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      title TEXT,
      type TEXT,
      start_date TEXT,
      end_date TEXT,
      summary TEXT,
      detail TEXT,
      image TEXT,
      source TEXT,
      updated_at INTEGER NOT NULL
    );
  `);
}
