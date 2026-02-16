import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

export type PetRow = {
  id: string;
  species_id: string;
  name: string;
  level: number;
  xp: number;
  is_active: number;
  created_at: string;
};

export type RunRow = {
  id: string;
  external_id: string | null;
  distance_meters: number;
  duration_seconds: number;
  pace_seconds_per_km: number | null;
  start_time: string;
  end_time: string;
  calories: number | null;
  xp_awarded: number;
  synced_at: string;
};

export type ProfileRow = {
  id: string;
  current_streak: number;
  longest_streak: number;
  last_run_date: string | null;
  total_runs: number;
  total_distance_meters: number;
  total_time_seconds: number;
  units: string;
  onboarding_complete: number;
};

export type RunInsert = {
  id: string;
  external_id: string | null;
  distance_meters: number;
  duration_seconds: number;
  pace_seconds_per_km: number | null;
  start_time: string;
  end_time: string;
  calories: number | null;
  xp_awarded: number;
};

let db: SQLiteDatabase | null = null;

export function getDb() {
  if (!db) {
    db = openDatabaseSync('runpets.db');
  }
  return db;
}

export function initDb() {
  const database = getDb();
  database.execSync(`
    CREATE TABLE IF NOT EXISTS pets (
      id TEXT PRIMARY KEY,
      species_id TEXT NOT NULL DEFAULT 'endurance-wolf',
      name TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      xp INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  database.execSync(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      external_id TEXT UNIQUE,
      distance_meters REAL NOT NULL,
      duration_seconds REAL NOT NULL,
      pace_seconds_per_km REAL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      calories REAL,
      xp_awarded INTEGER NOT NULL DEFAULT 0,
      synced_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  database.execSync(`
    CREATE TABLE IF NOT EXISTS profile (
      id TEXT PRIMARY KEY DEFAULT 'default',
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      last_run_date TEXT,
      total_runs INTEGER NOT NULL DEFAULT 0,
      total_distance_meters REAL NOT NULL DEFAULT 0,
      total_time_seconds REAL NOT NULL DEFAULT 0,
      units TEXT NOT NULL DEFAULT 'metric',
      onboarding_complete INTEGER NOT NULL DEFAULT 0
    );
  `);
  database.runSync("INSERT OR IGNORE INTO profile (id) VALUES ('default')");
}

export function getProfile(): ProfileRow {
  const database = getDb();
  const row = database.getFirstSync<ProfileRow>("SELECT * FROM profile WHERE id = 'default'");
  if (!row) {
    database.runSync("INSERT OR IGNORE INTO profile (id) VALUES ('default')");
    return database.getFirstSync<ProfileRow>("SELECT * FROM profile WHERE id = 'default'")!;
  }
  return row;
}

export function updateProfile(partial: Partial<ProfileRow>) {
  const keys = Object.keys(partial) as (keyof ProfileRow)[];
  if (keys.length === 0) return;
  const sets: string[] = [];
  const vals: (string | number | null)[] = [];
  for (const key of keys) {
    sets.push(`${String(key)} = ?`);
    vals.push(partial[key] as string | number | null);
  }
  const database = getDb();
  database.runSync(`UPDATE profile SET ${sets.join(', ')} WHERE id = 'default'`, vals);
}

export function getActivePet(): PetRow | null {
  const database = getDb();
  return database.getFirstSync<PetRow>('SELECT * FROM pets WHERE is_active = 1 LIMIT 1') ?? null;
}

export function insertPet(name: string) {
  const database = getDb();
  const id = `pet_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  database.runSync(
    'INSERT INTO pets (id, name, species_id, level, xp, is_active) VALUES (?, ?, ?, ?, ?, ?)',
    [id, name, 'endurance-wolf', 1, 0, 1],
  );
  return getActivePet();
}

export function updatePet(id: string, updates: Partial<PetRow>) {
  const keys = Object.keys(updates) as (keyof PetRow)[];
  if (keys.length === 0) return;
  const sets: string[] = [];
  const vals: (string | number | null)[] = [];
  for (const key of keys) {
    sets.push(`${String(key)} = ?`);
    vals.push(updates[key] as string | number | null);
  }
  vals.push(id);
  const database = getDb();
  database.runSync(`UPDATE pets SET ${sets.join(', ')} WHERE id = ?`, vals);
}

export function getRuns(): RunRow[] {
  const database = getDb();
  return database.getAllSync<RunRow>('SELECT * FROM runs ORDER BY start_time DESC') ?? [];
}

export function insertRuns(runs: RunInsert[]) {
  if (runs.length === 0) return;
  const database = getDb();
  for (const run of runs) {
    database.runSync(
      `INSERT OR IGNORE INTO runs (id, external_id, distance_meters, duration_seconds, pace_seconds_per_km, start_time, end_time, calories, xp_awarded)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        run.id,
        run.external_id,
        run.distance_meters,
        run.duration_seconds,
        run.pace_seconds_per_km,
        run.start_time,
        run.end_time,
        run.calories,
        run.xp_awarded,
      ],
    );
  }
}
