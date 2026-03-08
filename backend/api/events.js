module.exports = function (app, pool) {
  // GET /api/events
  // Optional filters: category, zip, date_from, date_to
  app.get("/api/events", async (req, res) => {
    try {
      const { category, zip, date_from, date_to } = req.query;

      let query = `
        SELECT 
          e.event_id,
          e.provider_id,
          e.category_id,
          e.location_id,
          e.title,
          e.event_date,
          e.start_datetime,
          e.end_datetime,
          e.description,
          e.capacity,
          e.registration_required,
          e.special_instructions,
          e.created_at,
          s.name AS provider_name,
          c.name AS category_name,
          l.street_address_1,
          l.street_address_2,
          l.city,
          l.state,
          l.zip
        FROM Event e
        JOIN ServiceProvider s ON e.provider_id = s.provider_id
        JOIN Category c ON e.category_id = c.category_id
        JOIN Location l ON e.location_id = l.location_id
        WHERE 1=1
      `;

      const params = [];

      if (category) {
        query += " AND c.name = ?";
        params.push(category);
      }

      if (zip) {
        query += " AND l.zip = ?";
        params.push(zip);
      }

      if (date_from) {
        query += " AND e.start_datetime >= ?";
        params.push(date_from);
      }

      if (date_to) {
        query += " AND e.start_datetime <= ?";
        params.push(date_to);
      }

      query += " ORDER BY e.start_datetime ASC";

      const [rows] = await pool.promise().query(query, params);
      res.json(rows);
    } catch (err) {
      console.error("Error fetching events:", err);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // GET /api/events/:id
  // Returns full event details
  app.get("/api/events/:id", async (req, res) => {
    try {
      const eventId = req.params.id;

      const query = `
        SELECT 
          e.event_id,
          e.provider_id,
          e.category_id,
          e.location_id,
          e.title,
          e.event_date,
          e.start_datetime,
          e.end_datetime,
          e.description,
          e.capacity,
          e.registration_required,
          e.special_instructions,
          e.created_at,
          s.name AS provider_name,
          s.website AS provider_website,
          s.contact_name,
          s.contact_email,
          s.contact_phone,
          c.name AS category_name,
          l.street_address_1,
          l.street_address_2,
          l.city,
          l.state,
          l.zip,
          l.latitude,
          l.longitude
        FROM Event e
        JOIN ServiceProvider s ON e.provider_id = s.provider_id
        JOIN Category c ON e.category_id = c.category_id
        JOIN Location l ON e.location_id = l.location_id
        WHERE e.event_id = ?
      `;

      const [rows] = await pool.promise().query(query, [eventId]);

      if (rows.length === 0) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json(rows[0]);
    } catch (err) {
      console.error("Error fetching event details:", err);
      res.status(500).json({ error: "Failed to fetch event details" });
    }
  });

  // POST /api/events/:id/rsvp
  // Body: { userId, status }
  app.post("/api/events/:id/rsvp", async (req, res) => {
    try {
      const eventId = req.params.id;
      const { userId, status } = req.body;

      if (!userId || !status) {
        return res.status(400).json({
          error: "userId and status are required"
        });
      }

      if (!["yes", "no"].includes(status)) {
        return res.status(400).json({
          error: "status must be 'yes' or 'no'"
        });
      }

      const query = `
        INSERT INTO EventRSVP (event_id, user_id, status)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE status = VALUES(status)
      `;

      await pool.promise().query(query, [eventId, userId, status]);

      res.status(201).json({
        message: "RSVP recorded successfully"
      });
    } catch (err) {
      console.error("Error recording RSVP:", err);
      res.status(500).json({ error: "Failed to record RSVP" });
    }
  });
};
