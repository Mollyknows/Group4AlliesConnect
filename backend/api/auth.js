const express = require('express');
const cors = require('cors');
require('dotenv').config();

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

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

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Allies Connect API',
      version: '1.0.0',
      description: 'API documentation for Allies Connect platform',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
      },
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            name: {
              type: 'string',
              example: 'Jane Doe',
            },
            email: {
              type: 'string',
              example: 'jane@email.com',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Error message here',
            },
            status: {
              type: 'integer',
              example: 400,
            },
          },
        },
      },
    },
  },
  apis: ['./server.js'], // You can later change this to ./routes/*.js
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Allies Connect API' });
});
app.get('/users', (req, res) => {
  res.json([{ id: 1, name: 'Jane Doe', email: 'jane@email.com' }]);
});

app.post('/api/auth/register', (req, res) => {
  // For public users to create accounts to RSVP for events or volunteer
});
app.post('/api/auth/login', (req, res) => {
  // Authenticates users and returns session tokens/JWTs});
});
app.post('/api/auth/password-reset', (req, res) => {
  //  Initiates the email-based password recovery process
});
app.get('/api/users/profile', (req, res) => {
  // Retrieves personal data like name, phone, and zip code
});
app.put('/api/users/profile', (req, res) => {
  // Updates user contact information
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});