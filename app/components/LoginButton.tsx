'use client';

export default function LoginButton() {
  const handleLogin = () => {
    window.location.href = '/api/auth/twitter';
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Twitter to Newsletter</h1>
      <p className="login-description">
        Fetch your tweets and compose them into a newsletter.
      </p>
      <button className="login-button" onClick={handleLogin}>
        Connect with Twitter
      </button>
    </div>
  );
}
