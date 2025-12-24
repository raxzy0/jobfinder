const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

// Test database module
test('Database module exists and exports required functions', () => {
  const db = require('../scripts/database');
  assert.ok(db.initDatabase, 'initDatabase function should exist');
  assert.ok(db.getDatabase, 'getDatabase function should exist');
  assert.ok(db.dbPath, 'dbPath should be exported');
});

// Test that database directory is automatically created
test('Database directory is automatically created if missing', () => {
  const { initDatabase, dbPath } = require('../scripts/database');
  const dbDir = path.dirname(dbPath);
  
  // Initialize database (directory should be created automatically)
  const db = initDatabase();
  assert.ok(db, 'Database should be created');
  
  // Verify the directory was created
  assert.ok(fs.existsSync(dbDir), 'Database directory should exist');
  assert.ok(fs.existsSync(dbPath), 'Database file should exist');
  
  db.close();
});

// Test that seed script creates sample data
test('Database can be initialized and queried', () => {
  const { initDatabase, getDatabase } = require('../scripts/database');
  
  // Initialize database
  const db = initDatabase();
  assert.ok(db, 'Database should be created');
  db.close();
  
  // Check we can get database connection
  const db2 = getDatabase();
  assert.ok(db2, 'Should be able to get database connection');
  
  // Query jobs table
  const count = db2.prepare('SELECT COUNT(*) as count FROM jobs').get();
  assert.ok(count.count >= 0, 'Should be able to query jobs table');
  db2.close();
});

// Test server module exports
test('Server module exports express app', () => {
  const app = require('../server');
  assert.ok(app, 'Server should export express app');
  assert.ok(typeof app.listen === 'function', 'App should have listen method');
});

// Test that required files exist
test('Required frontend files exist', () => {
  const publicDir = path.join(__dirname, '..', 'public');
  
  assert.ok(fs.existsSync(path.join(publicDir, 'index.html')), 'index.html should exist');
  assert.ok(fs.existsSync(path.join(publicDir, 'saved.html')), 'saved.html should exist');
  assert.ok(fs.existsSync(path.join(publicDir, 'css', 'styles.css')), 'styles.css should exist');
  assert.ok(fs.existsSync(path.join(publicDir, 'js', 'app.js')), 'app.js should exist');
});

// Test that required backend files exist
test('Required backend files exist', () => {
  const rootDir = path.join(__dirname, '..');
  
  assert.ok(fs.existsSync(path.join(rootDir, 'server.js')), 'server.js should exist');
  assert.ok(fs.existsSync(path.join(rootDir, 'scripts', 'database.js')), 'database.js should exist');
  assert.ok(fs.existsSync(path.join(rootDir, 'scripts', 'seed.js')), 'seed.js should exist');
  assert.ok(fs.existsSync(path.join(rootDir, 'package.json')), 'package.json should exist');
});

// Test runner will output results automatically
