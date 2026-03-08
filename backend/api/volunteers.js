module.exports = function (app, pool) {
  // GET /api/volunteer-opportunities
  // Optional filters: zip, provider_id, event_id, resource_id
  app.get("/api/volunteer-opportunities", async (req, res) => {
    try {
      const { zip, provider_id, event_id, resource_id } = req.query;

      let query = `
        SELECT
          vo.opportunity_id,
          vo.provider_id,
          vo.location_id,
          vo.event_id,
          vo.resource_id,
          vo.title,
          vo.status,
          vo.contact_name,
          vo.contact_email,
          vo.contact_phone,
          vo.created_at,
          sp.name AS provider_name,
          l.street_address_1,
          l.street_address_2,
          l.city,
          l.state,
          l.zip
        FROM VolunteerOpportunity vo
        JOIN ServiceProvider sp ON vo.provider_id = sp.provider_id
        LEFT JOIN Location l ON vo.location_id = l.location_id
        WHERE 1=1
      `;

      const params = [];

      if (zip) {
        query += " AND l.zip = ?";
        params.push(zip);
      }

      if (provider_id) {
        query += " AND vo.provider_id = ?";
        params.push(provider_id);
      }

      if (event_id) {
        query += " AND vo.event_id = ?";
        params.push(event_id);
      }

      if (resource_id) {
        query += " AND vo.resource_id = ?";
        params.push(resource_id);
      }

      query += " ORDER BY vo.created_at DESC";

      const [rows] = await pool.promise().query(query, params);
      res.json(rows);
    } catch (err) {
      console.error("Error fetching volunteer opportunities:", err);
      res.status(500).json({ error: "Failed to fetch volunteer opportunities" });
    }
  });

  // GET /api/volunteer-opportunities/:id
  // Returns opportunity details with associated shifts
  app.get("/api/volunteer-opportunities/:id", async (req, res) => {
    try {
      const opportunityId = req.params.id;

      const [opportunityRows] = await pool.promise().query(
        `
        SELECT
          vo.opportunity_id,
          vo.provider_id,
          vo.location_id,
          vo.event_id,
          vo.resource_id,
          vo.title,
          vo.status,
          vo.contact_name,
          vo.contact_email,
          vo.contact_phone,
          vo.created_at,
          sp.name AS provider_name,
          l.street_address_1,
          l.street_address_2,
          l.city,
          l.state,
          l.zip
        FROM VolunteerOpportunity vo
        JOIN ServiceProvider sp ON vo.provider_id = sp.provider_id
        LEFT JOIN Location l ON vo.location_id = l.location_id
        WHERE vo.opportunity_id = ?
        `,
        [opportunityId]
      );

      if (opportunityRows.length === 0) {
        return res.status(404).json({ error: "Volunteer opportunity not found" });
      }

      const [shiftRows] = await pool.promise().query(
        `
        SELECT
          shift_id,
          opportunity_id,
          start_datetime,
          end_datetime,
          capacity
        FROM VolunteerShift
        WHERE opportunity_id = ?
        ORDER BY start_datetime ASC
        `,
        [opportunityId]
      );

      res.json({
        ...opportunityRows[0],
        shifts: shiftRows
      });
    } catch (err) {
      console.error("Error fetching volunteer opportunity details:", err);
      res.status(500).json({ error: "Failed to fetch volunteer opportunity details" });
    }
  });

  // POST /api/volunteer-signups
  // Body: { shift_id, user_id }
  app.post("/api/volunteer-signups", async (req, res) => {
    try {
      const { shift_id, user_id } = req.body;

      if (!shift_id || !user_id) {
        return res.status(400).json({
          error: "shift_id and user_id are required"
        });
      }

      const query = `
        INSERT INTO VolunteerSignup (shift_id, user_id, status)
        VALUES (?, ?, 'registered')
      `;

      const [result] = await pool.promise().query(query, [shift_id, user_id]);

      res.status(201).json({
        message: "Volunteer signup created successfully",
        signup_id: result.insertId
      });
    } catch (err) {
      console.error("Error creating volunteer signup:", err);
      res.status(500).json({ error: "Failed to create volunteer signup" });
    }
  });

  // DELETE /api/volunteer-signups/:id
  // Cancels a volunteer registration by updating status
  app.delete("/api/volunteer-signups/:id", async (req, res) => {
    try {
      const signupId = req.params.id;

      await pool.promise().query(
        "UPDATE VolunteerSignup SET status = 'cancelled' WHERE signup_id = ?",
        [signupId]
      );

      res.json({ message: "Volunteer signup cancelled successfully" });
    } catch (err) {
      console.error("Error cancelling volunteer signup:", err);
      res.status(500).json({ error: "Failed to cancel volunteer signup" });
    }
  });

  // POST /api/volunteer-opportunities
  // Creates a volunteer opportunity
  app.post("/api/volunteer-opportunities", async (req, res) => {
    try {
      const {
        provider_id,
        location_id,
        event_id,
        resource_id,
        title,
        status,
        contact_name,
        contact_email,
        contact_phone
      } = req.body;

      if (!provider_id || !title) {
        return res.status(400).json({
          error: "provider_id and title are required"
        });
      }

      const query = `
        INSERT INTO VolunteerOpportunity
        (provider_id, location_id, event_id, resource_id, title, status, contact_name, contact_email, contact_phone, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      const [result] = await pool.promise().query(query, [
        provider_id,
        location_id || null,
        event_id || null,
        resource_id || null,
        title,
        status || "open",
        contact_name || null,
        contact_email || null,
        contact_phone || null
      ]);

      res.status(201).json({
        message: "Volunteer opportunity created successfully",
        opportunity_id: result.insertId
      });
    } catch (err) {
      console.error("Error creating volunteer opportunity:", err);
      res.status(500).json({ error: "Failed to create volunteer opportunity" });
    }
  });

  // PUT /api/volunteer-opportunities/:id
  // Updates a volunteer opportunity
  app.put("/api/volunteer-opportunities/:id", async (req, res) => {
    try {
      const opportunityId = req.params.id;
      const {
        location_id,
        event_id,
        resource_id,
        title,
        status,
        contact_name,
        contact_email,
        contact_phone
      } = req.body;

      const query = `
        UPDATE VolunteerOpportunity
        SET
          location_id = ?,
          event_id = ?,
          resource_id = ?,
          title = ?,
          status = ?,
          contact_name = ?,
          contact_email = ?,
          contact_phone = ?
        WHERE opportunity_id = ?
      `;

      await pool.promise().query(query, [
        location_id || null,
        event_id || null,
        resource_id || null,
        title,
        status,
        contact_name || null,
        contact_email || null,
        contact_phone || null,
        opportunityId
      ]);

      res.json({ message: "Volunteer opportunity updated successfully" });
    } catch (err) {
      console.error("Error updating volunteer opportunity:", err);
      res.status(500).json({ error: "Failed to update volunteer opportunity" });
    }
  });

  // DELETE /api/volunteer-opportunities/:id
  // Deletes a volunteer opportunity
  app.delete("/api/volunteer-opportunities/:id", async (req, res) => {
    try {
      const opportunityId = req.params.id;

      await pool.promise().query(
        "DELETE FROM VolunteerOpportunity WHERE opportunity_id = ?",
        [opportunityId]
      );

      res.json({ message: "Volunteer opportunity deleted successfully" });
    } catch (err) {
      console.error("Error deleting volunteer opportunity:", err);
      res.status(500).json({ error: "Failed to delete volunteer opportunity" });
    }
  });
};
