const { query } = require('./utils/db');

async function setup() {
  try {
    console.log('Setting up ThreatLogs table...');
    await query(`
      CREATE TABLE IF NOT EXISTS ThreatLogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        severity VARCHAR(50) DEFAULT 'medium',
        type VARCHAR(100),
        source_ip VARCHAR(50),
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Setting up IncidentLogs table...');
    await query(`
      CREATE TABLE IF NOT EXISTS IncidentLogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        status VARCHAR(50) DEFAULT 'open',
        title VARCHAR(200),
        priority VARCHAR(50) DEFAULT 'high',
        assigned_to INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Setting up SystemSettings table...');
    await query(`
      CREATE TABLE IF NOT EXISTS SystemSettings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default settings
    await query(`INSERT OR IGNORE INTO SystemSettings (setting_key, setting_value) VALUES ('maintenance_mode', 'false')`);
    await query(`INSERT OR IGNORE INTO SystemSettings (setting_key, setting_value) VALUES ('allow_registration', 'true')`);
    await query(`INSERT OR IGNORE INTO SystemSettings (setting_key, setting_value) VALUES ('xp_multiplier', '1.0')`);

    // Add some fake threat logs
    await query(`INSERT INTO ThreatLogs (severity, type, source_ip, description) VALUES ('high', 'Brute Force Attempt', '192.168.1.105', 'Multiple failed root logins detected')`);
    await query(`INSERT INTO ThreatLogs (severity, type, source_ip, description) VALUES ('critical', 'Unauthorized Access', '45.33.22.11', 'Admin token impersonation detected')`);

    console.log('Tables setup complete!');
  } catch (err) {
    console.error(err);
  }
}

setup();
