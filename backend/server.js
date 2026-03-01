const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

const mysql = require('mysql2');

// Determine if we are in the development environment
const isDev = process.env.NODE_ENV === 'development';

// Conditionally select the database configuration
const dbConfig = {
  host: isDev ? process.env.DEV_DB_URL : process.env.DB_URL,
  user: isDev ? process.env.DEV_DB_USER : process.env.DB_USER,
  password: isDev ? process.env.DEV_DB_PASSWORD : process.env.DB_PASSWORD,
  database: isDev ? process.env.DEV_DB_NAME : process.env.DB_NAME,
};

// Create a MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Test the connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err.message);
  } else {
    console.log('Successfully connected to MySQL database');
    connection.release();
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', async (req, res) => {
  try {
    // Query the database to confirm connection
    const [rows] = await pool.promise().query(
      'SELECT * FROM User WHERE user_id = 1 AND email = ?',
      ['alice@example.com']
    );

    const email = rows[0]?.email || 'No email found';

    res.json({
      message: `Welcome to the Allies Connect API, ${email}`
    });
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({
      message: 'Welcome to the Allies Connect API',
      db_status: 'Error',
      error: error.message
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
