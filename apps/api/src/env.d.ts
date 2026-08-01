export {};

declare global {
  interface Env {
    APP_ENV: string;
    FRONTEND_ORIGIN?: string;
    SEMANTIC_SEARCH_ENABLED?: string;
    AI_ENRICHMENT_ENABLED?: string;
    DB: D1Database;
    ASSETS: R2Bucket;
    VECTORIZE: VectorizeIndex;
    AI: Ai;
  }
}
