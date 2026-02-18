'use client';

import { useState, useEffect, useCallback } from 'react';
import { marked } from 'marked';

interface MarkdownEditorProps {
  initialMarkdown: string;
  onBack: () => void;
}

function downloadContent(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function MarkdownEditor({ initialMarkdown, onBack }: MarkdownEditorProps) {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => {
    const html = marked.parse(markdown);
    if (typeof html === 'string') {
      setPreviewHtml(html);
    } else {
      html.then(setPreviewHtml);
    }
  }, [markdown]);

  const handleDownload = useCallback(() => {
    downloadContent(markdown, 'newsletter.md', 'text/markdown');
  }, [markdown]);

  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        <button className="text-button" onClick={onBack}>
          &larr; Back to tweets
        </button>
        <button className="fetch-button" onClick={handleDownload}>
          Download Markdown
        </button>
      </div>
      <div className="editor-panels">
        <div className="editor-panel">
          <h3 className="editor-panel__title">Markdown</h3>
          <textarea
            className="editor-textarea"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck={false}
          />
        </div>
        <div className="editor-panel">
          <h3 className="editor-panel__title">Preview</h3>
          <div
            className="editor-preview"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>
    </div>
  );
}
