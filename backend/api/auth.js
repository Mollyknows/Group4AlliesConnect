const bcrypt = require("bcrypt");
const crypto = require("crypto");
const {
  sendVolunteerWelcomeEmail,
  sendPasswordResetEmail,
} = require("../utils/email");
const { saltRounds, getFrontendUrl } = require("../utils/config");
const {
  isValidPhoneFormat,
  isValidEmailFormat,
  isValidPasswordFormat,
  isValidUsernameFormat,
} = require("../utils/validation");
const { rateLimit } = require("../middleware/rateLimit");

module.exports = function (app, pool) {
  // POST /api/auth/register
  // Create a new user account and profile
  app.post(
    "/api/auth/register",
    rateLimit({ windowMs: 60000, max: 5 }),
    async (req, res) => {
      try {
        const {
          username,
          email,
          password,
          first_name,
          last_name,
          phone: rawPhone,
          zip_code,
          role,
        } = req.body;
        const phone = rawPhone ? String(rawPhone).replace(/\D/g, "") : rawPhone;

        if (
          !username ||
          !email ||
          !password ||
          !first_name ||
          !last_name ||
          !phone ||
          !zip_code ||
          !role
        ) {
          return res.status(400).json({
            error:
              "username, email, password, first_name, last_name, phone, zip_code, and role are required",
          });
        }

        const allowedRoles = ["volunteer"];
        if (!allowedRoles.includes(role)) {
          return res.status(400).json({
            error: "role must be one of: " + allowedRoles.join(", "),
          });
        }

        if (!isValidPhoneFormat(phone)) {
          return res.status(400).json({
            error: "Phone number must be a valid 10-digit format",
          });
        }

        if (!isValidEmailFormat(email)) {
          return res.status(400).json({
            error: "Email must be in a valid format (e.g., user@example.com)",
          });
        }

        if (!isValidUsernameFormat(username)) {
          return res.status(400).json({
            error:
              "Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens (no spaces)",
          });
        }

        if (!isValidPasswordFormat(password)) {
          return res.status(400).json({
            error:
              "Password must be seven characters or longer and include at least one capital letter and one special character (!@#$%^&*()_+-=[]{}|;:',./~`), and cannot contain spaces",
          });
        }

        const [existingUsers] = await pool.promise().query(
          `SELECT u.user_id FROM User u
           JOIN UserRole ur ON u.user_id = ur.user_id
           JOIN Role r ON ur.role_id = r.role_id
           WHERE u.email = ? AND r.role_name = ?`,
          [email, role],
        );

        if (existingUsers.length > 0) {
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
            [userId, first_name, last_name, phone, zip_code],
          );

        await pool
          .promise()
          .query(
            "INSERT INTO UserRole (user_id, role_id) SELECT ?, role_id FROM Role WHERE role_name = ?",
            [userId, role],
          );

        try {
          await sendVolunteerWelcomeEmail({
            to: email,
            firstName: first_name,
          });
        } catch (emailErr) {
          console.error("Failed to send welcome email:", emailErr);
        }

        res.status(201).json({
          message: "User registered successfully",
          user_id: userId,
        });
      } catch (err) {
        console.error("Error registering user:", err);
        res.status(500).json({ error: "Failed to register user" });
      }
    },
  );

  // POST /api/auth/login
  // Basic login check + return user roles
  app.post(
    "/api/auth/login",
    rateLimit({ windowMs: 60000, max: 10 }),
    async (req, res) => {
      try {
        const { username, password } = req.body;

        if (!username || !password) {
          return res.status(400).json({
            error: "email and password are required",
          });
        }

        const [rows] = await pool
          .promise()
          .query("SELECT * FROM User WHERE username = ?", [username]);

        if (rows.length === 0) {
          return res
            .status(401)
            .json({ error: "Invalid username or password" });
        }

        const user = rows[0];

        const passwordMatch = await bcrypt.compare(
          password,
          user.password_hash,
        );

        if (!passwordMatch) {
          return res
            .status(401)
            .json({ error: "Invalid username or password" });
        }

        const [roleRows] = await pool.promise().query(
          `SELECT r.role_name
         FROM UserRole ur
         JOIN Role r ON ur.role_id = r.role_id
         WHERE ur.user_id = ?`,
          [user.user_id],
        );

        const roles = roleRows.map((role) => role.role_name);

        // If user is a provider, ensure their organization is approved
        if (roles.includes("provider")) {
          const [spRows] = await pool.promise().query(
            `SELECT sp.status FROM ServiceProvider sp
             JOIN ServiceProviderUser spu ON spu.provider_id = sp.provider_id
             WHERE spu.user_id = ? LIMIT 1`,
            [user.user_id],
          );
          if (spRows.length > 0 && spRows[0].status === "pending") {
            return res.status(403).json({
              error: "PROVIDER_PENDING",
              message:
                "Thank you for your interest in being hosted on Allies Connect. Once your organization has been approved you will receive an email, notifying you that you can start using the service.",
            });
          }
        }

        res.json({
          message: "Login successful",
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          status: user.status,
          roles: roles,
        });
      } catch (err) {
        console.error("Error logging in:", err);
        res.status(500).json({ error: "Failed to log in" });
      }
    },
  );

  // POST /api/auth/forgot-password
  // Generates a reset token, stores it in DB, and emails a reset link
  app.post(
    "/api/auth/forgot-password",
    rateLimit({ windowMs: 60000, max: 3 }),
    async (req, res) => {
      try {
        const { email } = req.body;

        if (!email) {
          return res.status(400).json({ error: "Email is required" });
        }

        // Always return success to avoid leaking whether an account exists
        const successMsg =
          "If an account with that email exists, a password reset link has been sent.";

        // Look up user by email
        const [users] = await pool
          .promise()
          .query("SELECT user_id, username FROM `User` WHERE email = ?", [
            email,
          ]);

        if (users.length === 0) {
          return res.json({ message: successMsg });
        }

        const user = users[0];

        // Generate a secure random token
        const token = crypto.randomBytes(32).toString("hex");
        // Use UTC string so it matches MySQL's NOW() (which runs in UTC)
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        // Invalidate any existing unused tokens for this user
        await pool
          .promise()
          .query(
            "UPDATE PasswordResetToken SET used = TRUE WHERE user_id = ? AND used = FALSE",
            [user.user_id],
          );

        // Store the new token
        await pool
          .promise()
          .query(
            "INSERT INTO PasswordResetToken (user_id, token, expires_at) VALUES (?, ?, ?)",
            [user.user_id, token, expiresAt],
          );

        // Build the reset link
        const resetLink = `${getFrontendUrl()}/reset-password/${token}`;

        // Send password reset email
        try {
          await sendPasswordResetEmail({
            to: email,
            username: user.username,
            resetLink,
          });
        } catch (emailErr) {
          console.error("Failed to send password reset email:", emailErr);
        }
        res.json({ message: successMsg });
      } catch (err) {
        console.error("Error in forgot-password:", err);
        // Still return success to avoid leaking info, but log the error
        res.json({
          message:
            "If an account with that email exists, a password reset link has been sent.",
        });
      }
    },
  );

  // POST /api/auth/reset-password/:token
  // Validates the token and updates the user's password
  app.post(
    "/api/auth/reset-password/:token",
    rateLimit({ windowMs: 60000, max: 5 }),
    async (req, res) => {
      try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
          return res.status(400).json({ error: "New password is required" });
        }

        if (!isValidPasswordFormat(password)) {
          return res.status(400).json({
            error:
              "Password must be seven characters or longer and include at least one capital letter and one special character (!@#$%^&*()_+-=[]{}|;:',./~`), and cannot contain spaces",
          });
        }

        // Find the token in the database
        const [tokens] = await pool
          .promise()
          .query(
            "SELECT * FROM PasswordResetToken WHERE token = ? AND used = FALSE AND expires_at > NOW()",
            [token],
          );

        if (tokens.length === 0) {
          return res.status(400).json({
            error: "Invalid or expired reset link. Please request a new one.",
          });
        }

        const resetToken = tokens[0];

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Update the user's password
        await pool
          .promise()
          .query("UPDATE `User` SET password_hash = ? WHERE user_id = ?", [
            hashedPassword,
            resetToken.user_id,
          ]);

        // Mark the token as used
        await pool
          .promise()
          .query(
            "UPDATE PasswordResetToken SET used = TRUE WHERE token_id = ?",
            [resetToken.token_id],
          );

        res.json({
          message: "Password has been reset successfully. You can now log in.",
        });
      } catch (err) {
        console.error("Error resetting password:", err);
        res.status(500).json({ error: "Failed to reset password" });
      }
    },
  );

  // GET /api/users/profile/:id
  // Retrieve user profile
  app.get("/api/users/profile/:id", async (req, res) => {
    try {
      const userId = req.params.id;

      const [rows] = await pool.promise().query(
        `SELECT 
        u.user_id,
        u.email,
        u.status,
        p.first_name,
        p.last_name,
        p.phone,
        p.zip_code,
        GROUP_CONCAT(DISTINCT r.role_name) AS roles,
        spu.provider_id
       FROM User u
       JOIN UserProfile p ON u.user_id = p.user_id
       LEFT JOIN UserRole ur ON u.user_id = ur.user_id
       LEFT JOIN Role r ON ur.role_id = r.role_id
       LEFT JOIN ServiceProviderUser spu ON u.user_id = spu.user_id
       WHERE u.user_id = ?
       GROUP BY u.user_id`,
        [userId],
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "User profile not found" });
      }

      const user = rows[0];

      res.json({
        user_id: user.user_id,
        email: user.email,
        status: user.status,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        zip_code: user.zip_code,
        roles: user.roles ? user.roles.split(",") : [],
        provider_id: user.provider_id || null,
      });
    } catch (err) {
      console.error("Error fetching user profile:", err);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  // PUT /api/users/profile/:id
  // Update user profile
  app.put("/api/users/profile/:id", rateLimit(), async (req, res) => {
    try {
      const userId = req.params.id;
      const { first_name, last_name, phone: rawPhone, zip_code } = req.body;
      const phone = rawPhone ? String(rawPhone).replace(/\D/g, "") : rawPhone;

      await pool.promise().query(
        `UPDATE UserProfile
         SET first_name = ?, last_name = ?, phone = ?, zip_code = ?
         WHERE user_id = ?`,
        [first_name, last_name, phone, zip_code, userId],
      );

      res.json({ message: "User profile updated successfully" });
    } catch (err) {
      console.error("Error updating user profile:", err);
      res.status(500).json({ error: "Failed to update user profile" });
    }
  });
};
