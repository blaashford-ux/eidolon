import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { FeaturePlaceholder } from '../components/FeaturePlaceholder';

const map: Record<string, { title: string; summary: string }> = {
  'semantic-search': {
    title: 'Semantic retrieval behavior',
    summary: 'Phase 4 uses Workers AI embeddings and Vectorize when available, then falls back to baseline retrieval if semantic services fail.'
  },
  'semantic-ranking': {
    title: 'Result ranking preview',
    summary: 'Authority-context and semantic weighting visuals are planned for post-Phase 2 integration.'
  },
  'graph-expansion': {
    title: 'Graph expansion preview',
    summary: 'Topic-to-chunk-to-authority expansion starts in Phase 3 and will remain incremental-only.'
  },
  'endorsement-audit-export': {
    title: 'Endorsement export preview',
    summary: 'Audit exports are intentionally delayed while Phase 2 focuses on live core workflow coverage.'
  }
};

export function FeaturePlaceholderPage() {
  const { feature } = useParams();
  const value = useMemo(() => {
    if (!feature || !map[feature]) {
      return {
        title: 'Feature preview',
        summary: 'This route is intentionally scaffolded so unfinished capabilities remain non-blocking.'
      };
    }
    return map[feature];
  }, [feature]);

  return <FeaturePlaceholder routeHint={`/features/${feature || 'unknown'}`} summary={value.summary} title={value.title} />;
}
