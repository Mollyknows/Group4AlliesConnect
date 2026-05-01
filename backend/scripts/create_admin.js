#!/usr/bin/env node
/**
 * create_admin.js
 *
 * Fill in the ACCOUNT DETAILS section below, then run:
 *   node scripts/create_admin.js
 *
 * The script will print one of three results:
 *   [SUCCESS] Account created
 *   [FAILED]  Account not created — failed local validation (reason)
 *   [FAILED]  Account not created — failed during creation (reason)
 */

"use strict";

// =============================================================================
// ACCOUNT DETAILS — fill these in before running
// =============================================================================

const NEW_ADMIN = {
  username: "", // 3-50 chars, letters/numbers/underscores/hyphens only
  email: "", // e.g. admin@example.com
  password: "", // 7+ chars, must include a capital letter and special char (!@#$%^&*...), no spaces
  first_name: "",
  last_name: "",
  phone: "", // 10 digits, e.g. 4045551234
  zip_code: "", // e.g. 30301
};

// =============================================================================
// DO NOT EDIT BELOW THIS LINE
// =============================================================================

require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const bcrypt = require("bcrypt");
const mysql = require("mysql2");
const {
  isValidEmailFormat,
  isValidPasswordFormat,
  isValidUsernameFormat,
  isValidPhoneFormat,
} = require("../utils/validation");
const { saltRounds } = require("../utils/config");

async function main() {
  const { username, email, password, first_name, last_name, phone, zip_code } =
    NEW_ADMIN;

  // ------ Local validation ------------------------------------------------

  const errors = [];

  if (!username) errors.push("username is required");
  if (!email) errors.push("email is required");
  if (!password) errors.push("password is required");
  if (!first_name) errors.push("first_name is required");
  if (!last_name) errors.push("last_name is required");
  if (!phone) errors.push("phone is required");
  if (!zip_code) errors.push("zip_code is required");

  if (username && !isValidUsernameFormat(username))
    errors.push(
      "username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens (no spaces)",
    );

  if (email && !isValidEmailFormat(email))
    errors.push("email must be a valid format (e.g. user@example.com)");

  if (password && !isValidPasswordFormat(password))
    errors.push(
      "password must be 7+ characters with at least one capital letter and one special character, and no spaces",
    );

  if (phone && !isValidPhoneFormat(phone))
    errors.push("phone must be a valid 10-digit number (e.g. 4045551234)");

  if (errors.length > 0) {
    console.log("\n[FAILED] Account not created — failed local validation:");
    errors.forEach((e) => console.log(`  • ${e}`));
    console.log();
    process.exit(1);
  }

  // ------ Database connection ---------------------------------------------

  const isDev = process.env.NODE_ENV === "development";
  const pool = mysql.createPool({
    host: isDev ? process.env.DEV_DB_URL : process.env.DB_URL,
    user: isDev ? process.env.DEV_DB_USER : process.env.DB_USER,
    password: isDev ? process.env.DEV_DB_PASSWORD : process.env.DB_PASSWORD,
    database: isDev ? process.env.DEV_DB_NAME : process.env.DB_NAME,
  });
  const db = pool.promise();

  try {
    // ------ Check for duplicates ------------------------------------------

    const [[existingEmail]] = await db.query(
      "SELECT user_id FROM `User` WHERE email = ?",
      [email],
    );
    if (existingEmail) {
      console.log(
        `\n[FAILED] Account not created — an account with email "${email}" already exists.\n`,
      );
      process.exit(1);
    }

    const [[existingUsername]] = await db.query(
      "SELECT user_id FROM `User` WHERE username = ?",
      [username],
    );
    if (existingUsername) {
      console.log(
        `\n[FAILED] Account not created — username "${username}" is already in use.\n`,
      );
      process.exit(1);
    }

    // ------ Create the account --------------------------------------------

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const [userResult] = await db.query(
      "INSERT INTO `User` (username, email, password_hash, status) VALUES (?, ?, ?, 'active')",
      [username, email, hashedPassword],
    );
    const userId = userResult.insertId;

    await db.query(
      "INSERT INTO UserProfile (user_id, first_name, last_name, phone, zip_code) VALUES (?, ?, ?, ?, ?)",
      [userId, first_name, last_name, phone, zip_code],
    );

    await db.query(
      "INSERT INTO UserRole (user_id, role_id) SELECT ?, role_id FROM Role WHERE role_name = 'admin'",
      [userId],
    );

    console.log(
      `\n[SUCCESS] Account created — username: ${username}, email: ${email}, user_id: ${userId}\n`,
    );
  } catch (err) {
    console.log(
      `\n[FAILED] Account not created — failed during creation: ${err.message}\n`,
    );
    process.exit(1);
  } finally {
    pool.end();
  }
}

main().catch((err) => {
  console.log(
    `\n[FAILED] Account not created — unexpected error: ${err.message}\n`,
  );
  process.exit(1);
});
