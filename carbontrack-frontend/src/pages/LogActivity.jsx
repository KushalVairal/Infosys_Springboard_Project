import { useEffect, useMemo, useState } from 'react';
import { createActivity, updateActivity } from '../api/activities';
import { useLocation, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { CATEGORIES, UNIT_MULTIPLIER } from '../data/categories';
import { useEmissionFactors } from '../hooks/useEmissionFactors';
import '../styles/auth.css';

const today = () => new Date().toISOString().slice(0, 10);

export default function LogActivity() {
  const { factorsMap, loading: factorsLoading, error: factorsError } = useEmissionFactors();
  const location = useLocation();
  const navigate = useNavigate();
  const editingActivity = location.state?.activity || null;

  const [category, setCategory] = useState(editingActivity?.category || 'TRANSPORT');
  const [activityType, setActivityType] = useState(editingActivity?.activityType || 'CAR_PETROL');
  const [quantity, setQuantity] = useState(editingActivity?.quantity?.toString() || '');
  const [unit, setUnit] = useState(editingActivity?.unit || 'km');
  const [logDate, setLogDate] = useState(editingActivity?.logDate || today());
  const [notes, setNotes] = useState(editingActivity?.notes || '');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  // When category changes, reset type and unit (but keep them when editing)
  useEffect(() => {
    if (!editingActivity) {
      const conf = CATEGORIES[category];
      setActivityType(conf.types[0].value);
      setUnit(conf.units[0]);
    }
  }, [category, editingActivity]);

  const co2Preview = useMemo(() => {
    if (factorsLoading) return '...';
    if (factorsError) return 'Error';
    const factorObj = factorsMap[activityType];
    const factor = factorObj ? factorObj.factor : null;
    const q = parseFloat(quantity);
    if (!factor || !q || q <= 0) return 0;
    const multiplier = unit ? (UNIT_MULTIPLIER[unit] ?? 1) : 1;
    return (factor * q * multiplier).toFixed(6);
  }, [activityType, quantity, unit, factorsMap, factorsLoading, factorsError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        category,
        activityType,
        quantity: parseFloat(quantity),
        unit,
        logDate,
        notes: notes || null,
      };
      if (editingActivity) {
        await updateActivity(editingActivity.id, payload);
        setToast({ message: 'Activity updated successfully!', type: 'success' });
      } else {
        await createActivity(payload);
        setToast({ message: 'Activity logged successfully!', type: 'success' });
      }
      // After success, go back to Goals page and request refresh
      navigate('/goals', { state: { refresh: Date.now() } });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to save activity', type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <h2>{editingActivity ? 'Edit Activity' : 'Log an Activity'}</h2>

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

        <button type="submit" disabled={busy || !quantity}>
          {busy ? (editingActivity ? 'Updating…' : 'Saving…') : (editingActivity ? 'Update Activity' : 'Log Activity')}
        </button>
      </form>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
