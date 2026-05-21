const { query } = require('./backend/utils/db');

async function makeAdmin() {
  try {
    await query("UPDATE Users SET role = 'admin'");
    console.log("All users are now admins!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

makeAdmin();
