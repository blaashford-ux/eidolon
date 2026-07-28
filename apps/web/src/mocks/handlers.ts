import { delay, http, HttpResponse } from 'msw';
import { authorityProfiles, moderationItems, searchResults, submissions } from './data';

const sourceTypes = ['reddit', 'discord', 'blog', 'interview', 'manual'] as const;

const base = '*/api';

export const handlers = [
  http.get(`${base}/capabilities`, async () => {
    await delay(250);
    return HttpResponse.json({
      graph: false,
      semanticSearch: false,
      moderationAutomation: false,
      synthesis: false
    });
  }),

  http.get(`${base}/search`, async ({ request }) => {
    await delay(450);
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').toLowerCase().trim();

    if (!q) {
      return HttpResponse.json({
        mode: 'baseline',
        results: []
      });
    }

    const filtered = searchResults.filter((item) =>
      `${item.title} ${item.snippet} ${item.attributedAuthority}`.toLowerCase().includes(q)
    );

    return HttpResponse.json({
      mode: 'baseline',
      results: filtered
    });
  }),

  http.get(`${base}/submissions`, async () => {
    await delay(300);
    return HttpResponse.json({ submissions });
  }),

  http.get(`${base}/submissions/:id`, async ({ params }) => {
    await delay(300);
    const item = submissions.find((entry) => entry.id === params.id);
    if (!item) {
      return HttpResponse.json({ message: 'Submission not found.' }, { status: 404 });
    }
    return HttpResponse.json(item);
  }),

  http.post(`${base}/submissions`, async ({ request }) => {
    await delay(600);
    const body = (await request.json()) as Record<string, string>;

    if (!body.title || !body.content || !body.sourceType || !body.contributor || !body.attributedAuthority) {
      return HttpResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    const created = {
      id: `sub-${Date.now()}`,
      title: body.title,
      content: body.content,
      sourceType: sourceTypes.includes(body.sourceType as (typeof sourceTypes)[number])
        ? (body.sourceType as (typeof sourceTypes)[number])
        : 'manual',
      sourceUrl: body.sourceUrl,
      contributor: body.contributor,
      attributedAuthority: body.attributedAuthority,
      status: 'Submitted' as const,
      createdAt: new Date().toISOString()
    };

    submissions.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.get(`${base}/moderation/queue`, async () => {
    await delay(300);
    return HttpResponse.json({ items: moderationItems });
  }),

  http.get(`${base}/moderation/queue/:id`, async ({ params }) => {
    await delay(300);
    const item = moderationItems.find((entry) => entry.id === params.id);
    if (!item) {
      return HttpResponse.json({ message: 'Queue item not found.' }, { status: 404 });
    }
    return HttpResponse.json(item);
  }),

  http.post(`${base}/moderation/:id/:action`, async ({ params }) => {
    await delay(500);
    const item = moderationItems.find((entry) => entry.id === params.id);
    if (!item) {
      return HttpResponse.json({ message: 'Queue item not found.' }, { status: 404 });
    }

    if (params.action === 'approve') {
      item.status = 'Approved';
    } else if (params.action === 'reject') {
      item.status = 'Rejected';
    }

    return HttpResponse.json({ ok: true, item });
  }),

  http.get(`${base}/authority/profiles`, async () => {
    await delay(300);
    return HttpResponse.json({ profiles: authorityProfiles });
  }),

  http.get(`${base}/authority/profiles/:id`, async ({ params }) => {
    await delay(300);
    const profile = authorityProfiles.find((entry) => entry.id === params.id);
    if (!profile) {
      return HttpResponse.json({ message: 'Profile not found.' }, { status: 404 });
    }
    return HttpResponse.json(profile);
  }),

  http.post(`${base}/authority/profiles/claim`, async ({ request }) => {
    await delay(350);
    const body = (await request.json()) as { id: string };
    const profile = authorityProfiles.find((entry) => entry.id === body.id);
    if (!profile) {
      return HttpResponse.json({ message: 'Profile not found.' }, { status: 404 });
    }

    profile.claimed = true;
    return HttpResponse.json({ ok: true, profile });
  }),

  http.get(`${base}/authority/endorsements`, async () => {
    await delay(250);
    return HttpResponse.json({
      items: [
        {
          id: 'end-901',
          nodeTitle: 'Reader forgiveness on pacing dips in long series',
          authorityLevelSnapshot: 'Veteran',
          weight: 20,
          timestamp: '2026-07-24T16:12:00Z'
        },
        {
          id: 'end-902',
          nodeTitle: 'Rapid release and blurb iteration playbook',
          authorityLevelSnapshot: 'Practitioner',
          weight: 5,
          timestamp: '2026-07-26T10:40:00Z'
        }
      ]
    });
  })
];
