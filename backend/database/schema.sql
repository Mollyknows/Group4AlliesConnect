// Public Resource Finder

app.get('/api/resources', async (req, res) => {
  const { category, zip } = req.query;
  const query = `
    SELECT r.*, l.address_text, l.zip_code 
    FROM Resource r
    JOIN Category c ON r.category_id = c.category_id
    JOIN Location l ON r.location_id = l.location_id
    WHERE c.name = $1 AND l.zip_code = $2;
  `;
  const result = await pool.query(query, [category, zip]);
  res.json(result.rows);
});


// Event Calendar
// GET /api/events?category=Food%20Assistance
app.get('/api/events', async (req, res) => {
  const { category } = req.query;
  const query = `
    SELECT e.*, s.name as provider_name 
    FROM Event e
    JOIN ServiceProvider s ON e.provider_id = s.provider_id
    JOIN Category c ON e.category_id = c.category_id
    WHERE c.name = $1 AND e.start_datetime >= CURRENT_TIMESTAMP;
  `;
  const result = await pool.query(query, [category]);
  res.json(result.rows);
});

// Recording an RSVP:
// POST /api/events/:id/rsvp
app.post('/api/events/:id/rsvp', async (req, res) => {
  const eventId = req.params.id;
  const { userId, status } = req.body; // status is 'yes'
  const query = `
    INSERT INTO EventRSVP (event_id, user_id, status) 
    VALUES ($1, $2, $3) 
    RETURNING *;
  `;
  const result = await pool.query(query, [eventId, userId, status]);
  res.status(201).json(result.rows);
});


// Volunteer Opportunities
// GET /api/volunteer-opportunities/:id
app.get('/api/volunteer-opportunities/:id', async (req, res) => {
  const query = `
    SELECT title, description, form_builder_schema, tags 
    FROM opportunities 
    WHERE opportunity_id = $1;
  `;
  const result = await pool.query(query, [req.params.id]);
  res.json(result.rows);
});

// Submitting a Signup with Custom Data
// POST /api/volunteer-signups
app.post('/api/volunteer-signups', async (req, res) => {
  const { shiftId, volunteerId, responses } = req.body;
  const query = `
    INSERT INTO shift_signups (shift_id, volunteer_id, status, form_response_data)
    VALUES ($1, $2, 'Confirmed', $3)
    RETURNING *;
  `;
  const result = await pool.query(query, [shiftId, volunteerId, JSON.stringify(responses)]);
  res.status(201).json(result.rows);
});

// Provider Portal: Roster Export
// GET /api/organizations/export/:shiftId
app.get('/api/organizations/export/:shiftId', async (req, res) => {
  const query = `SELECT * FROM view_roster_export WHERE shift_id = $1;`;
  const result = await pool.query(query, [req.params.shiftId]);
  
  // Logic to convert result.rows to CSV would follow 
  res.json(result.rows);
});

// Admin Moderation and Audit Logging
// PATCH /api/admin/providers/:id/approve
app.patch('/api/admin/providers/:id/approve', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Update provider status 
    await client.query(
      "UPDATE ServiceProvider SET status = 'active' WHERE provider_id = $1", 
      [req.params.id]
    );
    // Log the action 
    await client.query(
      "INSERT INTO AuditLog (actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)",
      [req.user.id, 'APPROVE_PROVIDER', 'ServiceProvider', req.params.id]
    );
    await client.query('COMMIT');
    res.sendStatus(200);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).send(e.message);
  } finally {
    client.release();
  }
});