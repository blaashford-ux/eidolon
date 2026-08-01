import { delay, http, HttpResponse } from 'msw';
import { authorityProfiles, moderationItems, searchResults, submissions } from './data';

const sourceTypes = ['reddit', 'discord', 'blog', 'interview', 'manual'] as const;

const graphTopics = [
  { id: 'topic-701', title: 'Writing Craft', summary: 'Pacing, scene construction, and prose-level craft guidance.', chunkCount: 2 },
  { id: 'topic-702', title: 'Reader Psychology', summary: 'Retention, payoff, and expectation-setting patterns.', chunkCount: 1 },
  { id: 'topic-703', title: 'Marketing', summary: 'Discovery, positioning, and conversion tactics.', chunkCount: 1 },
  { id: 'topic-704', title: 'Rapid Release', summary: 'Cadence, iteration, and launch rhythm strategies.', chunkCount: 1 },
  { id: 'topic-705', title: 'Cover Design', summary: 'Visual hierarchy and genre signaling on covers.', chunkCount: 1 },
  { id: 'topic-706', title: 'Pacing', summary: 'Rhythm, tension, and momentum in long-form fiction.', chunkCount: 1 },
  { id: 'topic-707', title: 'Series Planning', summary: 'Planning promise, payoff, and installment structure.', chunkCount: 1 },
  { id: 'topic-708', title: 'Blurbs', summary: 'Short-form packaging and conversion copy.', chunkCount: 1 },
  { id: 'topic-709', title: 'Genre Signaling', summary: 'Instant recognition cues for readers and ads.', chunkCount: 1 }
] as const;

const graphTopicExpansions: Record<string, Array<{ id: string; title: string; summary: string; sourceType: string; attributedAuthority: string }>> = {
  'topic-701': [
    {
      id: 'sub-101',
      title: 'Reader forgiveness on pacing dips in long series',
      summary: 'Readers are often more forgiving about pacing dips if promise and payoff stay clear.',
      sourceType: 'reddit',
      attributedAuthority: 'Aster Vale'
    },
    {
      id: 'sub-103',
      title: 'Cover typography hierarchy and genre signaling',
      summary: 'Title hierarchy often does more work than artwork detail for instant genre read.',
      sourceType: 'blog',
      attributedAuthority: 'Lena Kade'
    }
  ],
  'topic-702': [
    {
      id: 'sub-101',
      title: 'Reader forgiveness on pacing dips in long series',
      summary: 'Readers are often more forgiving about pacing dips if promise and payoff stay clear.',
      sourceType: 'reddit',
      attributedAuthority: 'Aster Vale'
    }
  ],
  'topic-703': [
    {
      id: 'sub-102',
      title: 'Rapid release and blurb iteration playbook',
      summary: 'Blurbs can carry most conversion gains before ad scaling if tested in short cycles.',
      sourceType: 'discord',
      attributedAuthority: 'Rex Marlowe'
    }
  ],
  'topic-704': [
    {
      id: 'sub-102',
      title: 'Rapid release and blurb iteration playbook',
      summary: 'Blurbs can carry most conversion gains before ad scaling if tested in short cycles.',
      sourceType: 'discord',
      attributedAuthority: 'Rex Marlowe'
    }
  ],
  'topic-705': [
    {
      id: 'sub-103',
      title: 'Cover typography hierarchy and genre signaling',
      summary: 'Title hierarchy often does more work than artwork detail for instant genre read.',
      sourceType: 'blog',
      attributedAuthority: 'Lena Kade'
    }
  ],
  'topic-706': [
    {
      id: 'sub-101',
      title: 'Reader forgiveness on pacing dips in long series',
      summary: 'Readers are often more forgiving about pacing dips if promise and payoff stay clear.',
      sourceType: 'reddit',
      attributedAuthority: 'Aster Vale'
    }
  ],
  'topic-707': [
    {
      id: 'sub-101',
      title: 'Reader forgiveness on pacing dips in long series',
      summary: 'Readers are often more forgiving about pacing dips if promise and payoff stay clear.',
      sourceType: 'reddit',
      attributedAuthority: 'Aster Vale'
    }
  ],
  'topic-708': [
    {
      id: 'sub-102',
      title: 'Rapid release and blurb iteration playbook',
      summary: 'Blurbs can carry most conversion gains before ad scaling if tested in short cycles.',
      sourceType: 'discord',
      attributedAuthority: 'Rex Marlowe'
    }
  ],
  'topic-709': [
    {
      id: 'sub-103',
      title: 'Cover typography hierarchy and genre signaling',
      summary: 'Title hierarchy often does more work than artwork detail for instant genre read.',
      sourceType: 'blog',
      attributedAuthority: 'Lena Kade'
    }
  ]
};

function tokenizeQuery(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}

function textScore(text: string, tokens: string[]): number {
  if (tokens.length === 0) {
    return 0;
  }

  let score = 0;
  for (const token of tokens) {
    if (text.includes(token)) {
      score += 1;
    }
  }

  if (tokens.length > 1 && text.includes(tokens.join(' '))) {
    score += tokens.length;
  }

  return score;
}

function graphExpandForChunk(chunkId: string) {
  switch (chunkId) {
    case 'sub-101':
      return {
        authority: {
          id: 'auth-301',
          title: 'Aster Vale',
          summary: 'Authority level: Veteran',
          subtitle: 'Claimed profile',
          claimed: true
        },
        relatedTopics: [
          { id: 'topic-701', title: 'Writing Craft', summary: 'Pacing, scene construction, and prose-level craft guidance.' },
          { id: 'topic-702', title: 'Reader Psychology', summary: 'Retention, payoff, and expectation-setting patterns.' },
          { id: 'topic-706', title: 'Pacing', summary: 'Rhythm, tension, and momentum in long-form fiction.' },
          { id: 'topic-707', title: 'Series Planning', summary: 'Planning promise, payoff, and installment structure.' }
        ]
      };
    case 'sub-102':
      return {
        authority: {
          id: 'auth-302',
          title: 'Rex Marlowe',
          summary: 'Authority level: Practitioner',
          subtitle: 'Unclaimed profile',
          claimed: false
        },
        relatedTopics: [
          { id: 'topic-703', title: 'Marketing', summary: 'Discovery, positioning, and conversion tactics.' },
          { id: 'topic-704', title: 'Rapid Release', summary: 'Cadence, iteration, and launch rhythm strategies.' },
          { id: 'topic-708', title: 'Blurbs', summary: 'Short-form packaging and conversion copy.' }
        ]
      };
    case 'sub-103':
      return {
        authority: {
          id: 'auth-303',
          title: 'Lena Kade',
          summary: 'Authority level: Novice',
          subtitle: 'Claimed profile',
          claimed: true
        },
        relatedTopics: [
          { id: 'topic-705', title: 'Cover Design', summary: 'Visual hierarchy and genre signaling on covers.' },
          { id: 'topic-709', title: 'Genre Signaling', summary: 'Instant recognition cues for readers and ads.' }
        ]
      };
    default:
      return null;
  }
}

const base = '*/api';

export const handlers = [
  http.get(`${base}/capabilities`, async () => {
    await delay(250);
    return HttpResponse.json({
      graph: true,
      semanticSearch: true,
      moderationAutomation: false,
      synthesis: false
    });
  }),

  http.get(`${base}/graph/topics`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = Math.max(Number.parseInt(url.searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(Number.parseInt(url.searchParams.get('pageSize') || '6', 10), 1), 24);
    const start = (page - 1) * pageSize;
    const nodes = graphTopics.slice(start, start + pageSize).map((topic) => ({
      id: topic.id,
      role: 'topic',
      title: topic.title,
      summary: topic.summary,
      subtitle: `${topic.chunkCount} linked chunk${topic.chunkCount === 1 ? '' : 's'}`,
      expandable: true,
      chunkCount: topic.chunkCount
    }));

    return HttpResponse.json({
      nodes,
      edges: [],
      pagination: {
        page,
        pageSize,
        total: graphTopics.length
      }
    });
  }),

  http.get(`${base}/graph/nodes/:id/expand`, async ({ params, request }) => {
    await delay(420);
    const url = new URL(request.url);
    const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get('limit') || '6', 10), 1), 20);
    const graphNodeId = Array.isArray(params.id) ? params.id[0] : params.id || '';

    if (graphNodeId.startsWith('topic-')) {
      const topic = graphTopics.find((entry) => entry.id === graphNodeId);
      if (!topic) {
        return HttpResponse.json({ message: 'Graph node not found.' }, { status: 404 });
      }

      const chunks = (graphTopicExpansions[graphNodeId] || []).slice(0, limit);
      return HttpResponse.json({
        centerId: graphNodeId,
        nodes: chunks.map((chunk, index) => ({
          id: chunk.id,
          role: 'chunk',
          title: chunk.title,
          summary: chunk.summary,
          subtitle: `${chunk.sourceType} • ${chunk.attributedAuthority}`,
          expandable: true,
          parentId: params.id,
          sourceType: chunk.sourceType,
          attributedAuthority: chunk.attributedAuthority,
          siblingIndex: index
        })),
        edges: chunks.map((chunk) => ({
          id: `edge-${graphNodeId}-${chunk.id}`,
          source: graphNodeId,
          target: chunk.id,
          relationshipType: 'RELATED'
        }))
      });
    }

    if (graphNodeId.startsWith('sub-')) {
      const expansion = graphExpandForChunk(graphNodeId);
      if (!expansion) {
        return HttpResponse.json({ message: 'Graph node not found.' }, { status: 404 });
      }

      const excludeTopicId = url.searchParams.get('excludeTopicNodeId') || '';
      const relatedTopics = expansion.relatedTopics
        .filter((topic) => topic.id !== `topic-${excludeTopicId}`)
        .slice(0, limit);

      return HttpResponse.json({
        centerId: graphNodeId,
        nodes: [
          {
            id: expansion.authority.id,
            role: 'authority',
            title: expansion.authority.title,
            summary: expansion.authority.summary,
            subtitle: expansion.authority.subtitle,
            expandable: false,
            parentId: graphNodeId,
            claimed: expansion.authority.claimed,
            authorityLevel: expansion.authority.summary.replace('Authority level: ', '')
          },
          ...relatedTopics.map((topic, index) => ({
            id: topic.id,
            role: 'related-topic',
            title: topic.title,
            summary: topic.summary,
            subtitle: 'Shared topic tag',
            expandable: true,
            parentId: graphNodeId,
            siblingIndex: index
          }))
        ],
        edges: [
          {
            id: `edge-${graphNodeId}-${expansion.authority.id}`,
            source: graphNodeId,
            target: expansion.authority.id,
            relationshipType: 'DERIVED_FROM'
          },
          ...relatedTopics.map((topic) => ({
            id: `edge-${graphNodeId}-${topic.id}`,
            source: graphNodeId,
            target: topic.id,
            relationshipType: 'RELATED'
          }))
        ]
      });
    }

    return HttpResponse.json({ centerId: graphNodeId, nodes: [], edges: [] });
  }),

  http.get(`${base}/search`, async ({ request }) => {
    await delay(450);
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').trim();

    if (!q) {
      return HttpResponse.json({
        mode: 'baseline',
        results: []
      });
    }

    const tokens = tokenizeQuery(q);
    const chunkCandidates = searchResults
      .map((item) => ({
        item,
        score: textScore(`${item.title} ${item.snippet} ${item.attributedAuthority}`, tokens) + (item.attributedAuthority.includes('Aster') ? 2 : 0)
      }))
      .filter((entry) => entry.score > 0);

    const topicCandidates = graphTopics
      .map((topic) => ({
        item: {
          id: topic.id,
          title: topic.title,
          snippet: topic.summary,
          sourceType: 'topic',
          attributedAuthority: '',
          kind: 'topic' as const
        },
        score: textScore(`${topic.title} ${topic.summary}`, tokens) + 5
      }))
      .filter((entry) => entry.score > 0);

    const filtered = [...topicCandidates, ...chunkCandidates]
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        if (a.item.kind !== b.item.kind) {
          return a.item.kind === 'topic' ? -1 : 1;
        }

        return a.item.title.localeCompare(b.item.title);
      })
      .map((entry) => entry.item);

    return HttpResponse.json({
      mode: 'semantic',
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
