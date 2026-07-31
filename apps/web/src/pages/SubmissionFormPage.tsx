import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { LoadingBlock } from '../components/StateBlocks';
import { apiGet, apiPost } from '../lib/api';
import { CLERK_ENABLED } from '../lib/config';
import type { AuthorityProfile } from '../types';

interface Payload {
  title: string;
  content: string;
  sourceType: string;
  sourceUrl: string;
}

const initialState: Payload = {
  title: '',
  content: '',
  sourceType: 'reddit',
  sourceUrl: ''
};

interface ProfilesResponse {
  profiles: AuthorityProfile[];
}

interface SubmissionFormContentProps {
  contributorName: string;
}

function SubmissionFormContent({ contributorName }: SubmissionFormContentProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<Payload>(initialState);
  const [profiles, setProfiles] = useState<AuthorityProfile[]>([]);
  const [attributionInput, setAttributionInput] = useState('');
  const [selectedAuthorityId, setSelectedAuthorityId] = useState('');
  const [attributionOpen, setAttributionOpen] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const attributionRef = useRef<HTMLDivElement | null>(null);
  const attributionInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setLoadingProfiles(true);
    setProfileError('');

    apiGet<ProfilesResponse>('/api/authority/profiles')
      .then((data) => {
        setProfiles(data.profiles);
        const claimedProfile = data.profiles.find((profile) => profile.claimed);
        if (claimedProfile) {
          setSelectedAuthorityId(claimedProfile.id);
          setAttributionInput(claimedProfile.displayName);
        }
      })
      .catch((err: Error) => setProfileError(err.message))
      .finally(() => setLoadingProfiles(false));
  }, []);

  const filteredProfiles = useMemo(() => {
    const needle = attributionInput.trim().toLowerCase();
    if (!needle) {
      return profiles;
    }

    return profiles.filter((profile) => {
      const parts = profile.displayName.toLowerCase().split(/\s+/).filter(Boolean);
      return parts.some((part) => part.startsWith(needle));
    });
  }, [profiles, attributionInput]);

  const selectedAuthority = useMemo(
    () => profiles.find((profile) => profile.id === selectedAuthorityId),
    [profiles, selectedAuthorityId]
  );

  useEffect(() => {
    function onDocumentMouseDown(event: MouseEvent) {
      const root = attributionRef.current;
      if (!root) {
        return;
      }

      if (!root.contains(event.target as Node)) {
        setAttributionOpen(false);
      }
    }

    document.addEventListener('mousedown', onDocumentMouseDown);
    return () => document.removeEventListener('mousedown', onDocumentMouseDown);
  }, []);

  function onAttributionChange(raw: string) {
    setAttributionInput(raw);
    setAttributionOpen(true);

    const normalized = raw.trim().toLowerCase();
    if (!normalized) {
      setSelectedAuthorityId('');
      return;
    }

    const exact = profiles.find((profile) => profile.displayName.toLowerCase() === normalized);
    setSelectedAuthorityId(exact?.id || '');
  }

  function selectAuthority(profile: AuthorityProfile) {
    setAttributionInput(profile.displayName);
    setSelectedAuthorityId(profile.id);
    setAttributionOpen(false);
  }

  function update<K extends keyof Payload>(key: K, value: Payload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!form.title || !form.content || !form.sourceType || !contributorName || !selectedAuthorityId) {
      setError('Fill all required fields before submitting.');
      return;
    }

    if (!selectedAuthority) {
      setError('Select a valid attribution profile before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      await apiPost('/api/submissions', {
        ...form,
        contributor: contributorName,
        attributedAuthority: selectedAuthority.displayName
      });
      navigate('/submissions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <h2 className="panel-title">New knowledge submission</h2>
      <p className="panel-copy">Phase 2 writes submissions to the live API and D1-backed persistence.</p>

      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        <label className="field-label">
          Title *
          <input className="field-input" value={form.title} onChange={(e) => update('title', e.target.value)} />
        </label>

        <label className="field-label">
          Original content *
          <textarea
            className="field-input min-h-36"
            value={form.content}
            onChange={(e) => update('content', e.target.value)}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            Source type *
            <select className="field-input" value={form.sourceType} onChange={(e) => update('sourceType', e.target.value)}>
              <option value="reddit">Reddit</option>
              <option value="discord">Discord</option>
              <option value="blog">Blog</option>
              <option value="interview">Interview</option>
              <option value="manual">Manual</option>
            </select>
          </label>

          <label className="field-label">
            Source URL
            <input className="field-input" value={form.sourceUrl} onChange={(e) => update('sourceUrl', e.target.value)} />
          </label>
        </div>

        <label className="field-label">
          Contributor *
          <input className="field-input" readOnly value={contributorName} />
        </label>

        <div className="grid gap-2">
          <label className="field-label">
            Attribution *
            <div className="combo" ref={attributionRef}>
              <input
                ref={attributionInputRef}
                aria-expanded={attributionOpen}
                aria-haspopup="listbox"
                className="field-input pr-9"
                placeholder="Type to filter authorities, then pick one"
                value={attributionInput}
                onChange={(event) => onAttributionChange(event.target.value)}
                onFocus={() => setAttributionOpen(true)}
              />
              <button
                className="combo-toggle"
                type="button"
                onClick={() => {
                  setAttributionOpen((prev) => !prev);
                  attributionInputRef.current?.focus();
                }}
              >
                ▾
              </button>

              {attributionOpen && !loadingProfiles && !profileError ? (
                <div className="combo-menu" role="listbox">
                  {filteredProfiles.length > 0 ? (
                    filteredProfiles.map((profile) => (
                      <button
                        className="combo-option"
                        key={profile.id}
                        type="button"
                        onClick={() => selectAuthority(profile)}
                      >
                        <span>{profile.displayName}</span>
                        <span className="text-xs text-muted">
                          {profile.authorityLevel} | {profile.topics.join(', ')}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="combo-empty">No authorities match this filter.</p>
                  )}
                </div>
              ) : null}
            </div>
          </label>

          {loadingProfiles ? <p className="text-xs text-muted">Loading authority profiles...</p> : null}
          {profileError ? <p className="text-xs text-rose-300">Could not load authorities: {profileError}</p> : null}
          {!loadingProfiles && !profileError && attributionInput.trim().length > 0 && !selectedAuthority ? (
            <p className="text-xs text-amber-200">Pick an authority from suggestions to set a valid attribution.</p>
          ) : null}
          {selectedAuthority ? (
            <p className="text-xs text-muted">
              Selected: {selectedAuthority.displayName} ({selectedAuthority.authorityLevel}) | Topics:{' '}
              {selectedAuthority.topics.join(', ')}
            </p>
          ) : null}
        </div>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button className="btn-primary" disabled={submitting || loadingProfiles || !!profileError} type="submit">
            {submitting ? 'Submitting...' : 'Submit knowledge chunk'}
          </button>
        </div>
      </form>
    </section>
  );
}

export function SubmissionFormPage() {
  if (CLERK_ENABLED) {
    return <AuthedSubmissionFormPage />;
  }

  return <SubmissionFormContent contributorName="Local Dev User" />;
}

function AuthedSubmissionFormPage() {
  const { isLoaded, user } = useUser();

  if (!isLoaded) {
    return <LoadingBlock detail="Loading signed-in user identity for contributor attribution." title="Loading user" />;
  }

  const contributorName = user?.fullName || user?.primaryEmailAddress?.emailAddress || user?.username || 'Authenticated User';
  return <SubmissionFormContent contributorName={contributorName} />;
}
