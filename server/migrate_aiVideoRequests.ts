import { pool, db } from "./db";
import { aiVideoRequests } from "@shared/schema";
import { sql } from "drizzle-orm";

/**
 * Migra la tabella ai_video_requests aggiungendo i nuovi campi necessari
 * per la funzionalità di segmentazione video AI
 */
async function migrateAiVideoRequests() {
  try {
    console.log("Aggiornamento schema ai_video_requests...");
    
    // Controllo se i nuovi campi sono già presenti
    const checkColumnsQuery = `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'ai_video_requests' AND column_name = 'result_data'
      ) AS has_result_data,
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'ai_video_requests' AND column_name = 'progress'
      ) AS has_progress,
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'ai_video_requests' AND column_name = 'message'
      ) AS has_message,
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'ai_video_requests' AND column_name = 'error_message'
      ) AS has_error_message,
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'ai_video_requests' AND column_name = 'completed_at'
      ) AS has_completed_at;
    `;
    
    const result = await pool.query(checkColumnsQuery);
    const { has_result_data, has_progress, has_message, has_error_message, has_completed_at } = result.rows[0];
    
    // Aggiungi colonne mancanti
    if (!has_progress) {
      console.log("Aggiunta colonna 'progress'...");
      await pool.query("ALTER TABLE ai_video_requests ADD COLUMN progress INTEGER DEFAULT 0;");
    }
    
    if (!has_message) {
      console.log("Aggiunta colonna 'message'...");
      await pool.query("ALTER TABLE ai_video_requests ADD COLUMN message TEXT;");
    }
    
    if (!has_error_message) {
      console.log("Aggiunta colonna 'error_message'...");
      await pool.query("ALTER TABLE ai_video_requests ADD COLUMN error_message TEXT;");
    }
    
    if (!has_result_data) {
      console.log("Aggiunta colonna 'result_data'...");
      await pool.query("ALTER TABLE ai_video_requests ADD COLUMN result_data TEXT;");
    }
    
    if (!has_completed_at) {
      console.log("Aggiunta colonna 'completed_at'...");
      await pool.query("ALTER TABLE ai_video_requests ADD COLUMN completed_at TIMESTAMP;");
    }
    
    // Aggiorna schema per aiVideoRequests nell'insertAiVideoRequestSchema
    console.log("Schema aggiornato con successo!");
    
  } catch (error) {
    console.error("Errore durante la migrazione:", error);
  } finally {
    await pool.end();
  }
}

// Esegui la migrazione
migrateAiVideoRequests();