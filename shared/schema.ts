import { pgTable, text, serial, integer, boolean, timestamp, json, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Schema
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Use text for Replit user IDs
  username: text("username").notNull(), // Richiesto dal DB
  password: text("password").notNull(), // Richiesto dal DB
  email: text("email"),
  display_name: text("display_name"),
  avatar_url: text("avatar_url"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  display_name: true,
  avatar_url: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

// Project Schema
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  thumbnail: text("thumbnail"),
  resolution: text("resolution").default("1920x1080"),
  frameRate: integer("frame_rate").default(30),
  duration: integer("duration").default(0), // in seconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  userId: true,
  title: true,
  description: true,
  thumbnail: true,
  resolution: true,
  frameRate: true,
  duration: true,
});

// Media Assets Schema
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // video, audio, image, generated
  name: text("name").notNull(),
  url: text("url").notNull(),
  duration: integer("duration"), // in seconds, for video/audio
  thumbnail: text("thumbnail"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAssetSchema = createInsertSchema(assets).pick({
  userId: true,
  type: true,
  name: true,
  url: true,
  duration: true,
  thumbnail: true,
});

// Timeline Items Schema (for clips in the timeline)
export const timelineItems = pgTable("timeline_items", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  assetId: integer("asset_id").references(() => assets.id),
  type: text("type").notNull(), // video, audio, text, transition
  track: integer("track").notNull(), // track number
  startTime: integer("start_time").notNull(), // in milliseconds
  endTime: integer("end_time").notNull(), // in milliseconds
  properties: json("properties"), // JSON properties specific to the item type
});

export const insertTimelineItemSchema = createInsertSchema(timelineItems).pick({
  projectId: true,
  assetId: true,
  type: true,
  track: true,
  startTime: true,
  endTime: true,
  properties: true,
});

// Social Media Accounts Schema
export const socialAccounts = pgTable("social_accounts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  platform: text("platform").notNull(), // instagram, youtube, tiktok, etc.
  accountName: text("account_name").notNull(),
  accountId: text("account_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  // Stato dell'account
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false),
  
  // Dati di autorizzazione sicuri
  token: text("token"), // Token di accesso (cifrato)
  refreshToken: text("refresh_token"), // Token di refresh (cifrato)
  tokenExpiry: timestamp("token_expiry"), // Data di scadenza del token
  
  // Statistiche e metadati
  lastPublished: timestamp("last_published"), // Ultima pubblicazione
  lastError: text("last_error"), // Ultimo errore di pubblicazione o autenticazione
  
  // Informazioni del profilo
  profileImageUrl: text("profile_image_url"), // Avatar dell'account
  followerCount: integer("follower_count"), // Conteggio follower
  metadata: json("metadata"), // Altri metadati specifici per piattaforma
});

export const insertSocialAccountSchema = createInsertSchema(socialAccounts).pick({
  userId: true,
  platform: true,
  accountName: true,
  accountId: true,
  token: true,
  refreshToken: true,
  tokenExpiry: true,
  isActive: true,
  isVerified: true,
  lastError: true,
  profileImageUrl: true,
  followerCount: true,
  metadata: true,
});

// AI Generated Video Requests Schema
export const aiVideoRequests = pgTable("ai_video_requests", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  prompt: text("prompt").notNull(),
  style: text("style"),
  duration: integer("duration"), // target duration in seconds
  aspectRatio: text("aspect_ratio"),
  voiceOverSettings: json("voice_over_settings"),
  status: text("status").default("pending"), // pending, processing, completed, failed
  progress: integer("progress").default(0), // 0-100%
  message: text("message"), // Messaggio di stato corrente
  errorMessage: text("error_message"), // Messaggio di errore se presente
  resultData: text("result_data"), // Dati risultanti in formato JSON
  resultAssetId: integer("result_asset_id").references(() => assets.id),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const insertAiVideoRequestSchema = createInsertSchema(aiVideoRequests).pick({
  userId: true,
  prompt: true,
  style: true,
  duration: true,
  aspectRatio: true,
  voiceOverSettings: true,
  status: true,
  progress: true,
  message: true,
  errorMessage: true,
  resultData: true,
  completedAt: true,
});

// Type Exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type TimelineItem = typeof timelineItems.$inferSelect;
export type InsertTimelineItem = z.infer<typeof insertTimelineItemSchema>;

export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;

export type AiVideoRequest = typeof aiVideoRequests.$inferSelect;
export type InsertAiVideoRequest = z.infer<typeof insertAiVideoRequestSchema>;
