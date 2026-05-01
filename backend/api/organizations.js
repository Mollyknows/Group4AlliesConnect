const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { requireRole } = require("../middleware/permissions");
const { rateLimit } = require("../middleware/rateLimit");
const { sendOrgInviteEmail } = require("../utils/email");
const { saltRounds, getFrontendUrl } = require("../utils/config");
const {
  isValidPhoneFormat,
  isValidEmailFormat,
  isValidPasswordFormat,
  isValidUsernameFormat,
  isValidEINFormat,
} = require("../utils/validation");

module.exports = function (app, pool) {
  // GET /api/organizations/verify-ein/:ein
  // Verifies an EIN number using the ProPublica Nonprofit Explorer API
  app.get("/api/organizations/verify-ein/:ein", async (req, res) => {
    try {
      const ein = req.params.ein.replace(/\D/g, ""); // Strip formatting, keep digits only

      if (ein.length !== 9) {
        return res.status(400).json({ error: "EIN must be exactly 9 digits" });
      }

      const response = await fetch(
        `https://projects.propublica.org/nonprofits/api/v2/organizations/${ein}.json`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          return res
            .status(404)
            .json({ error: "No organization found with that EIN" });
        }
        return res
          .status(502)
          .json({ error: "Failed to verify EIN with external service" });
      }

      const data = await response.json();
      const org = data.organization;

      res.json({
        name: org.name,
        ein: org.strein,
        city: org.city,
        state: org.state,
        address: org.address,
        zipcode: org.zipcode,
        ntee_code: org.ntee_code,
      });
    } catch (err) {
      console.error("Error verifying EIN:", err);
      res.status(500).json({ error: "Failed to verify EIN" });
    }
  });

  // POST /api/organizations/register
  // Creates a new user, provider, and provider claim
  app.post(
    "/api/organizations/register",
    rateLimit({ windowMs: 60000, max: 5 }),
    async (req, res) => {
      try {
        const {
          username,
          email,
          password,
          organization_name,
          phone_number,
          first_name,
          last_name,
          zip_code,
          ein,
          verification_method,
        } = req.body;

        if (
          !username ||
          !email ||
          !password ||
          !first_name ||
          !last_name ||
          !organization_name ||
          !phone_number ||
          !zip_code ||
          !ein
        ) {
          return res.status(400).json({
            error:
              "username, email, password, first_name, last_name, organization_name, phone_number, zip_code, and ein are required",
          });
        }

        // Validate formats
        if (!isValidUsernameFormat(username)) {
          return res.status(400).json({
            error:
              "Username must be 3-50 characters, contain only letters, numbers, underscores, and hyphens, with no spaces",
          });
        }

        if (!isValidEmailFormat(email)) {
          return res.status(400).json({
            error: "Invalid email format",
          });
        }

        if (!isValidPasswordFormat(password)) {
          return res.status(400).json({
            error:
              "Password must be seven characters or longer, contain at least one capital letter, one special character (!@#$%^&*()_+-=[]{}|;:',./~`), and no spaces",
          });
        }

        if (phone_number && !isValidPhoneFormat(phone_number)) {
          return res.status(400).json({
            error: "Phone number must be 10 digits",
          });
        }

        if (!isValidEINFormat(ein)) {
          return res.status(400).json({
            error: "EIN must be in the format XX-XXXXXXX (9 digits)",
          });
        }

        const [existingEmails] = await pool
          .promise()
          .query("SELECT user_id FROM User WHERE email = ?", [email]);

        if (existingEmails.length > 0) {
          return res.status(400).json({
            error: "An account with that email already exists",
          });
        }

        const [existingUsernames] = await pool
          .promise()
          .query("SELECT user_id FROM User WHERE username = ?", [username]);

        if (existingUsernames.length > 0) {
          return res.status(400).json({
            error: "That username is already in use",
          });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const [userResult] = await pool
          .promise()
          .query(
            "INSERT INTO User (username, email, password_hash, status) VALUES (?, ?, ?, 'active')",
            [username, email, hashedPassword],
          );

        const userId = userResult.insertId;

        await pool
          .promise()
          .query(
            "INSERT INTO UserProfile (user_id, first_name, last_name, phone, zip_code) VALUES (?, ?, ?, ?, ?)",
            [userId, first_name, last_name, phone_number, zip_code],
          );

        const [providerResult] = await pool.promise().query(
          `INSERT INTO ServiceProvider (name, ein, phone_number, status)
         VALUES (?, ?, ?, 'pending')`,
          [organization_name, ein, phone_number],
        );

        const providerId = providerResult.insertId;

        await pool.promise().query(
          `INSERT INTO ServiceProviderClaim (provider_id, user_id, status, verification_method)
         VALUES (?, ?, 'pending', ?)`,
          [providerId, userId, verification_method || "ein"],
        );

        await pool
          .promise()
          .query(
            "INSERT INTO UserRole (user_id, role_id) SELECT ?, role_id FROM Role WHERE role_name = 'provider'",
            [userId],
          );

        await pool
          .promise()
          .query(
            "INSERT INTO ServiceProviderUser (provider_id, user_id) VALUES (?, ?)",
            [providerId, userId],
          );

        res.status(201).json({
          message: "Organization registered successfully",
          user_id: userId,
          provider_id: providerId,
        });
      } catch (err) {
        console.error("Error registering organization:", err);
        res.status(500).json({ error: "Failed to register organization" });
      }
    },
  );

  // PUT /api/organizations/:id/application-notes
  // Saves supplementary application notes submitted after registration (no auth required
  // since the provider has not yet been approved and cannot log in).
  app.put(
    "/api/organizations/:id/application-notes",
    rateLimit(),
    async (req, res) => {
      try {
        const providerId = req.params.id;
        const { application_notes } = req.body;
        await pool
          .promise()
          .query(
            "UPDATE ServiceProvider SET application_notes = ? WHERE provider_id = ?",
            [application_notes || null, providerId],
          );
        res.json({ message: "Application notes saved" });
      } catch (err) {
        console.error("Error saving application notes:", err);
        res.status(500).json({ error: "Failed to save application notes" });
      }
    },
  );

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
          ein,
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
        [providerId],
      );

      if (rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Organization profile not found" });
      }

      res.json(rows[0]);
    } catch (err) {
      console.error("Error fetching organization profile:", err);
      res.status(500).json({ error: "Failed to fetch organization profile" });
    }
  });

  // PUT /api/organizations/profile/:id
  // Updates organization profile details
  app.put(
    "/api/organizations/profile/:id",
    rateLimit(),
    requireRole(pool, "provider"),
    async (req, res) => {
      try {
        const providerId = req.params.id;
        const {
          common_name,
          phone_number: rawPhone,
          website,
          organization_type,
          mission,
          contact_name,
          contact_email,
          contact_phone: rawContactPhone,
          operating_hours,
          languages_spoken,
          accessibility,
          logo_url,
        } = req.body;
        const phone_number = rawPhone
          ? String(rawPhone).replace(/\D/g, "")
          : rawPhone;
        const contact_phone = rawContactPhone
          ? String(rawContactPhone).replace(/\D/g, "")
          : rawContactPhone;

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

        await pool
          .promise()
          .query(query, [
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
            providerId,
          ]);

        res.json({ message: "Organization profile updated successfully" });
      } catch (err) {
        console.error("Error updating organization profile:", err);
        res
          .status(500)
          .json({ error: "Failed to update organization profile" });
      }
    },
  );

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

  // POST /api/organizations/invite
  // Sends an invite email to join an organization
  app.post(
    "/api/organizations/invite",
    rateLimit({ windowMs: 60000, max: 10 }),
    requireRole(pool, "provider"),
    async (req, res) => {
      try {
        const { email, username, provider_id } = req.body;
        const invitedByUserId = req.currentUser.user_id;

        if (!email || !provider_id) {
          return res
            .status(400)
            .json({ error: "email and provider_id are required" });
        }

        if (!isValidEmailFormat(email)) {
          return res.status(400).json({ error: "Invalid email format" });
        }

        if (username && !isValidUsernameFormat(username)) {
          return res.status(400).json({
            error:
              "Username must be 3-50 characters, contain only letters, numbers, underscores, and hyphens",
          });
        }

        // Look up the provider to make sure it exists
        const [providers] = await pool
          .promise()
          .query(
            "SELECT provider_id, name FROM ServiceProvider WHERE provider_id = ?",
            [provider_id],
          );

        if (providers.length === 0) {
          return res.status(404).json({ error: "Organization not found" });
        }

        const orgName = providers[0].name;

        // Generate a secure invite token
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        // Store the invite
        await pool
          .promise()
          .query(
            "INSERT INTO OrganizationInvite (provider_id, invited_by_user_id, email, username_suggestion, token, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
            [
              provider_id,
              invitedByUserId,
              email,
              username || null,
              token,
              expiresAt,
            ],
          );

        // Build the invite link
        const inviteLink = `${getFrontendUrl()}/invite/${token}`;

        // Send invite email
        try {
          await sendOrgInviteEmail({ to: email, orgName, inviteLink });
        } catch (emailErr) {
          console.error("Failed to send org invite email:", emailErr);
        }

        console.log(`Organization invite sent to ${email} for ${orgName}`);
        res.status(201).json({
          message: "Invitation sent successfully",
          invite_link: inviteLink,
        });
      } catch (err) {
        console.error("Error sending organization invite:", err);
        res.status(500).json({ error: "Failed to send invitation" });
      }
    },
  );

  // GET /api/organizations/invite/:token
  // Validates an invite token and returns org info
  app.get("/api/organizations/invite/:token", async (req, res) => {
    try {
      const { token } = req.params;

      const [invites] = await pool.promise().query(
        `SELECT oi.*, sp.name AS organization_name, sp.ein
           FROM OrganizationInvite oi
           JOIN ServiceProvider sp ON oi.provider_id = sp.provider_id
           WHERE oi.token = ? AND oi.used = FALSE AND oi.expires_at > NOW()`,
        [token],
      );

      if (invites.length === 0) {
        return res
          .status(404)
          .json({ error: "Invalid or expired invitation link" });
      }

      const invite = invites[0];

      res.json({
        email: invite.email,
        username_suggestion: invite.username_suggestion,
        organization_name: invite.organization_name,
        ein: invite.ein,
        provider_id: invite.provider_id,
      });
    } catch (err) {
      console.error("Error validating invite token:", err);
      res.status(500).json({ error: "Failed to validate invitation" });
    }
  });

  // POST /api/organizations/invite-register
  // Registers a new user via an organization invite token
  app.post(
    "/api/organizations/invite-register",
    rateLimit({ windowMs: 60000, max: 5 }),
    async (req, res) => {
      try {
        const {
          token,
          username,
          email,
          password,
          first_name,
          last_name,
          phone_number: rawPhone,
          zip_code,
        } = req.body;
        const phone_number = rawPhone
          ? String(rawPhone).replace(/\D/g, "")
          : rawPhone;

        if (
          !token ||
          !username ||
          !email ||
          !password ||
          !first_name ||
          !last_name ||
          !phone_number ||
          !zip_code
        ) {
          return res.status(400).json({
            error:
              "token, username, email, password, first_name, last_name, phone_number, and zip_code are required",
          });
        }

        // Validate formats
        if (!isValidUsernameFormat(username)) {
          return res.status(400).json({
            error:
              "Username must be 3-50 characters, contain only letters, numbers, underscores, and hyphens, with no spaces",
          });
        }

        if (!isValidEmailFormat(email)) {
          return res.status(400).json({ error: "Invalid email format" });
        }

        if (!isValidPasswordFormat(password)) {
          return res.status(400).json({
            error:
              "Password must be seven characters or longer, contain at least one capital letter, one special character, and no spaces",
          });
        }

        if (phone_number && !isValidPhoneFormat(phone_number)) {
          return res
            .status(400)
            .json({ error: "Phone number must be 10 digits" });
        }

        // Validate the invite token
        const [invites] = await pool.promise().query(
          `SELECT oi.*, sp.name AS organization_name, sp.ein
             FROM OrganizationInvite oi
             JOIN ServiceProvider sp ON oi.provider_id = sp.provider_id
             WHERE oi.token = ? AND oi.used = FALSE AND oi.expires_at > NOW()`,
          [token],
        );

        if (invites.length === 0) {
          return res
            .status(400)
            .json({ error: "Invalid or expired invitation link" });
        }

        const invite = invites[0];

        // Check for existing email / username
        const [existingEmails] = await pool
          .promise()
          .query("SELECT user_id FROM User WHERE email = ?", [email]);

        if (existingEmails.length > 0) {
          return res
            .status(400)
            .json({ error: "An account with that email already exists" });
        }

        const [existingUsernames] = await pool
          .promise()
          .query("SELECT user_id FROM User WHERE username = ?", [username]);

        if (existingUsernames.length > 0) {
          return res
            .status(400)
            .json({ error: "That username is already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create the user
        const [userResult] = await pool
          .promise()
          .query(
            "INSERT INTO User (username, email, password_hash, status) VALUES (?, ?, ?, 'active')",
            [username, email, hashedPassword],
          );

        const userId = userResult.insertId;

        await pool
          .promise()
          .query(
            "INSERT INTO UserProfile (user_id, first_name, last_name, phone, zip_code) VALUES (?, ?, ?, ?, ?)",
            [userId, first_name, last_name, phone_number, zip_code],
          );

        // Assign provider role
        await pool
          .promise()
          .query(
            "INSERT INTO UserRole (user_id, role_id) SELECT ?, role_id FROM Role WHERE role_name = 'provider'",
            [userId],
          );

        // Link user to the existing provider
        await pool
          .promise()
          .query(
            "INSERT INTO ServiceProviderUser (provider_id, user_id) VALUES (?, ?)",
            [invite.provider_id, userId],
          );

        // Mark invite as used
        await pool
          .promise()
          .query(
            "UPDATE OrganizationInvite SET used = TRUE WHERE invite_id = ?",
            [invite.invite_id],
          );

        res.status(201).json({
          message: "Account created successfully",
          user_id: userId,
          provider_id: invite.provider_id,
        });
      } catch (err) {
        console.error("Error registering via invite:", err);
        res.status(500).json({ error: "Failed to create account" });
      }
    },
  );
};
