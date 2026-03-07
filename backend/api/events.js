app.get('/api/events', (req, res) => {
  // Retrieves upcoming events for the calendar and list views, with filters for date range and location
});
app.get('/api/events/:id', (req, res) => {
  // Returns full details for an event, including its associated service provider and map location
});
app.post('/api/events/:id/rsvp', (req, res) => {
  // Allows a logged-in user to register for an event and specify the number of guests
});
app.delete('/api/events', (req, res) => {
});
app.post('/api/events', (req, res) => {
  // Allows providers to manage their community events
} );

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
