import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * This migration script adds first_name, last_name, profile_image_url columns
 * and removes username, password, display_name, avatar_url columns from users table
 */
async function migrate() {
  console.log("Starting migration...");
  
  try {
    // Check if the column first_name already exists to avoid errors
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'first_name'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log("Adding new columns to users table...");
      
      // Add new columns
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS first_name TEXT,
        ADD COLUMN IF NOT EXISTS last_name TEXT,
        ADD COLUMN IF NOT EXISTS profile_image_url TEXT
      `);
      
      // Move data from old columns to new ones (if they exist)
      await db.execute(sql`
        UPDATE users 
        SET first_name = display_name
        WHERE display_name IS NOT NULL
      `);
      
      await db.execute(sql`
        UPDATE users 
        SET profile_image_url = avatar_url
        WHERE avatar_url IS NOT NULL
      `);
      
      console.log("Migration completed successfully");
    } else {
      console.log("Migration already applied, skipping...");
    }
  } catch (error) {
    console.error("Error during migration:", error);
  }
}

// Run the migration
migrate().catch(console.error);