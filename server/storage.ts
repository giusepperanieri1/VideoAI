import {
  users, projects, assets, timelineItems, socialAccounts, aiVideoRequests,
  type User, type InsertUser,
  type Project, type InsertProject,
  type Asset, type InsertAsset,
  type TimelineItem, type InsertTimelineItem,
  type SocialAccount, type InsertSocialAccount,
  type AiVideoRequest, type InsertAiVideoRequest
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string | number): Promise<User | undefined>;
  upsertUser(user: Partial<InsertUser> & { id: string }): Promise<User>;
  
  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByUserId(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: InsertProject): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Asset operations
  getAsset(id: number): Promise<Asset | undefined>;
  getAssetsByUserId(userId: number): Promise<Asset[]>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  deleteAsset(id: number): Promise<boolean>;
  
  // Timeline item operations
  getTimelineItem(id: number): Promise<TimelineItem | undefined>;
  getTimelineItemsByProjectId(projectId: number): Promise<TimelineItem[]>;
  createTimelineItem(item: InsertTimelineItem): Promise<TimelineItem>;
  updateTimelineItem(id: number, item: InsertTimelineItem): Promise<TimelineItem | undefined>;
  deleteTimelineItem(id: number): Promise<boolean>;
  
  // Social account operations
  getSocialAccount(id: number): Promise<SocialAccount | undefined>;
  getSocialAccountsByUserId(userId: number | string): Promise<SocialAccount[]>;
  createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount>;
  updateSocialAccount(id: number, account: Partial<InsertSocialAccount> & { updatedAt?: Date }): Promise<SocialAccount | undefined>;
  deleteSocialAccount(id: number): Promise<boolean>;
  
  // AI video request operations
  getAiVideoRequest(id: number): Promise<AiVideoRequest | undefined>;
  getAiVideoRequestsByUserId(userId: number | string): Promise<AiVideoRequest[]>;
  createAiVideoRequest(request: InsertAiVideoRequest & { status: string }): Promise<AiVideoRequest>;
  updateAiVideoRequest(id: number, request: Partial<AiVideoRequest>): Promise<AiVideoRequest | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string | number): Promise<User | undefined> {
    const userId = typeof id === 'string' ? id : id.toString();
    try {
      const result = await db.select().from(users).where(eq(users.id, userId));
      return result[0];
    } catch (error) {
      console.error("Error fetching user:", error);
      return undefined;
    }
  }
  

  
  async upsertUser(userData: Partial<InsertUser> & { id: string }): Promise<User> {
    // First check if user exists
    const existing = await this.getUser(userData.id);
    
    try {
      if (existing) {
        // Update existing user
        const userUpdate: any = {
          ...userData,
          updatedAt: new Date()
        };
        
        const result = await db
          .update(users)
          .set(userUpdate)
          .where(eq(users.id, userData.id))
          .returning();
        return result[0];
      } else {
        // Create new user with specific ID
        const newUser: any = {
          id: userData.id,
          username: userData.username || "user_" + userData.id, // Default
          password: userData.password || "password", // Default per sviluppo
          email: userData.email || null,
          display_name: userData.display_name || null,
          avatar_url: userData.avatar_url || null,
          firstName: userData.firstName || null,
          lastName: userData.lastName || null,
          profileImageUrl: userData.profileImageUrl || null
        };
        
        const result = await db
          .insert(users)
          .values(newUser)
          .returning();
        return result[0];
      }
    } catch (error) {
      console.error("Error upserting user:", error);
      throw error;
    }
  }
  
  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    try {
      const result = await db.select().from(projects).where(eq(projects.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching project:", error);
      return undefined;
    }
  }
  
  async getProjectsByUserId(userId: string | number): Promise<Project[]> {
    try {
      const userIdStr = typeof userId === 'string' ? userId : userId.toString();
      return await db.select().from(projects).where(eq(projects.userId, userIdStr));
    } catch (error) {
      console.error("Error fetching projects by user ID:", error);
      return [];
    }
  }
  
  async createProject(projectData: InsertProject): Promise<Project> {
    try {
      const result = await db
        .insert(projects)
        .values(projectData as any)
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  }
  
  async updateProject(id: number, projectData: InsertProject): Promise<Project | undefined> {
    try {
      const result = await db
        .update(projects)
        .set({
          ...projectData as any,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating project:", error);
      return undefined;
    }
  }
  
  async deleteProject(id: number): Promise<boolean> {
    try {
      const result = await db.delete(projects).where(eq(projects.id, id));
      return true; // Successfully executed
    } catch (error) {
      console.error("Error deleting project:", error);
      return false;
    }
  }
  
  // Asset operations
  async getAsset(id: number): Promise<Asset | undefined> {
    try {
      const result = await db.select().from(assets).where(eq(assets.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching asset:", error);
      return undefined;
    }
  }
  
  async getAssetsByUserId(userId: string | number): Promise<Asset[]> {
    try {
      const userIdStr = typeof userId === 'string' ? userId : userId.toString();
      return await db.select().from(assets).where(eq(assets.userId, userIdStr));
    } catch (error) {
      console.error("Error fetching assets by user ID:", error);
      return [];
    }
  }
  
  async createAsset(assetData: InsertAsset): Promise<Asset> {
    try {
      const result = await db
        .insert(assets)
        .values(assetData as any)
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error creating asset:", error);
      throw error;
    }
  }
  
  async deleteAsset(id: number): Promise<boolean> {
    try {
      await db.delete(assets).where(eq(assets.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting asset:", error);
      return false;
    }
  }
  
  // Timeline item operations
  async getTimelineItem(id: number): Promise<TimelineItem | undefined> {
    try {
      const result = await db.select().from(timelineItems).where(eq(timelineItems.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching timeline item:", error);
      return undefined;
    }
  }
  
  async getTimelineItemsByProjectId(projectId: number): Promise<TimelineItem[]> {
    try {
      return await db.select().from(timelineItems).where(eq(timelineItems.projectId, projectId));
    } catch (error) {
      console.error("Error fetching timeline items by project ID:", error);
      return [];
    }
  }
  
  async createTimelineItem(itemData: InsertTimelineItem): Promise<TimelineItem> {
    try {
      const result = await db
        .insert(timelineItems)
        .values(itemData as any)
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error creating timeline item:", error);
      throw error;
    }
  }
  
  async updateTimelineItem(id: number, itemData: InsertTimelineItem): Promise<TimelineItem | undefined> {
    try {
      const result = await db
        .update(timelineItems)
        .set(itemData as any)
        .where(eq(timelineItems.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating timeline item:", error);
      return undefined;
    }
  }
  
  async deleteTimelineItem(id: number): Promise<boolean> {
    try {
      await db.delete(timelineItems).where(eq(timelineItems.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting timeline item:", error);
      return false;
    }
  }
  
  // Social account operations
  async getSocialAccount(id: number): Promise<SocialAccount | undefined> {
    try {
      const result = await db.select().from(socialAccounts).where(eq(socialAccounts.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching social account:", error);
      return undefined;
    }
  }
  
  async getSocialAccountsByUserId(userId: string | number): Promise<SocialAccount[]> {
    try {
      const userIdStr = typeof userId === 'string' ? userId : userId.toString();
      return await db.select().from(socialAccounts).where(eq(socialAccounts.userId, userIdStr));
    } catch (error) {
      console.error("Error fetching social accounts by user ID:", error);
      return [];
    }
  }
  
  async createSocialAccount(accountData: InsertSocialAccount): Promise<SocialAccount> {
    try {
      const result = await db
        .insert(socialAccounts)
        .values(accountData as any)
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error creating social account:", error);
      throw error;
    }
  }
  
  async updateSocialAccount(id: number, accountData: Partial<InsertSocialAccount> & { updatedAt?: Date }): Promise<SocialAccount | undefined> {
    try {
      // Se non è fornito l'updatedAt, impostiamo la data attuale
      const dataToUpdate = {
        ...accountData,
        updatedAt: accountData.updatedAt || new Date()
      };
      
      const result = await db
        .update(socialAccounts)
        .set(dataToUpdate as any)
        .where(eq(socialAccounts.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating social account:", error);
      return undefined;
    }
  }
  
  async deleteSocialAccount(id: number): Promise<boolean> {
    try {
      await db.delete(socialAccounts).where(eq(socialAccounts.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting social account:", error);
      return false;
    }
  }
  
  // AI video request operations
  async getAiVideoRequest(id: number): Promise<AiVideoRequest | undefined> {
    try {
      const result = await db.select().from(aiVideoRequests).where(eq(aiVideoRequests.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching AI video request:", error);
      return undefined;
    }
  }
  
  async getAiVideoRequestsByUserId(userId: string | number): Promise<AiVideoRequest[]> {
    try {
      const userIdStr = typeof userId === 'string' ? userId : userId.toString();
      return await db.select().from(aiVideoRequests).where(eq(aiVideoRequests.userId, userIdStr));
    } catch (error) {
      console.error("Error fetching AI video requests by user ID:", error);
      return [];
    }
  }
  
  async createAiVideoRequest(requestData: InsertAiVideoRequest & { status: string }): Promise<AiVideoRequest> {
    try {
      const data = {
        ...requestData as any,
        resultAssetId: null, // Set initially to null
      };
      
      const result = await db
        .insert(aiVideoRequests)
        .values(data)
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error creating AI video request:", error);
      throw error;
    }
  }
  
  async updateAiVideoRequest(id: number, requestData: Partial<AiVideoRequest>): Promise<AiVideoRequest | undefined> {
    try {
      const result = await db
        .update(aiVideoRequests)
        .set(requestData as any)
        .where(eq(aiVideoRequests.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating AI video request:", error);
      return undefined;
    }
  }
}

export const storage = new DatabaseStorage();
