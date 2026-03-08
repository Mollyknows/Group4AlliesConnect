module.exports = function (app, pool) {
  // GET /api/resources
  // Optional filters: category, zip
  app.get("/api/resources", async (req, res) => {
    try {
      const { category, zip } = req.query;

      let query = `
        SELECT
          r.resource_id,
          r.provider_id,
          r.category_id,
          r.location_id,
          r.name,
          r.description,
          r.hours,
          s.name AS provider_name,
          c.name AS category_name,
          l.street_address_1,
          l.street_address_2,
          l.city,
          l.state,
          l.zip,
          l.latitude,
          l.longitude
        FROM Resource r
        JOIN ServiceProvider s ON r.provider_id = s.provider_id
        JOIN Category c ON r.category_id = c.category_id
        JOIN Location l ON r.location_id = l.location_id
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

      query += " ORDER BY r.name ASC";

      const [rows] = await pool.promise().query(query, params);
      res.json(rows);
    } catch (err) {
      console.error("Error fetching resources:", err);
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  });

  // GET /api/resources/:id
  // Returns full resource details
  app.get("/api/resources/:id", async (req, res) => {
    try {
      const resourceId = req.params.id;

      const query = `
        SELECT
          r.resource_id,
          r.provider_id,
          r.category_id,
          r.location_id,
          r.name,
          r.description,
          r.hours,
          s.name AS provider_name,
          s.website,
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
        FROM Resource r
        JOIN ServiceProvider s ON r.provider_id = s.provider_id
        JOIN Category c ON r.category_id = c.category_id
        JOIN Location l ON r.location_id = l.location_id
        WHERE r.resource_id = ?
      `;

      const [rows] = await pool.promise().query(query, [resourceId]);

      if (rows.length === 0) {
        return res.status(404).json({ error: "Resource not found" });
      }

      res.json(rows[0]);
    } catch (err) {
      console.error("Error fetching resource details:", err);
      res.status(500).json({ error: "Failed to fetch resource details" });
    }
  });

  // GET /api/categories
  // Returns available categories for filters
  app.get("/api/categories", async (req, res) => {
    try {
      const [rows] = await pool.promise().query(
        "SELECT category_id, name, type FROM Category ORDER BY name ASC"
      );

      res.json(rows);
    } catch (err) {
      console.error("Error fetching categories:", err);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // POST /api/resources
  // Creates a new resource
  app.post("/api/resources", async (req, res) => {
    try {
      const {
        provider_id,
        category_id,
        location_id,
        name,
        description,
        hours
      } = req.body;

      if (!provider_id || !category_id || !location_id || !name) {
        return res.status(400).json({
          error: "provider_id, category_id, location_id, and name are required"
        });
      }

      const query = `
        INSERT INTO Resource (provider_id, category_id, location_id, name, description, hours)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [result] = await pool.promise().query(query, [
        provider_id,
        category_id,
        location_id,
        name,
        description || null,
        hours || null
      ]);

      res.status(201).json({
        message: "Resource created successfully",
        resource_id: result.insertId
      });
    } catch (err) {
      console.error("Error creating resource:", err);
      res.status(500).json({ error: "Failed to create resource" });
    }
  });

  // PUT /api/resources/:id
  // Updates an existing resource
  app.put("/api/resources/:id", async (req, res) => {
    try {
      const resourceId = req.params.id;
      const {
        category_id,
        location_id,
        name,
        description,
        hours
      } = req.body;

      const query = `
        UPDATE Resource
        SET category_id = ?, location_id = ?, name = ?, description = ?, hours = ?
        WHERE resource_id = ?
      `;

      await pool.promise().query(query, [
        category_id,
        location_id,
        name,
        description || null,
        hours || null,
        resourceId
      ]);

      res.json({ message: "Resource updated successfully" });
    } catch (err) {
      console.error("Error updating resource:", err);
      res.status(500).json({ error: "Failed to update resource" });
    }
  });

  // DELETE /api/resources/:id
  // Deletes a resource
  app.delete("/api/resources/:id", async (req, res) => {
    try {
      const resourceId = req.params.id;

      await pool.promise().query(
        "DELETE FROM Resource WHERE resource_id = ?",
        [resourceId]
      );

      res.json({ message: "Resource deleted successfully" });
    } catch (err) {
      console.error("Error deleting resource:", err);
      res.status(500).json({ error: "Failed to delete resource" });
    }
  });
};
