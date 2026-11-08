import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="container">
      <header className="topbar">
        <h2>JobTracker</h2>
        <nav className="nav">
          <NavLink to="/" end>List</NavLink>
          <NavLink to="/board">Board</NavLink>
          <NavLink to="/analytics">Analytics</NavLink>
        </nav>
        <div className="row">
          <span className="muted">Hi, {user.name}</span>
          <button className="secondary" onClick={logout}>Logout</button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}