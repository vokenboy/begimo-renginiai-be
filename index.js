const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = 5000;

// PostgreSQL Connection Pool
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

// Test Database Connection
pool
  .connect()
  .then((client) => {
    console.log('Connected to the database successfully!');
    client.release(); // Release the client back to the pool
  })
  .catch((err) => {
    console.error('Failed to connect to the database:', err.message);
  });

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the Node.js Backend!');
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS current_time'); // Query to get the current time
    res.status(200).send(`Database connection is successful! Current time: ${result.rows[0].current_time}`);
  } catch (err) {
    console.error('Database connection error:', err.message);
    res.status(500).send('Failed to connect to the database.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
