const { logAudit } = require("../utils/logging");
const { requireRole } = require("../middleware/permissions");
const { geocodeAddress } = require("../utils/geocode");
const { rateLimit } = require("../middleware/rateLimit");

const VALID_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/**
 * Validate that an hours object has the correct structure:
 * { monday: { closed: bool, open: string, close: string }, ... }
 * Returns null if valid, or an error message string if invalid.
 */
function validateHours(hours) {
  if (typeof hours !== "object" || hours === null || Array.isArray(hours)) {
    return "Hours must be a JSON object with day keys.";
  }

  for (const day of VALID_DAYS) {
    if (!(day in hours)) {
      return `Missing day: ${day}`;
    }
    const entry = hours[day];
    if (typeof entry !== "object" || entry === null) {
      return `Invalid entry for ${day}: must be an object.`;
    }
    if (typeof entry.closed !== "boolean") {
      return `Invalid entry for ${day}: 'closed' must be a boolean.`;
    }
    if (typeof entry.open !== "string" || typeof entry.close !== "string") {
      return `Invalid entry for ${day}: 'open' and 'close' must be strings.`;
    }
  }

  return null;
}

/**
 * Normalize hours input to a validated JSON string.
 * Accepts either a plain object or a JSON-encoded string.
 * Returns { value: string } on success or { error: string } on failure.
 */
function normalizeHours(hours) {
  let parsed = hours;
  if (typeof hours === "string") {
    try {
      parsed = JSON.parse(hours);
    } catch {
      return { error: "Hours must be a valid JSON object." };
    }
  }

  const validationError = validateHours(parsed);
  if (validationError) {
    return { error: validationError };
  }

  return { value: JSON.stringify(parsed) };
}

/**
 * Safely parse a stored hours JSON string back into an object.
 * Returns the original value if parsing fails (backward-compatible
 * with any old plain-text hours still in the database).
 */
function parseHours(hours) {
  if (!hours) return hours;
  try {
    return typeof hours === "string" ? JSON.parse(hours) : hours;
  } catch {
    return hours;
  }
}

async function resolveLocationId(queryable, address) {
  const { street_address, city, state, zip, latitude, longitude } = address;

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

  let locationId;
  if (coords?.lat != null && coords?.lng != null) {
    const [existing] = await queryable.query(
      `SELECT location_id FROM Location WHERE latitude = ? AND longitude = ?`,
      [coords.lat, coords.lng],
    );

    if (existing.length > 0) {
      locationId = existing[0].location_id;
    }
  }

  if (!locationId) {
    const [locResult] = await queryable.query(
      `INSERT INTO Location (street_address_1, city, state, zip, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?)`,
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

  return locationId;
}

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
          r.image_url,
          r.eligibility_requirements,
          r.contact_name,
          r.contact_email,
          r.contact_phone,
          r.languages_spoken,
          r.accessibility,
          r.social_media_links,
          r.volunteer_application_prompt,
          r.website,
          s.name AS provider_name,
          s.website AS provider_website,
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
      const result = rows.map((row) => ({
        ...row,
        hours: parseHours(row.hours),
      }));
      res.json(result);
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
          r.image_url,
          r.eligibility_requirements,
          r.contact_name,
          r.contact_email,
          r.contact_phone,
          r.languages_spoken,
          r.accessibility,
          r.social_media_links,
          r.volunteer_application_prompt,
          r.website,
          s.name AS provider_name,
          s.website AS provider_website,
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

      const resource = { ...rows[0], hours: parseHours(rows[0].hours) };
      res.json(resource);
    } catch (err) {
      console.error("Error fetching resource details:", err);
      res.status(500).json({ error: "Failed to fetch resource details" });
    }
  });

  // GET /api/categories
  // Returns available categories for filters
  app.get("/api/categories", async (req, res) => {
    try {
      const [rows] = await pool
        .promise()
        .query(
          "SELECT category_id, name, type FROM Category ORDER BY name ASC",
        );

      res.json(rows);
    } catch (err) {
      console.error("Error fetching categories:", err);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // POST /api/resources
  // Creates a new resource with location
  app.post(
    "/api/resources",
    rateLimit(),
    requireRole(pool, "provider"),
    async (req, res) => {
      const conn = await pool.promise().getConnection();

      try {
        const {
          provider_id,
          name,
          street_address,
          city,
          state,
          zip,
          hours,
          category_ids,
          image_url,
          description,
          eligibility_requirements,
          contact_name,
          contact_email,
          contact_phone,
          languages_spoken,
          accessibility,
          website,
          social_media_links,
          latitude,
          longitude,
        } = req.body;

        if (
          !provider_id ||
          !name ||
          !street_address ||
          !city ||
          !state ||
          !zip ||
          !hours ||
          !category_ids ||
          category_ids.length === 0
        ) {
          conn.release();
          return res.status(400).json({ error: "Missing required fields." });
        }

        // Validate and normalize hours to a JSON string
        const hoursResult = normalizeHours(hours);
        if (hoursResult.error) {
          conn.release();
          return res
            .status(400)
            .json({ error: `Invalid hours: ${hoursResult.error}` });
        }
        const hoursJson = hoursResult.value;

        await conn.beginTransaction();

        const locationId = await resolveLocationId(conn, {
          street_address,
          city,
          state,
          zip,
          latitude,
          longitude,
        });

        // Use first category_id for now
        const categoryId = category_ids[0];

        const [resourceResult] = await conn.query(
          `INSERT INTO Resource (
          provider_id,
          category_id,
          location_id,
          name,
          description,
          hours,
          image_url,
          eligibility_requirements,
          contact_name,
          contact_email,
          contact_phone,
          languages_spoken,
          accessibility,
          website,
          social_media_links
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            provider_id,
            categoryId,
            locationId,
            name,
            description || null,
            hoursJson,
            image_url || null,
            eligibility_requirements || null,
            contact_name || null,
            contact_email || null,
            contact_phone || null,
            languages_spoken || null,
            accessibility || null,
            website || null,
            social_media_links || null,
          ],
        );

        await conn.commit();

        await logAudit(
          pool,
          1,
          "CREATE_RESOURCE",
          "Resource",
          resourceResult.insertId,
        );

        res.status(201).json({
          message: "Resource created successfully",
          resource_id: resourceResult.insertId,
        });
      } catch (err) {
        await conn.rollback();
        console.error("Error creating resource:", err);
        res.status(500).json({ error: "Failed to create resource" });
      } finally {
        conn.release();
      }
    },
  );

  // PUT /api/resources/:id
  // Updates an existing resource
  app.put(
    "/api/resources/:id",
    rateLimit(),
    requireRole(pool, "provider"),
    async (req, res) => {
      try {
        const resourceId = req.params.id;
        const {
          category_id,
          location_id,
          street_address,
          city,
          state,
          zip,
          latitude,
          longitude,
          name,
          description,
          hours,
          image_url,
          eligibility_requirements,
          contact_name,
          contact_email,
          contact_phone,
          languages_spoken,
          accessibility,
          social_media_links,
          website,
        } = req.body;

        const hasAnyAddressField = [street_address, city, state, zip].some(
          (value) => value !== undefined,
        );
        const hasAllAddressFields = [street_address, city, state, zip].every(
          (value) => Boolean(value),
        );

        if (hasAnyAddressField && !hasAllAddressFields) {
          return res.status(400).json({
            error:
              "Street address, city, state, and zip are all required when updating a resource location.",
          });
        }

        // Validate and normalize hours if provided
        let hoursJson = null;
        if (hours) {
          const hoursResult = normalizeHours(hours);
          if (hoursResult.error) {
            return res
              .status(400)
              .json({ error: `Invalid hours: ${hoursResult.error}` });
          }
          hoursJson = hoursResult.value;
        }

        let resolvedLocationId = location_id;
        if (hasAllAddressFields) {
          resolvedLocationId = await resolveLocationId(pool.promise(), {
            street_address,
            city,
            state,
            zip,
            latitude,
            longitude,
          });
        }

        const query = `
        UPDATE Resource
        SET
          category_id = ?,
          location_id = ?,
          name = ?,
          description = ?,
          hours = ?,
          image_url = ?,
          eligibility_requirements = ?,
          contact_name = ?,
          contact_email = ?,
          contact_phone = ?,
          languages_spoken = ?,
          accessibility = ?,
          website = ?,
          social_media_links = ?
        WHERE resource_id = ?
      `;

        await pool
          .promise()
          .query(query, [
            category_id,
            resolvedLocationId,
            name,
            description || null,
            hoursJson,
            image_url || null,
            eligibility_requirements || null,
            contact_name || null,
            contact_email || null,
            contact_phone || null,
            languages_spoken || null,
            accessibility || null,
            website || null,
            social_media_links || null,
            resourceId,
          ]);

        await logAudit(pool, 1, "UPDATE_RESOURCE", "Resource", resourceId);

        res.json({ message: "Resource updated successfully" });
      } catch (err) {
        console.error("Error updating resource:", err);
        res.status(500).json({ error: "Failed to update resource" });
      }
    },
  );

  // DELETE /api/resources/:id
  // Deletes a resource
  app.delete(
    "/api/resources/:id",
    requireRole(pool, "provider"),
    async (req, res) => {
      try {
        const resourceId = req.params.id;

        await pool
          .promise()
          .query("DELETE FROM Resource WHERE resource_id = ?", [resourceId]);

        await logAudit(pool, 1, "DELETE_RESOURCE", "Resource", resourceId);

        res.json({ message: "Resource deleted successfully" });
      } catch (err) {
        console.error("Error deleting resource:", err);
        res.status(500).json({ error: "Failed to delete resource" });
      }
    },
  );
};
