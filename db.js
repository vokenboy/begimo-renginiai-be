const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool
  .connect()
  .then((client) => {
    console.log('Connected to the database successfully!');
    client.release();
  })
  .catch((err) => {
    console.error('Failed to connect to the database:', err.message);
  });

module.exports = pool;
