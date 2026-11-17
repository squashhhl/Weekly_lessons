const mysql = require('mysql2');

// MySQL Connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'RP738964$',
  database: 'petcare'
});

module.exports = pool;
