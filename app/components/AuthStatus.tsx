'use client';

interface AuthStatusProps {
  username: string;
  onLogout: () => void;
}

export default function AuthStatus({ username, onLogout }: AuthStatusProps) {
  return (
    <header className="auth-header">
      <h1 className="app-title">Twitter to Newsletter</h1>
      <div className="auth-info">
        <span className="username">@{username}</span>
        <button className="logout-button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
