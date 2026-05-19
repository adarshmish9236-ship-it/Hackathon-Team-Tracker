const mysql = require('mysql2/promise');
async function test() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3306
    });
    console.log('SUCCESS: Connected with empty password');
    await connection.end();
  } catch (err) {
    console.error('FAIL:', err.message);
  }
}
test();
