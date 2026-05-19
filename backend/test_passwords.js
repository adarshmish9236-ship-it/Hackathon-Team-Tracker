const mysql = require('mysql2/promise');
async function test(pw) {
  try {
    const connection = await mysql.createConnection({ host: 'localhost', user: 'root', password: pw, port: 3306 });
    console.log('SUCCESS with password:', pw);
    await connection.end();
    return true;
  } catch (err) {
    return false;
  }
}
async function run() {
  const passwords = ['root', 'password', '123456', 'admin', 'mysql', ''];
  for (let p of passwords) {
    if (await test(p)) { console.log('FOUND:', p); process.exit(0); }
  }
  console.log('NONE WORKED');
}
run();
