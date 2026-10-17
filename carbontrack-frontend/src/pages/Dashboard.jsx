import { useEffect, useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { listActivities } from '../api/activities';
import Spinner from '../components/Spinner';
import '../styles/dashboard.css';

const COLORS = ['#1565c0', '#ef6c00', '#ad1457', '#4527a0'];

export default function Dashboard() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    listActivities({
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      size: 200,
    })
      .then((res) => setActivities(res.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalCo2 = useMemo(
    () => activities.reduce((sum, a) => sum + Number(a.co2eKg), 0).toFixed(2),
    [activities]
  );

  const categoryData = useMemo(() => {
    const totals = { TRANSPORT: 0, ELECTRICITY: 0, FOOD: 0, SHOPPING: 0 };
    activities.forEach((a) => { totals[a.category] = (totals[a.category] || 0) + Number(a.co2eKg); });
    return Object.entries(totals).map(([name, value]) => ({ name, value: +value.toFixed(2) }));
  }, [activities]);

  const pieData = categoryData.filter((c) => c.value > 0);

  const trendData = useMemo(() => {
    const daily = {};
    activities.forEach((a) => { daily[a.logDate] = (daily[a.logDate] || 0) + Number(a.co2eKg); });
    return Object.entries(daily)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, co2]) => ({ date: date.slice(5), co2: +co2.toFixed(2) }));
  }, [activities]);

  const topCategory = activities.length
    ? categoryData.reduce((a, b) => (a.value >= b.value ? a : b)).name
    : '—';

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <h2>Your Sustainability Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total CO₂e (30d)</div>
          <div className="stat-value">{totalCo2} kg</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Activities Logged</div>
          <div className="stat-value">{activities.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Top Category</div>
          <div className="stat-value">{topCategory}</div>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
          No activity in the last 30 days. Head to <strong>Log Activity</strong> to add your first entry.
        </div>
      ) : (
        <div className="charts-grid">
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Emissions by Category</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                     label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((d) => (
                    <Cell key={d.name} fill={COLORS[categoryData.findIndex((c) => c.name === d.name) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Daily Trend (30 days)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="co2" stroke="#2e7d32" strokeWidth={2} dot={trendData.length < 3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
