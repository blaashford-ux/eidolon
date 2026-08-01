import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import {
  claimAuthorityProfile,
  createSubmission,
  ensurePhase2Data,
  ensurePhase4Data,
  getCapabilities,
  getEndorsements,
  getModerationQueue,
  getSubmission,
  getAuthorityProfile,
  expandGraphNode,
  listGraphTopics,
  listAuthorityProfiles,
  listSubmissions,
  searchWithFallback
} from './phase2';

const app = new Hono<{ Bindings: Env }>();

app.use('/api/*', async (c, next) => {
  const configuredOrigin = c.env.FRONTEND_ORIGIN;
  const allowedOrigins = [
    configuredOrigin,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://eidolon.embre.net'
  ].filter((value): value is string => Boolean(value));

  const middleware = cors({
    origin: (origin) => {
      if (!origin) {
        return configuredOrigin || 'https://eidolon.embre.net';
      }

      return allowedOrigins.includes(origin) ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization']
  });

  return middleware(c, next);
});

const submissionSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  sourceType: z.enum(['reddit', 'discord', 'blog', 'interview', 'manual']),
  sourceUrl: z.string().trim().optional().or(z.literal('')),
  contributor: z.string().trim().min(1),
  attributedAuthority: z.string().trim().min(1)
});

function parsePage(value: string | null | undefined, fallback: number) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function jsonError(message: string, status = 400, issues?: unknown) {
  return new Response(JSON.stringify({ message, issues }), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

app.onError((error, c) => {
  console.error(error);
  return c.json({ message: error instanceof Error ? error.message : 'Unexpected server error.' }, 500);
});

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

app.get('/api/capabilities', async (c) => {
  await ensurePhase2Data(c.env.DB);
  return c.json(await getCapabilities(c.env));
});

app.get('/api/authority/profiles', async (c) => {
  await ensurePhase2Data(c.env.DB);
  return c.json({ profiles: await listAuthorityProfiles(c.env.DB) });
});

app.get('/api/authority/profiles/:id', async (c) => {
  await ensurePhase2Data(c.env.DB);
  const profile = await getAuthorityProfile(c.env.DB, c.req.param('id'));

  if (!profile) {
    return c.json({ message: 'Profile not found.' }, 404);
  }

  return c.json(profile);
});

app.post('/api/authority/profiles/claim', async (c) => {
  await ensurePhase2Data(c.env.DB);
  const body = z.object({ id: z.string().min(1) }).safeParse(await c.req.json());

  if (!body.success) {
    return jsonError('Invalid claim request.', 400, body.error.flatten());
  }

  const profile = await claimAuthorityProfile(c.env.DB, body.data.id);
  if (!profile) {
    return c.json({ message: 'Profile not found.' }, 404);
  }

  return c.json({ ok: true, profile });
});

app.get('/api/submissions', async (c) => {
  await ensurePhase2Data(c.env.DB);
  return c.json({ submissions: await listSubmissions(c.env.DB) });
});

app.get('/api/submissions/:id', async (c) => {
  await ensurePhase2Data(c.env.DB);
  const submission = await getSubmission(c.env.DB, c.req.param('id'));

  if (!submission) {
    return c.json({ message: 'Submission not found.' }, 404);
  }

  return c.json(submission);
});

app.post('/api/submissions', async (c) => {
  await ensurePhase2Data(c.env.DB);

  const parsed = submissionSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return jsonError('Invalid submission payload.', 400, parsed.error.flatten());
  }

  try {
    const submission = await createSubmission(c.env.DB, parsed.data, {
      AI: c.env.AI,
      VECTORIZE: c.env.VECTORIZE,
      semanticEnabled: c.env.SEMANTIC_SEARCH_ENABLED === undefined ? true : c.env.SEMANTIC_SEARCH_ENABLED === 'true',
      enrichmentEnabled: c.env.AI_ENRICHMENT_ENABLED === undefined ? true : c.env.AI_ENRICHMENT_ENABLED === 'true'
    });
    return c.json(submission, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Failed to create submission.');
  }
});

app.get('/api/search', async (c) => {
  await ensurePhase2Data(c.env.DB);
  await ensurePhase4Data(c.env.DB, {
    AI: c.env.AI,
    VECTORIZE: c.env.VECTORIZE,
    semanticEnabled: c.env.SEMANTIC_SEARCH_ENABLED === undefined ? true : c.env.SEMANTIC_SEARCH_ENABLED === 'true',
    enrichmentEnabled: c.env.AI_ENRICHMENT_ENABLED === undefined ? true : c.env.AI_ENRICHMENT_ENABLED === 'true'
  });

  const query = c.req.query('q') || '';
  const page = parsePage(c.req.query('page'), 1);
  const pageSize = Math.min(parsePage(c.req.query('pageSize'), 10), 50);
  return c.json(
    await searchWithFallback(c.env.DB, query, page, pageSize, {
      AI: c.env.AI,
      VECTORIZE: c.env.VECTORIZE,
      semanticEnabled: c.env.SEMANTIC_SEARCH_ENABLED === undefined ? true : c.env.SEMANTIC_SEARCH_ENABLED === 'true',
      enrichmentEnabled: c.env.AI_ENRICHMENT_ENABLED === undefined ? true : c.env.AI_ENRICHMENT_ENABLED === 'true'
    })
  );
});

app.get('/api/graph/topics', async (c) => {
  await ensurePhase2Data(c.env.DB);
  const page = parsePage(c.req.query('page'), 1);
  const pageSize = Math.min(parsePage(c.req.query('pageSize'), 6), 24);
  return c.json(await listGraphTopics(c.env.DB, page, pageSize));
});

app.get('/api/graph/nodes/:id/expand', async (c) => {
  await ensurePhase2Data(c.env.DB);
  const limit = Math.min(parsePage(c.req.query('limit'), 6), 20);
  const excludeTopicNodeId = c.req.query('excludeTopicNodeId') ? Number.parseInt(c.req.query('excludeTopicNodeId') || '', 10) : null;
  const graph = await expandGraphNode(c.env.DB, c.req.param('id'), limit, Number.isFinite(excludeTopicNodeId || NaN) ? excludeTopicNodeId : null);

  if (!graph) {
    return c.json({ message: 'Graph node not found.' }, 404);
  }

  return c.json(graph);
});

app.get('/api/moderation/queue', async (c) => {
  await ensurePhase2Data(c.env.DB);
  return c.json({ items: getModerationQueue() });
});

app.get('/api/moderation/queue/:id', async (c) => {
  await ensurePhase2Data(c.env.DB);
  const item = getModerationQueue().find((entry) => entry.id === c.req.param('id'));

  if (!item) {
    return c.json({ message: 'Queue item not found.' }, 404);
  }

  return c.json(item);
});

app.post('/api/moderation/:id/:action', async (c) => {
  await ensurePhase2Data(c.env.DB);
  const item = getModerationQueue().find((entry) => entry.id === c.req.param('id'));

  if (!item) {
    return c.json({ message: 'Queue item not found.' }, 404);
  }

  return c.json({ ok: true, item: { ...item, status: c.req.param('action') === 'approve' ? 'Approved' : 'Rejected' } });
});

app.get('/api/authority/endorsements', async (c) => {
  await ensurePhase2Data(c.env.DB);
  return c.json({ items: getEndorsements() });
});

export default app;
