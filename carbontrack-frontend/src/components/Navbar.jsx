import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USE_MOCK } from '../api/client';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="brand">
        🌱 CarbonTrack {USE_MOCK && <span className="mock-pill">demo mode</span>}
      </div>
      <nav>
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/log">Log Activity</NavLink>
        <NavLink to="/activities">Activities</NavLink>
        <NavLink to="/profile">Profile</NavLink>
        {user && (
          <button onClick={handleLogout} style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            Logout
          </button>
        )}
      </nav>
    </header>
  );
}
