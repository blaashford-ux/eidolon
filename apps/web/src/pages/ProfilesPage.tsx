import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlocks';
import { apiGet, apiPost } from '../lib/api';
import type { AuthorityProfile } from '../types';

interface ProfilesResponse {
  profiles: AuthorityProfile[];
}

export function ProfilesPage() {
  const [profiles, setProfiles] = useState<AuthorityProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimingId, setClaimingId] = useState('');

  function load() {
    setLoading(true);
    setError('');
    apiGet<ProfilesResponse>('/api/authority/profiles')
      .then((data) => setProfiles(data.profiles))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function claim(id: string) {
    setClaimingId(id);
    setError('');
    try {
      await apiPost('/api/authority/profiles/claim', { id });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Claim failed.');
    } finally {
      setClaimingId('');
    }
  }

  if (loading) {
    return <LoadingBlock detail="Loading authority profile catalog and claim states." title="Loading profiles" />;
  }

  if (error && profiles.length === 0) {
    return <ErrorBlock detail={error} onRetry={load} title="Profiles unavailable" />;
  }

  if (!profiles.length) {
    return <EmptyBlock detail="No authority profiles are available in the current dataset." title="No profiles" />;
  }

  return (
    <section className="grid gap-4">
      <article className="panel">
        <h2 className="panel-title">Authority profiles</h2>
        <p className="panel-copy">Claim and inspect authority identities in a route-guarded live flow.</p>
        {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}
      </article>

      {profiles.map((profile) => (
        <article className="panel" key={profile.id}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">{profile.displayName}</h3>
            <span className="status-chip">{profile.authorityLevel}</span>
          </div>
          <p className="mt-2 text-sm text-muted">Topics: {profile.topics.join(', ')}</p>
          <p className="mt-2 text-sm text-muted">Claimed: {profile.claimed ? 'Yes' : 'No'}</p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link className="btn-secondary" to={`/authority/${profile.id}`}>
              Open profile
            </Link>
            {!profile.claimed ? (
              <button className="btn-primary" disabled={claimingId === profile.id} onClick={() => claim(profile.id)} type="button">
                {claimingId === profile.id ? 'Claiming...' : 'Claim profile'}
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  );
}
