const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database path can be configured via environment variable
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'jobs.db');

function initDatabase() {
  // Ensure the directory exists before creating the database
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

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
      remote_option INTEGER DEFAULT 0,
      student_level TEXT DEFAULT 'any',
      skills TEXT,
      degree_requirements TEXT,
      application_deadline TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  
  // Create index for common searches
  db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(job_type)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_experience ON jobs(experience_required)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_student_level ON jobs(student_level)`);
  
  return db;
}

function getDatabase() {
  return new Database(dbPath);
}

module.exports = { initDatabase, getDatabase, dbPath };
