import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="container">
      <header className="topbar">
        <h2>JobTrackr</h2>
        <div>
          <span className="muted">Hi, {user.name} </span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>
      <p>Your applications will appear here.</p>
    </div>
  );
}