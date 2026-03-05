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
app.post('/api/volunteer-opportunities', (req, res) => {
 // Allows providers to manage their community events
});

app.put('/api/volunteer-opportunities', (req, res) => {
});
app.delete('/api/volunteer-opportunities', (req, res) => {
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
