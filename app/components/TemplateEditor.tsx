'use client';

import { useState, useEffect } from 'react';

export default function TemplateEditor() {
  const [content, setContent] = useState('');
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    fetch('/api/template')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then((data) => {
        setContent(data.content);
        setLoadStatus('ready');
      })
      .catch(() => {
        setLoadStatus('error');
      });
  }, []);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  if (loadStatus === 'loading') {
    return <div className="template-editor template-editor--loading">Loading template...</div>;
  }

  if (loadStatus === 'error') {
    return <div className="template-editor template-editor--error">Failed to load template.</div>;
  }

  return (
    <div className="template-editor">
      <div className="template-editor__header">
        <p className="template-editor__hint">
          This template is used as a one-shot example when generating your newsletter. Use{' '}
          <code>{'{username}'}</code> as a placeholder for your Twitter handle.
        </p>
        <div className="template-editor__actions">
          {saveStatus === 'saved' && (
            <span className="template-editor__feedback template-editor__feedback--success">Saved!</span>
          )}
          {saveStatus === 'error' && (
            <span className="template-editor__feedback template-editor__feedback--error">Save failed.</span>
          )}
          <button
            className="fetch-button"
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
      <textarea
        className="template-editor__textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        spellCheck={false}
        aria-label="Newsletter template"
      />
    </div>
  );
}
