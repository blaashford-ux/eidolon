export type Persona = 'contributor' | 'reader' | 'curator' | 'authority-owner';

export interface Submission {
  id: string;
  title: string;
  content: string;
  sourceType: 'reddit' | 'discord' | 'blog' | 'interview' | 'manual';
  sourceUrl?: string;
  contributor: string;
  attributedAuthority: string;
  status: 'Draft' | 'Submitted' | 'Pending Review' | 'Published' | 'Rejected';
  summary?: string;
  createdAt: string;
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  sourceType: string;
  attributedAuthority: string;
}

export interface ModerationItem {
  id: string;
  title: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  duplicateHint: string;
  qualityHint: string;
  submittedBy: string;
}

export interface AuthorityProfile {
  id: string;
  displayName: string;
  authorityLevel: 'Novice' | 'Practitioner' | 'Veteran';
  claimed: boolean;
  topics: string[];
}

export interface CapabilityMap {
  graph: boolean;
  semanticSearch: boolean;
  moderationAutomation: boolean;
  synthesis: boolean;
}
