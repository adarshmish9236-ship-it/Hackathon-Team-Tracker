const bcrypt = require('bcryptjs');
const { query } = require('../utils/db');

async function seedAdmin() {
  try {
    console.log('Revoking admin rights from all users...');
    await query("UPDATE Users SET role = 'member'");

    console.log('Provisioning the secret admin account...');
    const email = 'admin@syncsphere.com';
    const password = 'Admin@123';
    const username = 'sysadmin';
    const full_name = 'System Administrator';

    // Hash the password
    const hash = await bcrypt.hash(password, 12);

    // Check if the user already exists
    const existing = await query('SELECT id FROM Users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await query('UPDATE Users SET role = ?, password_hash = ? WHERE email = ?', ['admin', hash, email]);
      console.log('Existing admin account updated.');
    } else {
      await query(
        'INSERT INTO Users (username, email, password_hash, full_name, role, xp_points) VALUES (?, ?, ?, ?, ?, ?)',
        [username, email, hash, full_name, 'admin', 0]
      );
      console.log('New admin account created.');
    }

    console.log('Admin account provisioned successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err);
    process.exit(1);
  }
}

seedAdmin();
