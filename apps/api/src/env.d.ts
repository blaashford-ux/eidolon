export {};

declare global {
  interface Env {
    APP_ENV: string;
    DB: D1Database;
    ASSETS: R2Bucket;
    VECTOR_INDEX: VectorizeIndex;
    AI: Ai;
  }
}
