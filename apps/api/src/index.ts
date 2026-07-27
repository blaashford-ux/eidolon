import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

app.get('/health', (c) =>
  c.json({
    ok: true,
    env: c.env.APP_ENV
  })
);

app.get('/api/info', (c) =>
  c.json({
    service: 'eidolon-api',
    cloudflare: true
  })
);

export default app;
