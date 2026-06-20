import * as SQLite from 'expo-sqlite';
import { CONFIG } from '../config/constants';

let _db: SQLite.SQLiteDatabase | null = null;
let _initPromise: Promise<void> | null = null;

/**
 * Initialize the SQLite database. Safe to call multiple times (idempotent).
 * Must be called before any repository method is used.
 */
export async function initializeDb(): Promise<void> {
  if (_db) return; // Already initialized
  if (_initPromise) {
    await _initPromise; // Wait for in-progress initialization
    return;
  }

  _initPromise = (async () => {
    const database = SQLite.openDatabaseSync(CONFIG.DATABASE_NAME);

    // Enable Write-Ahead Logging for better concurrent performance
    await database.execAsync('PRAGMA journal_mode = WAL;');

    // Create locations table (SRS FR-DB-02)
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL DEFAULT '',
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        is_synced INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Safe migration: add user_id column if it doesn't exist yet
    try {
      await database.execAsync('ALTER TABLE locations ADD COLUMN user_id TEXT NOT NULL DEFAULT \'\';');
    } catch {
      // Column already exists — ignore
    }

    // Create users table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        username TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `);

    // Indexes for performance (SRS 5.1)
    await database.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_locations_timestamp ON locations (timestamp);'
    );
    await database.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_locations_is_synced ON locations (is_synced);'
    );
    await database.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations (user_id);'
    );

    _db = database;
    console.log('[GeoTrack] Database initialized successfully.');
  })();

  await _initPromise;
}

/**
 * Returns the database instance synchronously. Throws if not yet initialized.
 */
export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    throw new Error('[GeoTrack] Database not initialized. Call initializeDb() first.');
  }
  return _db;
}

/**
 * Returns the database instance, initializing it first if needed.
 * Safe to call from background tasks and services.
 */
export async function getDbAsync(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  await initializeDb();
  return _db!;
}
