// scripts/setupDatabase.js — runs schema.sql against MySQL
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');
require('dotenv').config();

async function setup() {
  const conn = await mysql.createConnection({
    host    : process.env.DB_HOST     || 'localhost',
    port    : process.env.DB_PORT     || 3306,
    user    : process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  console.log('🔧 Running schema...');
  await conn.query(sql);
  console.log('✅ SyncSphere database set up successfully!');
  await conn.end();
}
setup().catch(err => { console.error('❌ Setup failed:', err.message); process.exit(1); });
