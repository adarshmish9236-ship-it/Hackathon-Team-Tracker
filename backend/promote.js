const { query } = require('./utils/db');
query("UPDATE Users SET role='admin'").then(() => console.log('All users promoted to admin')).catch(console.error);
