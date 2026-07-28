import type { AuthorityProfile, ModerationItem, SearchResult, Submission } from '../types';

export const submissions: Submission[] = [
  {
    id: 'sub-101',
    title: 'Reader forgiveness on pacing dips in long series',
    content: 'Readers are often more forgiving about pacing dips if promise and payoff stay clear.',
    sourceType: 'reddit',
    sourceUrl: 'https://reddit.com/r/haremlit/example-1',
    contributor: 'Casey Writer',
    attributedAuthority: 'Aster Vale',
    status: 'Published',
    summary: 'Advice on pacing and payoff in reader retention.',
    createdAt: '2026-07-20T11:30:00Z'
  },
  {
    id: 'sub-102',
    title: 'Rapid release and blurb iteration playbook',
    content: 'Blurbs can carry most conversion gains before ad scaling if tested in short cycles.',
    sourceType: 'discord',
    contributor: 'Nora Draft',
    attributedAuthority: 'Rex Marlowe',
    status: 'Pending Review',
    createdAt: '2026-07-24T09:00:00Z'
  },
  {
    id: 'sub-103',
    title: 'Cover typography hierarchy and genre signaling',
    content: 'Title hierarchy often does more work than artwork detail for instant genre read.',
    sourceType: 'blog',
    sourceUrl: 'https://example.com/covers-genre-signaling',
    contributor: 'Miles Finch',
    attributedAuthority: 'Lena Kade',
    status: 'Rejected',
    createdAt: '2026-07-26T18:10:00Z'
  }
];

export const searchResults: SearchResult[] = submissions.map((item) => ({
  id: item.id,
  title: item.title,
  snippet: item.summary || item.content,
  sourceType: item.sourceType,
  attributedAuthority: item.attributedAuthority
}));

export const moderationItems: ModerationItem[] = [
  {
    id: 'mod-401',
    title: 'Rapid release and blurb iteration playbook',
    status: 'Pending',
    duplicateHint: 'Potential overlap with sub-087 (71%).',
    qualityHint: 'Missing source URL proof context.',
    submittedBy: 'Nora Draft'
  },
  {
    id: 'mod-402',
    title: 'Book cover hierarchy in KU categories',
    status: 'Approved',
    duplicateHint: 'No significant duplicates detected.',
    qualityHint: 'Well-attributed source excerpt.',
    submittedBy: 'Casey Writer'
  }
];

export const authorityProfiles: AuthorityProfile[] = [
  {
    id: 'auth-301',
    displayName: 'Aster Vale',
    authorityLevel: 'Veteran',
    claimed: true,
    topics: ['Writing Craft', 'Reader Psychology']
  },
  {
    id: 'auth-302',
    displayName: 'Rex Marlowe',
    authorityLevel: 'Practitioner',
    claimed: false,
    topics: ['Marketing', 'Rapid Release']
  },
  {
    id: 'auth-303',
    displayName: 'Lena Kade',
    authorityLevel: 'Novice',
    claimed: true,
    topics: ['Cover Design']
  }
];
