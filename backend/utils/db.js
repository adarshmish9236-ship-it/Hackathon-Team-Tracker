// utils/db.js — SQLite version (Bypasses MySQL password issues)
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../syncsphere.db');

// Ensure the db file exists or will be created
const db = new sqlite3.Database(dbPath);

// Database schema migrations for Teams registration fee
db.serialize(() => {
  db.run("ALTER TABLE Teams ADD COLUMN registration_fee REAL DEFAULT 0.00", (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error("Migration Error adding registration_fee:", err.message);
    }
  });
  db.run("ALTER TABLE Teams ADD COLUMN is_fee_paid INTEGER DEFAULT 0", (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error("Migration Error adding is_fee_paid:", err.message);
    }
  });
});

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    // Convert MySQL "?" to SQLite "?" (they are the same)
    // Also handle some MySQL-specific syntax if possible, 
    // but mostly we assume standard SQL for the core auth.
    
    const method = sql.trim().toUpperCase().startsWith('SELECT') ? 'all' : 'run';
    
    db[method](sql, params, function(err, rows) {
      if (err) {
        console.error('❌ SQLite Error:', err.message);
        console.error('SQL:', sql);
        return reject(err);
      }
      
      if (method === 'run') {
        // Return object with insertId to match MySQL2 behavior
        resolve({ insertId: this.lastID, affectedRows: this.changes });
      } else {
        resolve(rows);
      }
    });
  });
};

// Mock getConnection to avoid breaking code that uses it
const getConnection = async () => {
  return {
    query: (sql, params) => query(sql, params),
    release: () => {},
    beginTransaction: async () => query('BEGIN TRANSACTION'),
    commit: async () => query('COMMIT'),
    rollback: async () => query('ROLLBACK')
  };
};

module.exports = { pool: db, query, getConnection };
