'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tweet, AuthStatusResponse } from '@/types';
import LoginButton from './LoginButton';
import AuthStatus from './AuthStatus';
import TweetFetcher from './TweetFetcher';
import TweetList from './TweetList';
import MarkdownEditor from './MarkdownEditor';
import TemplateEditor from './TemplateEditor';

export default function AppShell() {
  const [auth, setAuth] = useState<AuthStatusResponse | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editorMarkdown, setEditorMarkdown] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tweets' | 'template'>('tweets');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState({
    auth: true,
    tweets: false,
    compose: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('error');
    if (authError) {
      setError(`Authentication failed: ${authError}`);
      window.history.replaceState({}, '', '/');
    }

    fetch('/api/auth/status')
      .then((res) => res.json())
      .then((data: AuthStatusResponse) => {
        setAuth(data);
        setLoading((prev) => ({ ...prev, auth: false }));
      })
      .catch(() => {
        setAuth({ authenticated: false });
        setLoading((prev) => ({ ...prev, auth: false }));
      });
  }, []);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuth({ authenticated: false });
    setTweets([]);
    setSelectedIds(new Set());
    setEditorMarkdown(null);
  }, []);

  const handleFetchTweets = useCallback(async (startDate: string, endDate: string) => {
    setError(null);
    setLoading((prev) => ({ ...prev, tweets: true }));
    try {
      const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
      const res = await fetch(`/api/tweets?${params}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch tweets');
      }
      const data = await res.json();
      setTweets(data.tweets);
      setSelectedIds(new Set());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tweets');
    } finally {
      setLoading((prev) => ({ ...prev, tweets: false }));
    }
  }, []);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(tweets.map((t) => t.id)));
  }, [tweets]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleCompose = useCallback(async () => {
    setError(null);
    setLoading((prev) => ({ ...prev, compose: true }));
    try {
      const selectedTweets = tweets.filter((t) => selectedIds.has(t.id));
      const res = await fetch('/api/newsletter/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweets: selectedTweets }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to compose newsletter');
      }
      const data = await res.json();
      setEditorMarkdown(data.markdown);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to compose newsletter');
    } finally {
      setLoading((prev) => ({ ...prev, compose: false }));
    }
  }, [tweets, selectedIds]);

  if (loading.auth) {
    return <div className="loading">Loading...</div>;
  }

  if (!auth?.authenticated) {
    return (
      <>
        {error && (
          <div className="error-banner">
            {error}
            <button className="text-button" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
        <LoginButton />
      </>
    );
  }

  // Editor view: full-width markdown editor with live preview
  if (editorMarkdown !== null) {
    return (
      <div className="app">
        <AuthStatus username={auth.username || ''} onLogout={handleLogout} />
        <MarkdownEditor
          initialMarkdown={editorMarkdown}
          onBack={() => setEditorMarkdown(null)}
        />
      </div>
    );
  }

  // Tweet selection view
  return (
    <div className="app">
      <AuthStatus username={auth.username || ''} onLogout={handleLogout} />

      {error && (
        <div className="error-banner">
          {error}
          <button className="text-button" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="tab-bar">
        <button
          className={`tab-bar__tab${activeTab === 'tweets' ? ' tab-bar__tab--active' : ''}`}
          onClick={() => setActiveTab('tweets')}
        >
          Tweets
        </button>
        <button
          className={`tab-bar__tab${activeTab === 'template' ? ' tab-bar__tab--active' : ''}`}
          onClick={() => setActiveTab('template')}
        >
          Template
        </button>
      </div>

      {activeTab === 'tweets' ? (
        <>
          <TweetFetcher onFetch={handleFetchTweets} loading={loading.tweets} />

          <div className="tweet-section">
            <TweetList
              tweets={tweets}
              selectedIds={selectedIds}
              onToggle={handleToggle}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
            />
            {tweets.length > 0 && (
              <div className="compose-action">
                <button
                  className="compose-button"
                  onClick={handleCompose}
                  disabled={selectedIds.size === 0 || loading.compose}
                >
                  {loading.compose ? 'Composing...' : `Compose Newsletter (${selectedIds.size} tweets)`}
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="tab-content">
          <TemplateEditor />
        </div>
      )}
    </div>
  );
}
