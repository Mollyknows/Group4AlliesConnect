const { logEmail } = require("../utils/logging");
const { geocodeAddress } = require("../utils/geocode");
const { rateLimit } = require("../middleware/rateLimit");

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
          e.image_url,
          e.flyer_url,
          e.volunteer_only,
          e.attendance,
          e.created_at,
          s.name AS provider_name,
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
          e.image_url,
          e.flyer_url,
          e.volunteer_only,
          e.attendance,
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

  // POST /api/events
  // Body: { title, provider_id, street_address, city, state, zip, event_date, start_datetime, end_datetime, description, category_ids, shifts }
  app.post("/api/events", rateLimit(), async (req, res) => {
    const conn = await pool.promise().getConnection();
    try {
      const {
        title,
        provider_id,
        street_address,
        city,
        state,
        zip,
        event_date,
        start_datetime,
        end_datetime,
        description,
        capacity,
        category_ids,
        shifts,
        image_url,
        flyer_url,
        volunteer_only,
        latitude,
        longitude,
      } = req.body;

      if (
        !title ||
        !provider_id ||
        !street_address ||
        !city ||
        !state ||
        !zip ||
        !start_datetime ||
        !end_datetime ||
        !category_ids ||
        category_ids.length === 0
      ) {
        return res.status(400).json({ error: "Missing required fields." });
      }

      // Reject events scheduled in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDate = new Date(event_date || start_datetime);
      eventDate.setHours(0, 0, 0, 0);
      if (eventDate < today) {
        conn.release();
        return res
          .status(400)
          .json({ error: "Event date cannot be in the past." });
      }

      await conn.beginTransaction();

      // Use frontend-provided coordinates if available, otherwise fall back
      // to server-side geocoding
      let coords = null;
      if (latitude != null && longitude != null) {
        coords = { lat: Number(latitude), lng: Number(longitude) };
      } else {
        coords = await geocodeAddress({
          street: street_address,
          city,
          state,
          zip,
        });
      }

      // Check if a Location with this lat/lng already exists
      let locationId;
      if (coords?.lat != null && coords?.lng != null) {
        const [existing] = await conn.query(
          `SELECT location_id FROM Location WHERE latitude = ? AND longitude = ?`,
          [coords.lat, coords.lng],
        );
        if (existing.length > 0) {
          locationId = existing[0].location_id;
        }
      }

      // Create a new Location if no match was found
      if (!locationId) {
        const [locResult] = await conn.query(
          `INSERT INTO Location (street_address_1, city, state, zip, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            street_address,
            city,
            state,
            zip,
            coords?.lat || null,
            coords?.lng || null,
          ],
        );
        locationId = locResult.insertId;
      }

      // Insert event (uses the first category_id)
      const categoryId = category_ids[0];
      const [eventResult] = await conn.query(
        `INSERT INTO Event (provider_id, category_id, location_id, title, event_date, start_datetime, end_datetime, description, capacity, image_url, flyer_url, volunteer_only)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          provider_id,
          categoryId,
          locationId,
          title,
          event_date,
          start_datetime,
          end_datetime,
          description || null,
          capacity != null ? capacity : null,
          image_url || null,
          flyer_url || null,
          volunteer_only ? 1 : 0,
        ],
      );
      const eventId = eventResult.insertId;

      // If shifts are provided, create a VolunteerOpportunity and insert shifts
      if (Array.isArray(shifts) && shifts.length > 0) {
        const [oppResult] = await conn.query(
          `INSERT INTO VolunteerOpportunity (provider_id, location_id, event_id, title, status)
           VALUES (?, ?, ?, ?, 'open')`,
          [provider_id, locationId, eventId, `${title} - Volunteer Shifts`],
        );
        const opportunityId = oppResult.insertId;

        for (const shift of shifts) {
          await conn.query(
            `INSERT INTO VolunteerShift (opportunity_id, start_datetime, end_datetime, capacity)
             VALUES (?, ?, ?, ?)`,
            [
              opportunityId,
              shift.start_time,
              shift.end_time,
              shift.capacity != null ? shift.capacity : null,
            ],
          );
        }
      }

      await conn.commit();
      res
        .status(201)
        .json({ event_id: eventId, message: "Event created successfully." });
    } catch (err) {
      await conn.rollback();
      console.error("Error creating event:", err);
      res.status(500).json({ error: "Failed to create event." });
    } finally {
      conn.release();
    }
  });

  // PUT /api/events/:id
  // Updates event details
  app.put("/api/events/:id", rateLimit(), async (req, res) => {
    try {
      const eventId = req.params.id;
      const {
        title,
        description,
        capacity,
        registration_required,
        special_instructions,
        start_datetime,
        end_datetime,
        image_url,
        flyer_url,
        volunteer_only,
      } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Title is required." });
      }

      await pool.promise().query(
        `UPDATE Event
         SET title = ?, description = ?, capacity = ?, registration_required = ?,
             special_instructions = ?, start_datetime = ?, end_datetime = ?,
             image_url = ?, flyer_url = ?,
             volunteer_only = ?
         WHERE event_id = ?`,
        [
          title,
          description || null,
          capacity || null,
          registration_required || "unknown",
          special_instructions || null,
          start_datetime || null,
          end_datetime || null,
          image_url || null,
          flyer_url || null,
          volunteer_only ? 1 : 0,
          eventId,
        ],
      );

      res.json({ message: "Event updated successfully." });
    } catch (err) {
      console.error("Error updating event:", err);
      res.status(500).json({ error: "Failed to update event." });
    }
  });

  // POST /api/events/:id/attend
  // Increment the attendance counter by 1 (no login required)
  app.post("/api/events/:id/attend", rateLimit(), async (req, res) => {
    try {
      const eventId = req.params.id;

      await pool
        .promise()
        .query(
          `UPDATE Event SET attendance = COALESCE(attendance, 0) + 1 WHERE event_id = ?`,
          [eventId],
        );

      const [rows] = await pool
        .promise()
        .query(`SELECT attendance FROM Event WHERE event_id = ?`, [eventId]);

      res.json({ attendance: rows[0]?.attendance ?? 0 });
    } catch (err) {
      console.error("Error incrementing attendance:", err);
      res.status(500).json({ error: "Failed to record attendance" });
    }
  });

  // POST /api/events/:id/rsvp
  // Body: { userId, status }
  app.post("/api/events/:id/rsvp", rateLimit(), async (req, res) => {
    try {
      const eventId = req.params.id;
      const { userId, status } = req.body;

      if (!userId || !status) {
        return res.status(400).json({
          error: "userId and status are required",
        });
      }

      if (!["yes", "no"].includes(status)) {
        return res.status(400).json({
          error: "status must be 'yes' or 'no'",
        });
      }

      const query = `
        INSERT INTO EventRSVP (event_id, user_id, status)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE status = VALUES(status)
      `;

      await pool.promise().query(query, [eventId, userId, status]);

      // Recalculate attendance count from all "yes" RSVPs
      await pool.promise().query(
        `UPDATE Event SET attendance = (
           SELECT COUNT(*) FROM EventRSVP WHERE event_id = ? AND status = 'yes'
         ) WHERE event_id = ?`,
        [eventId, eventId],
      );

      await logEmail(pool, userId, eventId, "event_confirmation", "sent");

      res.status(201).json({
        message: "RSVP recorded successfully",
      });
    } catch (err) {
      console.error("Error recording RSVP:", err);
      res.status(500).json({ error: "Failed to record RSVP" });
    }
  });

  // GET /api/events/:id/rsvp/:userId
  // Check a user's RSVP status for an event
  app.get("/api/events/:id/rsvp/:userId", async (req, res) => {
    try {
      const { id: eventId, userId } = req.params;

      const [rows] = await pool
        .promise()
        .query(
          "SELECT event_rsvp_id, status FROM EventRSVP WHERE event_id = ? AND user_id = ?",
          [eventId, userId],
        );

      if (rows.length === 0) {
        return res.json({ rsvp: null });
      }

      res.json({ rsvp: rows[0] });
    } catch (err) {
      console.error("Error fetching RSVP status:", err);
      res.status(500).json({ error: "Failed to fetch RSVP status" });
    }
  });
};
