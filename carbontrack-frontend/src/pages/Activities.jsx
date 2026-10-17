import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listActivities } from '../api/activities';
import Spinner from '../components/Spinner';
import '../styles/auth.css';

const CATEGORIES = ['', 'TRANSPORT', 'ELECTRICITY', 'FOOD', 'SHOPPING'];

export default function Activities() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', from: '', to: '', page: 0, size: 10 });
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    listActivities({
      category: filters.category || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      page: filters.page,
      size: filters.size,
    })
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || 'Failed to load'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters]);

  const set = (patch) => setFilters({ ...filters, page: 0, ...patch });

  return (
    <div className="page">
      <h2>My Activities</h2>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="filters-grid">
          <div className="form-group">
            <label>Category</label>
            <select value={filters.category} onChange={(e) => set({ category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c || 'All'}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>From</label>
            <input type="date" value={filters.from} onChange={(e) => set({ from: e.target.value })} />
          </div>
          <div className="form-group">
            <label>To</label>
            <input type="date" value={filters.to} onChange={(e) => set({ to: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Page Size</label>
            <select value={filters.size} onChange={(e) => set({ size: +e.target.value })}>
              {[10, 20, 50].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {loading ? (
        <Spinner />
      ) : data && data.content?.length ? (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th><th>Category</th><th>Type</th><th>Quantity</th><th>CO₂e (kg)</th><th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((a) => (
                  <tr key={a.id}>
                    <td>{a.logDate}</td>
                    <td><span className={`badge ${a.category.toLowerCase()}`}>{a.category}</span></td>
                    <td>{a.activityType}</td>
                    <td>{a.quantity} {a.unit}</td>
                    <td><strong>{a.co2eKg}</strong></td>
                    <td>{a.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.2rem' }}>
            <button disabled={data.first} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>← Prev</button>
            <span style={{ alignSelf: 'center', color: 'var(--muted)' }}>
              Page {data.number + 1} of {data.totalPages || 1}
            </span>
            <button disabled={data.last} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next →</button>
          </div>
        </>
      ) : (
        <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>
          No activities found. <Link to="/log">Log your first one</Link>.
        </p>
      )}
    </div>
  );
}
