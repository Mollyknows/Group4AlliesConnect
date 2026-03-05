app.get('/api/resources', (req, res) => {
  // Retrieves a list of resources. Supports query parameters for filtering by zip code, category, date, and geolocation search radius
});
app.get('/api/resources/:id', (req, res) => {
  // Provides detailed information for a specific resource, including contact info, social media links, and eligibility requirements
});

app.get('/api/categories', (req, res) => {
  // Fetches the available resource and event categories (e.g., Food, Housing, Legal) for the filter panel
});
app.post('/api/resources', (req, res) => {
  // Allows providers to manage their own resource listings
});

app.put('/api/resources', (req, res) => {
});
app.delete('/api/resources', (req, res) => {
});

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
