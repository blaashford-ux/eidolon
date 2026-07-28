import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlocks';
import { apiGet } from '../lib/api';
import type { AuthorityProfile } from '../types';

interface Endorsement {
  id: string;
  nodeTitle: string;
  authorityLevelSnapshot: string;
  weight: number;
  timestamp: string;
}

interface EndorsementResponse {
  items: Endorsement[];
}

export function ProfileDetailPage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<AuthorityProfile | null>(null);
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    Promise.all([
      apiGet<AuthorityProfile>(`/api/authority/profiles/${id}`),
      apiGet<EndorsementResponse>('/api/authority/endorsements')
    ])
      .then(([profileData, endorsementData]) => {
        setProfile(profileData);
        setEndorsements(endorsementData.items);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [id]);

  if (!id) {
    return <EmptyBlock detail="No authority profile id was provided." title="Missing authority profile id" />;
  }

  if (loading) {
    return <LoadingBlock detail="Loading authority profile and endorsement history." title="Loading profile" />;
  }

  if (error) {
    return <ErrorBlock detail={error} onRetry={load} title="Profile unavailable" />;
  }

  if (!profile) {
    return <EmptyBlock detail="This authority profile could not be found in the current mock dataset." title="Profile not found" />;
  }

  return (
    <section className="grid gap-4">
      <article className="panel">
        <h2 className="panel-title">{profile.displayName}</h2>
        <p className="panel-copy">
          Level: {profile.authorityLevel}. Endorsement model: Novice = 1, Practitioner = 5, Veteran = 20.
        </p>
      </article>

      <article className="panel">
        <h3 className="text-lg font-semibold text-white">Endorsement history (mock)</h3>
        {endorsements.length ? (
          <div className="mt-4 grid gap-3">
            {endorsements.map((item) => (
              <div className="rounded-xl border border-line/70 p-3" key={item.id}>
                <p className="text-sm text-white">{item.nodeTitle}</p>
                <p className="text-xs text-muted">
                  Snapshot {item.authorityLevelSnapshot} | Weight {item.weight} | {new Date(item.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">No endorsement actions are available yet for this persona in mock data.</p>
        )}
        <div className="mt-4">
          <Link className="btn-secondary" to="/features/endorsement-audit-export">
            Export audit placeholder
          </Link>
        </div>
      </article>
    </section>
  );
}
