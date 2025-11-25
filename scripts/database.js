const Database = require('better-sqlite3');
const path = require('path');

// Database path can be configured via environment variable
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'jobs.db');

function initDatabase() {
  const db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create jobs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT NOT NULL,
      job_type TEXT NOT NULL,
      experience_required INTEGER DEFAULT 0,
      description TEXT,
      requirements TEXT,
      pay_rate TEXT,
      application_url TEXT,
      date_posted TEXT DEFAULT (date('now')),
      source TEXT,
      flexible_hours INTEGER DEFAULT 0,
      weekend_availability INTEGER DEFAULT 0,
      remote_option INTEGER DEFAULT 0,
      near_campus INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  
  // Create index for common searches
  db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(job_type)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_experience ON jobs(experience_required)`);
  
  return db;
}

function getDatabase() {
  return new Database(dbPath);
}

module.exports = { initDatabase, getDatabase, dbPath };
