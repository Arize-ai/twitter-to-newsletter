'use client';

export default function LoginButton() {
  const handleLogin = () => {
    window.location.href = '/api/auth/twitter';
  };

  return (
    <div className="landing">
      <div className="landing-hero">
        <h1 className="landing-title">
          Turn your tweets into<br />
          <span className="landing-title-accent">genuinely useful newsletters</span>
        </h1>
        <p className="landing-subtitle">
          Pull your recent tweets, pick the highlights, and let AI compose a
          polished monthly roundup — ready to send in minutes, not hours.
        </p>
        <div className="landing-features">
          <div className="landing-feature">
            <div className="landing-feature-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
            </div>
            <h3>Fetch & Filter</h3>
            <p>Pull tweets from any date range and cherry-pick the ones worth sharing.</p>
          </div>
          <div className="landing-feature">
            <div className="landing-feature-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <h3>AI-Powered Drafts</h3>
            <p>One click generates a structured newsletter that aggregates your content intelligently.</p>
          </div>
          <div className="landing-feature">
            <div className="landing-feature-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <h3>Edit & Export</h3>
            <p>Fine-tune in the live markdown editor, then download and send.</p>
          </div>
          <div className="landing-feature">
            <div className="landing-feature-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3>Engagement-Aware</h3>
            <p>AI puts your most successful content first so readers see what resonated.</p>
          </div>
        </div>
        <button className="landing-cta" onClick={handleLogin}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Connect with Twitter
        </button>
      </div>

      <div className="landing-screenshot">
        <img
          src="/screenshot.png"
          alt="Twitter to Newsletter app showing a side-by-side markdown editor with live preview of a monthly content roundup"
        />
      </div>

      <div className="landing-opensource">
        <a
          href="https://github.com/Arize-ai/twitter-to-newsletter"
          target="_blank"
          rel="noopener noreferrer"
          className="landing-github-link"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Open source on GitHub
        </a>
      </div>
    </div>
  );
}
