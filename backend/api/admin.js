const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { logAudit } = require("../utils/logging");
const { requireRole } = require("../middleware/permissions");
const { rateLimit } = require("../middleware/rateLimit");
const {
  sendEmail,
  sendOrgApprovedEmail,
  sendOrgDeniedEmail,
} = require("../utils/email");
const { saltRounds, getFrontendUrl } = require("../utils/config");
const {
  isValidEmailFormat,
  isValidEINFormat,
  isValidPhoneFormat,
  isValidPasswordFormat,
  isValidUsernameFormat,
  normalizeEin,
} = require("../utils/validation");

const ensureAdminInviteTable = async (pool) => {
  await pool.promise().query(`
    CREATE TABLE IF NOT EXISTS AdminInvite (
      invite_id INT NOT NULL AUTO_INCREMENT,
      invited_by_user_id INT NOT NULL,
      email VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (invite_id),
      UNIQUE KEY uq_admin_invite_token (token(191)),
      CONSTRAINT fk_admininvite_user
        FOREIGN KEY (invited_by_user_id) REFERENCES \`User\`(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
};

module.exports = function (app, pool) {
  // GET /api/admin/accounts
  // Retrieves all user accounts for admin account management
  app.get(
    "/api/admin/accounts",
    requireRole(pool, "admin"),
    async (req, res) => {
      try {
        const [rows] = await pool.promise().query(
          `SELECT
          u.user_id,
          u.username,
          u.email,
          u.status,
          p.first_name,
          p.last_name,
          p.phone,
          p.zip_code,
          CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')) AS name,
          GROUP_CONCAT(DISTINCT r.role_name ORDER BY r.role_name SEPARATOR ',') AS roles,
          NULL AS date_created,
          NULL AS date_updated
        FROM \`User\` u
        LEFT JOIN UserProfile p ON u.user_id = p.user_id
        LEFT JOIN UserRole ur ON u.user_id = ur.user_id
        LEFT JOIN Role r ON ur.role_id = r.role_id
        GROUP BY
          u.user_id,
          u.username,
          u.email,
          u.status,
          p.first_name,
          p.last_name,
          p.phone,
          p.zip_code
        ORDER BY u.user_id DESC`,
        );

        const accounts = rows.map((row) => ({
          ...row,
          name: (row.name || "").trim() || "N/A",
          roles: row.roles || "N/A",
        }));

        res.json(accounts);
      } catch (err) {
        console.error("Error fetching admin accounts:", err);
        res.status(500).json({ error: "Failed to fetch accounts" });
      }
    },
  );

  // DELETE /api/admin/accounts/:id
  // Allows admin to delete an account (except their own)
  app.delete(
    "/api/admin/accounts/:id",
    rateLimit(),
    requireRole(pool, "admin"),
    async (req, res) => {
      try {
        const targetUserId = Number(req.params.id);
        const actorUserId = Number(req.currentUser?.user_id || 0);

        if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
          return res.status(400).json({ error: "Invalid user id" });
        }

        if (targetUserId === actorUserId) {
          return res
            .status(400)
            .json({ error: "Admins cannot delete their own account" });
        }

        const [result] = await pool
          .promise()
          .query("DELETE FROM `User` WHERE user_id = ?", [targetUserId]);

        if (!result.affectedRows) {
          return res.status(404).json({ error: "Account not found" });
        }

        await logAudit(
          pool,
          actorUserId || 1,
          "DELETE_ACCOUNT",
          "User",
          targetUserId,
        );

        res.json({ message: "Account deleted" });
      } catch (err) {
        console.error("Error deleting account:", err);
        res.status(500).json({ error: "Failed to delete account" });
      }
    },
  );

  // GET /api/admin/pending-providers
  // Retrieves providers waiting for approval
  app.get(
    "/api/admin/pending-providers",
    requireRole(pool, "admin"),
    async (req, res) => {
      try {
        const [rows] = await pool.promise().query(
          `SELECT sp.*,
             u.email    AS registrant_email,
             up.first_name AS registrant_first_name,
             up.last_name  AS registrant_last_name
           FROM ServiceProvider sp
           LEFT JOIN ServiceProviderUser spu ON spu.provider_id = sp.provider_id
           LEFT JOIN \`User\` u ON u.user_id = spu.user_id
           LEFT JOIN UserProfile up ON up.user_id = spu.user_id
           WHERE sp.status = 'pending'
           GROUP BY sp.provider_id
           ORDER BY sp.provider_id ASC`,
        );

        res.json(rows);
      } catch (err) {
        console.error("Error fetching pending providers:", err);
        res.status(500).json({ error: "Failed to fetch pending providers" });
      }
    },
  );

  // PATCH /api/admin/providers/:id/status
  // Allows admin to approve, reject, or suspend providers
  app.patch(
    "/api/admin/providers/:id/status",
    rateLimit(),
    requireRole(pool, "admin"),
    async (req, res) => {
      try {
        const providerId = req.params.id;
        const { status } = req.body;

        if (!["active", "pending", "suspended"].includes(status)) {
          return res.status(400).json({
            error: "Invalid status value",
          });
        }

        await pool
          .promise()
          .query(
            "UPDATE ServiceProvider SET status = ? WHERE provider_id = ?",
            [status, providerId],
          );

        await logAudit(
          pool,
          1,
          "UPDATE_PROVIDER_STATUS",
          "ServiceProvider",
          providerId,
        );

        res.json({ message: "Provider status updated" });
      } catch (err) {
        console.error("Error updating provider status:", err);
        res.status(500).json({ error: "Failed to update provider status" });
      }
    },
  );

  // PATCH /api/admin/content/:type/:id
  // Allows admin to deactivate resources/events/opportunities
  app.patch(
    "/api/admin/content/:type/:id",
    rateLimit(),
    requireRole(pool, "admin"),
    async (req, res) => {
      try {
        const { type, id } = req.params;

        let table;

        if (type === "resource") table = "Resource";
        else if (type === "event") table = "Event";
        else if (type === "opportunity") table = "VolunteerOpportunity";
        else {
          return res.status(400).json({ error: "Invalid content type" });
        }

        await pool
          .promise()
          .query(
            `UPDATE ${table} SET status = 'inactive' WHERE ${type}_id = ?`,
            [id],
          );

        res.json({ message: `${type} deactivated` });
      } catch (err) {
        console.error("Error moderating content:", err);
        res.status(500).json({ error: "Failed to moderate content" });
      }
    },
  );

  // GET /api/admin/logs
  // Returns audit logs
  app.get("/api/admin/logs", requireRole(pool, "admin"), async (req, res) => {
    try {
      const [rows] = await pool
        .promise()
        .query("SELECT * FROM AuditLog ORDER BY occured_at DESC LIMIT 100");

      res.json(rows);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // PATCH /api/admin/providers/:id/approve
  // Approve provider and log the action
  app.patch(
    "/api/admin/providers/:id/approve",
    rateLimit(),
    requireRole(pool, "admin"),
    async (req, res) => {
      const providerId = req.params.id;

      try {
        // Fetch provider + registrant contact before updating
        const [spRows] = await pool.promise().query(
          `SELECT sp.name,
             u.email    AS registrant_email,
             up.first_name
           FROM ServiceProvider sp
           LEFT JOIN ServiceProviderUser spu ON spu.provider_id = sp.provider_id
           LEFT JOIN \`User\` u ON u.user_id = spu.user_id
           LEFT JOIN UserProfile up ON up.user_id = spu.user_id
           WHERE sp.provider_id = ? LIMIT 1`,
          [providerId],
        );

        await pool
          .promise()
          .query(
            "UPDATE ServiceProvider SET status = 'active' WHERE provider_id = ?",
            [providerId],
          );

        await logAudit(
          pool,
          req.currentUser?.user_id || 1,
          "APPROVE_PROVIDER",
          "ServiceProvider",
          providerId,
        );

        // Send approval email
        if (spRows.length > 0 && spRows[0].registrant_email) {
          try {
            await sendOrgApprovedEmail({
              to: spRows[0].registrant_email,
              orgName: spRows[0].name,
              firstName: spRows[0].first_name,
            });
          } catch (emailErr) {
            console.error("Failed to send org approval email:", emailErr);
          }
        }

        res.json({ message: "Provider approved" });
      } catch (err) {
        console.error("Error approving provider:", err);
        res.status(500).json({ error: "Failed to approve provider" });
      }
    },
  );

  // PATCH /api/admin/providers/:id/deny
  // Admin denies a pending provider with an optional reason.
  app.patch(
    "/api/admin/providers/:id/deny",
    rateLimit(),
    requireRole(pool, "admin"),
    async (req, res) => {
      const providerId = req.params.id;
      const { denial_reason } = req.body;

      try {
        const [spRows] = await pool.promise().query(
          `SELECT sp.name,
             u.email    AS registrant_email,
             up.first_name
           FROM ServiceProvider sp
           LEFT JOIN ServiceProviderUser spu ON spu.provider_id = sp.provider_id
           LEFT JOIN \`User\` u ON u.user_id = spu.user_id
           LEFT JOIN UserProfile up ON up.user_id = spu.user_id
           WHERE sp.provider_id = ? LIMIT 1`,
          [providerId],
        );

        await pool
          .promise()
          .query(
            "UPDATE ServiceProvider SET status = 'suspended', denial_reason = ? WHERE provider_id = ?",
            [denial_reason || null, providerId],
          );

        await logAudit(
          pool,
          req.currentUser?.user_id || 1,
          "DENY_PROVIDER",
          "ServiceProvider",
          providerId,
        );

        if (spRows.length > 0 && spRows[0].registrant_email) {
          try {
            await sendOrgDeniedEmail({
              to: spRows[0].registrant_email,
              orgName: spRows[0].name,
              firstName: spRows[0].first_name,
              reason: denial_reason,
            });
          } catch (emailErr) {
            console.error("Failed to send org denial email:", emailErr);
          }
        }

        res.json({ message: "Provider denied" });
      } catch (err) {
        console.error("Error denying provider:", err);
        res.status(500).json({ error: "Failed to deny provider" });
      }
    },
  );

  // POST /api/admin/provider-invite
  // Allows an admin to send an invite tied to an existing provider by EIN
  app.post(
    "/api/admin/provider-invite",
    rateLimit({ windowMs: 60000, max: 10 }),
    requireRole(pool, "admin"),
    async (req, res) => {
      try {
        const { email, ein } = req.body;
        const actorUserId = Number(req.currentUser?.user_id || 0);

        if (!email || !ein) {
          return res.status(400).json({ error: "email and ein are required" });
        }

        if (!isValidEmailFormat(email)) {
          return res.status(400).json({ error: "Invalid email format" });
        }

        const normalizedEin = normalizeEin(ein);
        if (!isValidEINFormat(normalizedEin)) {
          return res
            .status(400)
            .json({ error: "EIN must be in the format XX-XXXXXXX" });
        }

        const [providers] = await pool.promise().query(
          `SELECT provider_id, name, ein
           FROM ServiceProvider
           WHERE ein = ?
           LIMIT 1`,
          [normalizedEin],
        );

        if (providers.length === 0) {
          return res.status(404).json({
            error: "No provider found for that EIN",
          });
        }

        const provider = providers[0];
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        await pool.promise().query(
          `INSERT INTO OrganizationInvite
           (provider_id, invited_by_user_id, email, username_suggestion, token, expires_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [provider.provider_id, actorUserId, email, null, token, expiresAt],
        );

        const inviteLink = `${getFrontendUrl()}/invite/${token}`;

        await sendEmail({
          to: email,
          subject: `Allies Connect — Provider account invite for ${provider.name}`,
          text:
            `You were invited to create a provider account for ${provider.name}.\n` +
            `EIN: ${provider.ein}\n` +
            `Create your account here: ${inviteLink}\n` +
            "This invitation expires in 7 days.",
          html: `
            <h2>Allies Connect Provider Invite</h2>
            <p>You were invited to create a provider account for <strong>${provider.name}</strong>.</p>
            <p><strong>EIN:</strong> ${provider.ein}</p>
            <p>Create your account here:</p>
            <p><a href="${inviteLink}">${inviteLink}</a></p>
            <p>This invitation expires in 7 days.</p>
          `,
        });

        await logAudit(
          pool,
          actorUserId || 1,
          "SEND_PROVIDER_INVITE",
          "OrganizationInvite",
          provider.provider_id,
        );

        res.status(201).json({
          message: "Provider invitation sent successfully",
          invite_link: inviteLink,
        });
      } catch (err) {
        console.error("Error sending provider invite:", err);
        res.status(500).json({ error: "Failed to send provider invitation" });
      }
    },
  );

  // POST /api/admin/admin-invite
  // Allows an admin to send an invite to create a new admin account
  app.post(
    "/api/admin/admin-invite",
    rateLimit({ windowMs: 60000, max: 10 }),
    requireRole(pool, "admin"),
    async (req, res) => {
      try {
        const { email } = req.body;
        const actorUserId = Number(req.currentUser?.user_id || 0);

        if (!email) {
          return res.status(400).json({ error: "email is required" });
        }

        if (!isValidEmailFormat(email)) {
          return res.status(400).json({ error: "Invalid email format" });
        }

        await ensureAdminInviteTable(pool);

        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        await pool.promise().query(
          `INSERT INTO AdminInvite (invited_by_user_id, email, token, expires_at)
           VALUES (?, ?, ?, ?)`,
          [actorUserId, email, token, expiresAt],
        );

        const inviteLink = `${getFrontendUrl()}/admin-invite/${token}`;

        await sendEmail({
          to: email,
          subject: "Allies Connect — Admin account invite",
          text:
            "You were invited to create an admin account on Allies Connect.\n" +
            `Create your account here: ${inviteLink}\n` +
            "This invitation expires in 7 days.",
          html: `
            <h2>Allies Connect Admin Invite</h2>
            <p>You were invited to create an <strong>admin</strong> account on Allies Connect.</p>
            <p>Create your account here:</p>
            <p><a href="${inviteLink}">${inviteLink}</a></p>
            <p>This invitation expires in 7 days.</p>
          `,
        });

        await logAudit(
          pool,
          actorUserId || 1,
          "SEND_ADMIN_INVITE",
          "AdminInvite",
          null,
        );

        res.status(201).json({
          message: "Admin invitation sent successfully",
          invite_link: inviteLink,
        });
      } catch (err) {
        console.error("Error sending admin invite:", err);
        res.status(500).json({ error: "Failed to send admin invitation" });
      }
    },
  );

  // GET /api/admin/invite/:token
  // Validates an admin invite token and returns invite metadata
  app.get("/api/admin/invite/:token", async (req, res) => {
    try {
      const { token } = req.params;
      await ensureAdminInviteTable(pool);

      const [invites] = await pool.promise().query(
        `SELECT invite_id, email
         FROM AdminInvite
         WHERE token = ? AND used = FALSE AND expires_at > NOW()`,
        [token],
      );

      if (invites.length === 0) {
        return res
          .status(404)
          .json({ error: "Invalid or expired invitation link" });
      }

      res.json({ email: invites[0].email });
    } catch (err) {
      console.error("Error validating admin invite token:", err);
      res.status(500).json({ error: "Failed to validate invitation" });
    }
  });

  // POST /api/admin/invite-register
  // Registers a new admin account via invite token
  app.post(
    "/api/admin/invite-register",
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

        if (!isValidUsernameFormat(username)) {
          return res.status(400).json({
            error:
              "Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens (no spaces)",
          });
        }

        if (!isValidEmailFormat(email)) {
          return res.status(400).json({ error: "Invalid email format" });
        }

        if (!isValidPasswordFormat(password)) {
          return res.status(400).json({
            error:
              "Password must be seven characters or longer and include at least one capital letter and one special character, and cannot contain spaces",
          });
        }

        if (!isValidPhoneFormat(phone_number)) {
          return res
            .status(400)
            .json({ error: "Phone number must be a valid 10-digit format" });
        }

        await ensureAdminInviteTable(pool);

        const [invites] = await pool.promise().query(
          `SELECT invite_id, email
           FROM AdminInvite
           WHERE token = ? AND used = FALSE AND expires_at > NOW()`,
          [token],
        );

        if (invites.length === 0) {
          return res
            .status(400)
            .json({ error: "Invalid or expired invitation link" });
        }

        const invite = invites[0];
        if (invite.email.toLowerCase() !== String(email).toLowerCase()) {
          return res.status(400).json({
            error: "Email must match the invited email address",
          });
        }

        const [existingEmails] = await pool
          .promise()
          .query("SELECT user_id FROM `User` WHERE email = ?", [email]);

        if (existingEmails.length > 0) {
          return res
            .status(400)
            .json({ error: "An account with that email already exists" });
        }

        const [existingUsernames] = await pool
          .promise()
          .query("SELECT user_id FROM `User` WHERE username = ?", [username]);

        if (existingUsernames.length > 0) {
          return res
            .status(400)
            .json({ error: "That username is already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const [userResult] = await pool
          .promise()
          .query(
            "INSERT INTO `User` (username, email, password_hash, status) VALUES (?, ?, ?, 'active')",
            [username, email, hashedPassword],
          );

        const userId = userResult.insertId;

        await pool
          .promise()
          .query(
            "INSERT INTO UserProfile (user_id, first_name, last_name, phone, zip_code) VALUES (?, ?, ?, ?, ?)",
            [userId, first_name, last_name, phone_number, zip_code],
          );

        await pool
          .promise()
          .query(
            "INSERT INTO UserRole (user_id, role_id) SELECT ?, role_id FROM Role WHERE role_name = 'admin'",
            [userId],
          );

        await pool
          .promise()
          .query("UPDATE AdminInvite SET used = TRUE WHERE invite_id = ?", [
            invite.invite_id,
          ]);

        res.status(201).json({
          message: "Admin account created successfully",
          user_id: userId,
        });
      } catch (err) {
        console.error("Error registering admin via invite:", err);
        res.status(500).json({ error: "Failed to create admin account" });
      }
    },
  );
};
