import 'express-session';

declare module 'express-session' {
  interface SessionData {
    oauthData?: {
      state: string;
      expiry: number;
      userId: string;
      platform: string;
    };
  }
}