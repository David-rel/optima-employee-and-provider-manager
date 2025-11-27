-- Migration: Create Users table
-- Created: 2024

-- Create user_role enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'employee', 'provider', 'manager');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_code ON users(email_code);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_code ON users(password_reset_code);

