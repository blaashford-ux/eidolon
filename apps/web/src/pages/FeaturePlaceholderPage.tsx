import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { FeaturePlaceholder } from '../components/FeaturePlaceholder';

const map: Record<string, { title: string; summary: string }> = {
  'semantic-search': {
    title: 'Semantic search is not wired yet',
    summary: 'Phase 1 keeps retrieval in baseline mode. Semantic ranking arrives in Phase 4 with Vectorize embeddings.'
  },
  'semantic-ranking': {
    title: 'Result ranking explanation placeholder',
    summary: 'Authority-context and semantic weighting visuals are planned for post-Phase 2 integration.'
  },
  'graph-expansion': {
    title: 'Graph expansion placeholder',
    summary: 'Topic-to-chunk-to-authority expansion starts in Phase 3 and will remain incremental-only.'
  },
  'endorsement-audit-export': {
    title: 'Endorsement export placeholder',
    summary: 'Audit exports are intentionally delayed while Phase 1 focuses on end-to-end UX coverage.'
  }
};

export function FeaturePlaceholderPage() {
  const { feature } = useParams();
  const value = useMemo(() => {
    if (!feature || !map[feature]) {
      return {
        title: 'Feature placeholder',
        summary: 'This path is intentionally scaffolded so unfinished capabilities fail gracefully.'
      };
    }
    return map[feature];
  }, [feature]);

  return <FeaturePlaceholder routeHint={`/features/${feature || 'unknown'}`} summary={value.summary} title={value.title} />;
}
