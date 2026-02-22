const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

const mysql = require('mysql2');

// Database connection parameters
const dbConfig = {
  host: process.env.DB_URL,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Add database name here when you have it: 
  // database: process.env.DB_NAME 
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
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Allies Connect API' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
