import { Pool, QueryResult, QueryResultRow } from "pg";

// Database connection pool
let pool: Pool | null = null;

/**
 * Get or create a database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false, // Required for Neon and other cloud PostgreSQL services
      },
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
    });
  }

  return pool;
}

/**
 * Execute a query and return the result
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const db = getPool();
  const start = Date.now();
  try {
    const result = await db.query<T>(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error("Database query error", { text, error });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient() {
  const db = getPool();
  return await db.connect();
}

/**
 * Close the database connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Users table helpers
export type UserRole = "admin" | "employee" | "provider" | "manager";

export interface User {
  id: number;
  name: string;
  email: string;
  hashed_password: string;
  phone_number?: string | null;
  user_image_url?: string | null;
  email_verified: boolean;
  email_code?: string | null;
  onboarded: boolean;
  password_reset_code?: string | null;
  password_reset_expired_date?: Date | null;
  role: UserRole;
  logged_in_status: boolean;
  last_online?: Date | null;
  location?: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create the Users table if it doesn't exist
 */
export async function createUsersTable(): Promise<void> {
  const createEnumQuery = `
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('admin', 'employee', 'provider', 'manager');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      hashed_password VARCHAR(255) NOT NULL,
      phone_number VARCHAR(20),
      user_image_url TEXT,
      email_verified BOOLEAN DEFAULT FALSE,
      email_code VARCHAR(10),
      onboarded BOOLEAN DEFAULT FALSE,
      password_reset_code VARCHAR(255),
      password_reset_expired_date TIMESTAMP WITH TIME ZONE,
      role user_role DEFAULT 'employee',
      logged_in_status BOOLEAN DEFAULT FALSE,
      last_online TIMESTAMP WITH TIME ZONE,
      location VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_email_code ON users(email_code);
    CREATE INDEX IF NOT EXISTS idx_users_password_reset_code ON users(password_reset_code);
  `;

  await query(createEnumQuery);
  await query(createTableQuery);
  console.log("Users table created or already exists");
}
