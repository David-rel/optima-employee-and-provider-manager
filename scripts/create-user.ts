import { config } from "dotenv";
import { query, closePool } from "../lib/db";
import bcrypt from "bcryptjs";

// Load environment variables
config();

async function createUser() {
  try {
    const email = "davidfalesct@gmail.com";
    const password = "password";
    const name = "Admin";

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existingUser = await query("SELECT id FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);

    if (existingUser.rows.length > 0) {
      console.log(`User with email ${email} already exists.`);
      console.log("Updating password...");

      // Update password
      await query(
        "UPDATE users SET hashed_password = $1, name = $2, updated_at = CURRENT_TIMESTAMP WHERE email = $3",
        [hashedPassword, name, email.toLowerCase()]
      );
      console.log(`✓ User ${email} password updated successfully!`);
    } else {
      // Insert new user
      await query(
        `INSERT INTO users (name, email, hashed_password, role, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [name, email.toLowerCase(), hashedPassword, "admin", false]
      );
      console.log(`✓ User ${email} created successfully!`);
    }

    console.log(`\nCredentials:`);
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Name: ${name}`);
    console.log(`  Role: admin`);
  } catch (error) {
    console.error("Error creating user:", error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run if executed directly
if (require.main === module) {
  createUser();
}

export { createUser };

//npx tsx scripts/create-user.ts
