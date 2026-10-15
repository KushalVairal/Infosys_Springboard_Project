import { useEffect, useState } from 'react';
import { getMyProfile, updateMyProfile } from '../api/users';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import '../styles/auth.css';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getMyProfile()
      .then((p) => {
        setProfile(p);
        setForm({
          username: p.username,
          email: p.email,
          preferredUnits: p.preferredUnits || 'metric',
          goalVisibility: p.goalVisibility ?? true,
          leaderboardOptIn: p.leaderboardOptIn ?? true,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await updateMyProfile(form);
      setProfile(updated);
      setToast({ message: 'Profile updated', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Update failed', type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;
  if (!profile) return <div className="page">Profile not found</div>;

  const row = { flexDirection: 'row', alignItems: 'center', gap: '0.6rem' };

  return (
    <div className="page">
      <h2>My Profile</h2>
      <div className="card" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div className="form-group">
            <label>Username</label>
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Preferred Units</label>
            <select value={form.preferredUnits} onChange={(e) => setForm({ ...form, preferredUnits: e.target.value })}>
              <option value="metric">Metric</option>
              <option value="imperial">Imperial</option>
            </select>
          </div>
          <div className="form-group" style={row}>
            <input type="checkbox" style={{ width: 'auto' }} checked={form.goalVisibility} onChange={(e) => setForm({ ...form, goalVisibility: e.target.checked })} />
            <label style={{ margin: 0 }}>Show my goals to others</label>
          </div>
          <div className="form-group" style={row}>
            <input type="checkbox" style={{ width: 'auto' }} checked={form.leaderboardOptIn} onChange={(e) => setForm({ ...form, leaderboardOptIn: e.target.checked })} />
            <label style={{ margin: 0 }}>Include me on the community leaderboard</label>
          </div>
          <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button>
        </form>
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
