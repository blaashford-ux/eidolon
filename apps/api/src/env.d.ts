export {};

declare global {
  interface Env {
    APP_ENV: string;
    FRONTEND_ORIGIN?: string;
    DB: D1Database;
    ASSETS: R2Bucket;
    VECTORIZE: VectorizeIndex;
    AI: Ai;
  }
}
