import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/client';
import { CategoryBadge, EmissionBadge } from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import {
  Plus,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  Info,
  Car,
  Zap,
  Utensils,
  ShoppingBag,
  ArrowUpDown
} from 'lucide-react';

// Exact activity factor data from backend V10 Flyway migration
const ACTIVITY_CATALOG = {
  TRANSPORT: {
    label: 'Transport',
    icon: <Car size={18} />,
    unit: 'km',
    types: [
      { id: 'CAR_PETROL', label: 'Car (Petrol)', unit: 'km', factor: 0.18 },
      { id: 'CAR_DIESEL', label: 'Car (Diesel)', unit: 'km', factor: 0.20 },
      { id: 'CAR_ELECTRIC', label: 'Car (Electric)', unit: 'km', factor: 0.05 },
      { id: 'MOTORCYCLE_PETROL', label: 'Motorcycle (Petrol)', unit: 'km', factor: 0.05 },
      { id: 'BUS', label: 'Public Bus', unit: 'km', factor: 0.08 },
      { id: 'TRAIN', label: 'Passenger Train', unit: 'km', factor: 0.04 },
      { id: 'FLIGHT', label: 'Flight', unit: 'km', factor: 0.15 },
      { id: 'BICYCLE', label: 'Bicycle (Zero Direct)', unit: 'km', factor: 0.00 },
      { id: 'WALKING', label: 'Walking (Zero Direct)', unit: 'km', factor: 0.00 }
    ]
  },
  ELECTRICITY: {
    label: 'Electricity & Heating',
    icon: <Zap size={18} />,
    unit: 'kWh',
    types: [
      { id: 'ELECTRICITY', label: 'Grid Electricity', unit: 'kWh', factor: 0.70 },
      { id: 'LPG', label: 'LPG Cooking Gas', unit: 'kg', factor: 3.00 }
    ]
  },
  FOOD: {
    label: 'Diet & Food',
    icon: <Utensils size={18} />,
    unit: 'serving',
    types: [
      { id: 'FOOD_VEGETARIAN', label: 'Vegetarian Meal', unit: 'serving', factor: 0.80 },
      { id: 'FOOD_NON_VEGETARIAN', label: 'Non-Vegetarian Meal (Poultry/Fish)', unit: 'serving', factor: 2.50 },
      { id: 'FOOD_BEEF', label: 'Beef Meal', unit: 'serving', factor: 5.00 }
    ]
  },
  SHOPPING: {
    label: 'Shopping & Waste',
    icon: <ShoppingBag size={18} />,
    unit: 'item',
    types: [
      { id: 'CLOTHING', label: 'Clothing Item', unit: 'item', factor: 10.00 },
      { id: 'ELECTRONICS', label: 'Electronic Device', unit: 'item', factor: 50.00 },
      { id: 'WASTE', label: 'Household Waste', unit: 'kg', factor: 0.50 }
    ]
  }
};

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formCategory, setFormCategory] = useState('TRANSPORT');
  const [formActivityType, setFormActivityType] = useState('CAR_PETROL');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('km');
  const [formDate, setFormDate] = useState(getTodayString());
  const [formError, setFormError] = useState('');
  const [lastCreated, setLastCreated] = useState(null);

  // Filters & sorting
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await api.activities.getMyActivities();
      setActivities(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // When category changes in form, reset activity type and unit
  const handleCategoryChange = (catKey) => {
    setFormCategory(catKey);
    const firstType = ACTIVITY_CATALOG[catKey]?.types[0];
    if (firstType) {
      setFormActivityType(firstType.id);
      setFormUnit(firstType.unit);
    }
  };

  const handleTypeChange = (typeId) => {
    setFormActivityType(typeId);
    const cat = ACTIVITY_CATALOG[formCategory];
    const match = cat?.types.find((t) => t.id === typeId);
    if (match) {
      setFormUnit(match.unit);
    }
  };

  // Preview estimate calculation
  const currentFactorInfo = useMemo(() => {
    const cat = ACTIVITY_CATALOG[formCategory];
    const match = cat?.types.find((t) => t.id === formActivityType);
    return match || null;
  }, [formCategory, formActivityType]);

  const previewEstimate = useMemo(() => {
    const q = parseFloat(formQuantity);
    if (isNaN(q) || q <= 0 || !currentFactorInfo) return null;
    return (q * currentFactorInfo.factor).toFixed(3);
  }, [formQuantity, currentFactorInfo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const q = parseFloat(formQuantity);
    if (isNaN(q) || q <= 0) {
      setFormError('Quantity must be a positive number greater than 0.');
      return;
    }

    if (!formDate) {
      setFormError('Activity date is required.');
      return;
    }

    const today = getTodayString();
    if (formDate > today) {
      setFormError('Activity date cannot be in the future.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.activities.create({
        category: formCategory,
        activityType: formActivityType,
        quantity: q,
        unit: formUnit,
        logDate: formDate
      });

      setLastCreated(created);
      setIsModalOpen(false);
      setFormQuantity('');
      // Refresh list
      await fetchActivities();
    } catch (err) {
      setFormError(err.message || 'Failed to record activity. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered and sorted activities
  const filteredActivities = useMemo(() => {
    return activities
      .filter((act) => {
        if (filterCategory !== 'ALL' && act.category !== filterCategory) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchType = (act.activityType || '').toLowerCase().includes(q);
          const matchCat = (act.category || '').toLowerCase().includes(q);
          if (!matchType && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.logDate) - new Date(a.logDate);
        if (sortBy === 'date-asc') return new Date(a.logDate) - new Date(b.logDate);
        if (sortBy === 'emissions-desc') return (Number(b.co2eKg) || 0) - (Number(a.co2eKg) || 0);
        if (sortBy === 'emissions-asc') return (Number(a.co2eKg) || 0) - (Number(b.co2eKg) || 0);
        return 0;
      });
  }, [activities, filterCategory, searchQuery, sortBy]);

  const totalFilteredEmissions = useMemo(() => {
    return filteredActivities.reduce((acc, curr) => acc + (Number(curr.co2eKg) || 0), 0);
  }, [filteredActivities]);

  return (
    <div className="activities-page">
      {/* Page Header */}
      <div className="activities-header-row">
        <div>
          <h1 className="page-heading">Activity Tracking & Ledger</h1>
          <p className="page-subheading">
            Record everyday activities to calculate emissions using verified factors.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setFormError('');
            setLastCreated(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={18} />
          <span>Record Activity</span>
        </button>
      </div>

      {/* Success Notification after creation */}
      {lastCreated && (
        <div className="activity-success-banner">
          <div className="success-banner-content">
            <CheckCircle2 size={20} color="#244B35" />
            <div>
              <strong>Activity recorded successfully!</strong>
              <p>
                {lastCreated.activityType} ({lastCreated.quantity} {lastCreated.unit}) produced{' '}
                <span className="success-emission-number">{lastCreated.co2eKg} kg CO₂e</span> on {lastCreated.logDate}.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="banner-dismiss-btn"
            onClick={() => setLastCreated(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="dashboard-alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="activity-controls-card">
        <div className="category-filter-pills">
          <button
            type="button"
            className={`filter-pill ${filterCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterCategory('ALL')}
          >
            All Sectors ({activities.length})
          </button>
          {Object.entries(ACTIVITY_CATALOG).map(([key, cat]) => (
            <button
              key={key}
              type="button"
              className={`filter-pill ${filterCategory === key ? 'active' : ''}`}
              onClick={() => setFilterCategory(key)}
            >
              <span className="pill-icon">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="filter-search-group">
          <div className="search-input-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by type (e.g. car, electricity, bus)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="sort-select-box">
            <ArrowUpDown size={16} className="sort-icon" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort activity logs"
            >
              <option value="date-desc">Newest Date First</option>
              <option value="date-asc">Oldest Date First</option>
              <option value="emissions-desc">Highest Emissions First</option>
              <option value="emissions-asc">Lowest Emissions First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activities Ledger Table */}
      <div className="dashboard-card activities-ledger-card">
        <div className="ledger-header">
          <div className="ledger-summary-left">
            <span className="ledger-count">
              Showing <strong>{filteredActivities.length}</strong> of {activities.length} activities
            </span>
          </div>
          <div className="ledger-summary-right">
            <span className="total-filter-emissions">
              Total in view: <strong>{totalFilteredEmissions.toFixed(2)} kg CO₂e</strong>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="table-loading-container">
            <LoadingSpinner message="Fetching activity records from database..." />
          </div>
        ) : filteredActivities.length > 0 ? (
          <div className="table-responsive">
            <table className="activities-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Activity Type</th>
                  <th>Quantity & Unit</th>
                  <th>Calculated Emissions</th>
                  <th>Activity Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((act) => (
                  <tr key={act.id}>
                    <td>
                      <CategoryBadge category={act.category} />
                    </td>
                    <td className="font-semibold text-forest">{act.activityType}</td>
                    <td>
                      <span className="quantity-number">{act.quantity}</span>{' '}
                      <span className="unit-pill">{act.unit}</span>
                    </td>
                    <td>
                      <EmissionBadge value={act.co2eKg} unit="kg" />
                    </td>
                    <td className="date-cell">
                      <span className="date-text">{act.logDate}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={activities.length === 0 ? 'No activities recorded yet' : 'No matching activities'}
            description={
              activities.length === 0
                ? 'Your footprint ledger is ready. Log your daily commute, power consumption, or meals to see accurate calculations.'
                : 'Try adjusting your category filter or search keywords to view other logged entries.'
            }
            actionText={activities.length === 0 ? 'Record First Activity' : 'Clear Filters'}
            onAction={
              activities.length === 0
                ? () => setIsModalOpen(true)
                : () => {
                    setFilterCategory('ALL');
                    setSearchQuery('');
                  }
            }
          />
        )}
      </div>

      {/* Record Activity Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon-bubble">
                  <Plus size={20} color="#244B35" />
                </span>
                <div>
                  <h2 className="modal-title">Record Activity</h2>
                  <p className="modal-subtitle">Emissions are computed with server-side database factors</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="auth-alert alert-error" role="alert">
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="modal-form">
              {/* Category Selection Tabs */}
              <div className="form-group">
                <label className="form-label">Sector Category</label>
                <div className="category-selector-grid">
                  {Object.entries(ACTIVITY_CATALOG).map(([key, cat]) => (
                    <button
                      key={key}
                      type="button"
                      className={`cat-select-btn ${formCategory === key ? 'selected' : ''}`}
                      onClick={() => handleCategoryChange(key)}
                      disabled={isSubmitting}
                    >
                      <span className="cat-btn-icon">{cat.icon}</span>
                      <span className="cat-btn-text">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Type Selector */}
              <div className="form-group">
                <label htmlFor="activity-type-select" className="form-label">
                  Activity Type
                </label>
                <select
                  id="activity-type-select"
                  className="form-select"
                  value={formActivityType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  disabled={isSubmitting}
                  required
                >
                  {ACTIVITY_CATALOG[formCategory]?.types.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label} ({type.unit}) — Factor: {type.factor} kg CO₂e/{type.unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity and Unit */}
              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="activity-quantity" className="form-label">
                    Quantity
                  </label>
                  <input
                    id="activity-quantity"
                    type="number"
                    step="any"
                    min="0.001"
                    placeholder="e.g. 15.5"
                    className="form-input"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="activity-unit" className="form-label">
                    Unit
                  </label>
                  <input
                    id="activity-unit"
                    type="text"
                    className="form-input read-only-input"
                    value={formUnit}
                    readOnly
                    title="Unit automatically synced with selected activity factor"
                  />
                </div>
              </div>

              {/* Activity Date */}
              <div className="form-group">
                <label htmlFor="activity-date" className="form-label">
                  Activity Date
                </label>
                <input
                  id="activity-date"
                  type="date"
                  max={getTodayString()}
                  className="form-input"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <span className="field-hint">Backend rule: Date cannot be in the future.</span>
              </div>

              {/* Real-Time Preview Card */}
              {previewEstimate !== null && (
                <div className="estimate-preview-card">
                  <div className="preview-calc-text">
                    <span>Formula: </span>
                    <code>
                      {formQuantity} {formUnit} × {currentFactorInfo?.factor} kg CO₂e/{formUnit}
                    </code>
                  </div>
                  <div className="preview-result">
                    <span className="calc-label">Calculated Footprint:</span>
                    <span className="calc-value">{previewEstimate} kg CO₂e</span>
                  </div>
                </div>
              )}

              <div className="test-data-disclaimer">
                <Info size={14} color="#668F63" />
                <span>
                  Using development test factors from Spring Boot database migration <code>V10</code>.
                </span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" message="" />
                  ) : (
                    <span>Save to Activity Ledger</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
