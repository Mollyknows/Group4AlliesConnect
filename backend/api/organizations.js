module.exports = function (app, pool) {
  // POST /api/organizations/register
  // Creates a provider claim request for a service provider
  app.post("/api/organizations/register", async (req, res) => {
    try {
      const {
        provider_id,
        user_id,
        verification_method
      } = req.body;

      if (!provider_id || !user_id) {
        return res.status(400).json({
          error: "provider_id and user_id are required"
        });
      }

      const query = `
        INSERT INTO ServiceProviderClaim (provider_id, user_id, status, verification_method)
        VALUES (?, ?, 'pending', ?)
      `;

      const [result] = await pool.promise().query(query, [
        provider_id,
        user_id,
        verification_method || null
      ]);

      res.status(201).json({
        message: "Organization registration claim submitted successfully",
        claim_id: result.insertId
      });
    } catch (err) {
      console.error("Error registering organization claim:", err);
      res.status(500).json({ error: "Failed to register organization claim" });
    }
  });

  // GET /api/organizations/profile/:id
  // Returns organization profile details
  app.get("/api/organizations/profile/:id", async (req, res) => {
    try {
      const providerId = req.params.id;

      const [rows] = await pool.promise().query(
        `
        SELECT
          provider_id,
          location_id,
          name,
          common_name,
          phone_number,
          website,
          organization_type,
          mission,
          contact_name,
          contact_email,
          contact_phone,
          operating_hours,
          languages_spoken,
          accessibility,
          logo_url,
          status
        FROM ServiceProvider
        WHERE provider_id = ?
        `,
        [providerId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Organization profile not found" });
      }

      res.json(rows[0]);
    } catch (err) {
      console.error("Error fetching organization profile:", err);
      res.status(500).json({ error: "Failed to fetch organization profile" });
    }
  });

  // PUT /api/organizations/profile/:id
  // Updates organization profile details
  app.put("/api/organizations/profile/:id", async (req, res) => {
    try {
      const providerId = req.params.id;
      const {
        common_name,
        phone_number,
        website,
        organization_type,
        mission,
        contact_name,
        contact_email,
        contact_phone,
        operating_hours,
        languages_spoken,
        accessibility,
        logo_url
      } = req.body;

      const query = `
        UPDATE ServiceProvider
        SET
          common_name = ?,
          phone_number = ?,
          website = ?,
          organization_type = ?,
          mission = ?,
          contact_name = ?,
          contact_email = ?,
          contact_phone = ?,
          operating_hours = ?,
          languages_spoken = ?,
          accessibility = ?,
          logo_url = ?
        WHERE provider_id = ?
      `;

      await pool.promise().query(query, [
        common_name || null,
        phone_number || null,
        website || null,
        organization_type || null,
        mission || null,
        contact_name || null,
        contact_email || null,
        contact_phone || null,
        operating_hours || null,
        languages_spoken || null,
        accessibility || null,
        logo_url || null,
        providerId
      ]);

      res.json({ message: "Organization profile updated successfully" });
    } catch (err) {
      console.error("Error updating organization profile:", err);
      res.status(500).json({ error: "Failed to update organization profile" });
    }
  });

  // GET /api/organizations/signups/export/:shiftId
  // Returns volunteer signup roster data for a shift
  app.get("/api/organizations/signups/export/:shiftId", async (req, res) => {
    try {
      const shiftId = req.params.shiftId;

      const query = `
        SELECT
          vs.signup_id,
          vs.shift_id,
          vs.user_id,
          vs.status,
          up.first_name,
          up.last_name,
          up.phone,
          up.zip_code,
          u.email
        FROM VolunteerSignup vs
        JOIN User u ON vs.user_id = u.user_id
        JOIN UserProfile up ON u.user_id = up.user_id
        WHERE vs.shift_id = ?
        ORDER BY up.last_name ASC, up.first_name ASC
      `;

      const [rows] = await pool.promise().query(query, [shiftId]);

      res.json(rows);
    } catch (err) {
      console.error("Error exporting volunteer signups:", err);
      res.status(500).json({ error: "Failed to export volunteer signups" });
    }
  });
};
