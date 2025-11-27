import { config } from "dotenv";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { getClient, closePool } from "../lib/db";

// Load environment variables from .env file
config();

/**
 * Run all SQL migration files from the db folder in order
 */
async function runMigrations() {
  try {
    const dbFolder = join(process.cwd(), "db");
    const files = readdirSync(dbFolder)
      .filter((file) => file.endsWith(".sql"))
      .sort(); // Sort alphabetically to run migrations in order

    console.log(`Found ${files.length} migration file(s)`);

    for (const file of files) {
      const filePath = join(dbFolder, file);
      console.log(`\nRunning migration: ${file}`);

      const sql = readFileSync(filePath, "utf-8");

      // Get a client to execute multiple statements
      const client = await getClient();
      try {
        // Execute the entire SQL file as one query
        // PostgreSQL can handle multiple statements separated by semicolons
        // This properly handles DO blocks and other complex statements
        await client.query(sql);
        console.log(`✓ Completed migration: ${file}`);
      } finally {
        client.release();
      }
    }

    console.log("\n✓ All migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };
