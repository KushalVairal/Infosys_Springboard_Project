import { useEffect, useMemo, useState } from 'react';
import { createActivity } from '../api/activities';
import Toast from '../components/Toast';
import { CATEGORIES, calcCo2 } from '../data/categories';
import '../styles/auth.css';

const today = () => new Date().toISOString().slice(0, 10);

export default function LogActivity() {
  const [category, setCategory] = useState('TRANSPORT');
  const [activityType, setActivityType] = useState('CAR_PETROL');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('km');
  const [logDate, setLogDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const conf = CATEGORIES[category];
    setActivityType(conf.types[0].value);
    setUnit(conf.units[0]);
  }, [category]);

  const co2Preview = useMemo(
    () => calcCo2(category, activityType, quantity, unit).toFixed(3),
    [category, activityType, quantity, unit]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createActivity({
        category,
        activityType,
        quantity: parseFloat(quantity),
        unit,
        logDate,
        notes: notes || null,
      });
      setToast({ message: 'Activity logged successfully!', type: 'success' });
      setQuantity('');
      setNotes('');
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to log activity', type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <h2>Log an Activity</h2>

      <div className="tabs">
        {Object.keys(CATEGORIES).map((c) => (
          <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)} type="button">
            {c.charAt(0) + c.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <form className="activity-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Activity Type</label>
          <select value={activityType} onChange={(e) => setActivityType(e.target.value)}>
            {CATEGORIES[category].types.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Quantity</label>
          <input type="number" step="0.01" min="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} required placeholder="e.g. 12.5" />
        </div>

        <div className="form-group">
          <label>Unit</label>
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            {CATEGORIES[category].units.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Date</label>
          <input type="date" value={logDate} max={today()} onChange={(e) => setLogDate(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Notes (optional)</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={255} placeholder="e.g. Office commute" />
        </div>

        <div className="preview-box">
          <span>Estimated emissions</span>
          <span className="preview-value">{co2Preview} kg CO₂e</span>
        </div>

        <button type="submit" disabled={busy || !quantity}>{busy ? 'Saving…' : 'Log Activity'}</button>
      </form>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
