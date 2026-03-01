const express = require('express');
const cors = require('cors');
require('dotenv').config();

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');


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
app.get('/', async (req, res) => {
  try {
    // Query the database to confirm connection
    const [rows] = await pool.promise().query(
      'SELECT * FROM User WHERE user_id = 1'
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

app.get('/api/resources', (req, res) => {
  // Retrieves a list of resources. Supports query parameters for filtering by zip code, category, date, and geolocation search radius
});
app.get('/api/resources/:id', (req, res) => {
  // Provides detailed information for a specific resource, including contact info, social media links, and eligibility requirements
});

app.get('/api/categories', (req, res) => {
  // Fetches the available resource and event categories (e.g., Food, Housing, Legal) for the filter panel
});

app.get('/api/events', (req, res) => {
  // Retrieves upcoming events for the calendar and list views, with filters for date range and location
});
app.get('/api/events/:id', (req, res) => {
  // Returns full details for an event, including its associated service provider and map location
});
app.post('/api/events/:id/rsvp', (req, res) => {
  // Allows a logged-in user to register for an event and specify the number of guests
});

app.get('/api/volunteer-opportunities', (req, res) => {
  // Lists available volunteer roles with filters for location and shifts
});
app.get('/api/volunteer-opportunities/:id', (req, res) => {
  // Fetches opportunity details, including the custom form schema (form_builder_schema) and associated shifts
});
app.post('/api/volunteer-signups', (req, res) => {
  // Submits a user's registration for a specific shift, including their form_response_data
});
app.delete('/api/volunteer-signups/:id', (req, res) => {
  // Allows a volunteer to cancel their registration
});

app.post('/api/organizations/register', (req, res) => {
  // For new nonprofits to submit their legal name, EIN, and contact info for admin approval
});
app.get('/api/organizations/profile', (req, res) => {
  // Manages the organization's dashboard details like mission statement, logo, and operating hours
});
app.put('/api/organizations/profile', (req, res) => {
  // Manages the organization's dashboard details like mission statement, logo, and operating hours
});

app.post('/api/resources', (req, res) => {
  // Allows providers to manage their own resource listings
});

app.put('/api/resources', (req, res) => {
});
app.delete('/api/resources', (req, res) => {
});

app.post('/api/volunteer-opportunities', (req, res) => {
 // Allows providers to manage their community events
});

app.put('/api/volunteer-opportunities', (req, res) => {
});
app.delete('/api/volunteer-opportunities', (req, res) => {
});

app.post('/api/events', (req, res) => {
  // Allows providers to create volunteer roles and define specific shifts and capacity
});

app.put('/api/admin/providers/:id/status', (req, res) => {
});
app.delete('/api/events', (req, res) => {
});

app.get('/api/organizations/signups/export', (req, res) => {
  // Generates the volunteer roster data, likely as a CSV stream, using the view_roster_export database view
});

app.get('/api/admin/pending-providers', (req, res) => {
  // Retrieves a queue of organizations waiting for registration approval
});
app.patch('/api/admin/providers/:id/status', (req, res) => {
  // Allows an admin to approve, reject, or suspend a service provider
});
app.patch('/api/admin/content/:type/:id', (req, res) => {
  // Allows admins to moderate or deactivate inappropriate resources, events, or opportunities
});
app.get('/api/admin/logs', (req, res) => {
  // Accesses the AuditLog to monitor system changes, such as who updated what and when
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
  console.log(`Swagger Docs available at http://localhost:${port}/api-docs`);
});
