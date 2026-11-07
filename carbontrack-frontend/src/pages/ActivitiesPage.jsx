import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api/client';
import { CategoryBadge, EmissionBadge } from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import QuickLogCarousel from '../components/QuickLogCarousel';
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
  ArrowUpDown,
  Calendar,
  Sparkles,
  ChevronDown,
  Layers
} from 'lucide-react';

// Exact activity factors matching backend Flyway migrations V10 & V14
export const ACTIVITY_CATALOG = {
  TRANSPORT: {
    label: 'Transport',
    icon: Car,
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
    label: 'Electricity',
    icon: Zap,
    unit: 'kWh',
    types: [
      { id: 'ELECTRICITY', label: 'Grid Electricity', unit: 'kWh', factor: 0.70 },
      { id: 'LPG', label: 'LPG Cooking Gas', unit: 'kg', factor: 3.00 }
    ]
  },
  FOOD: {
    label: 'Food',
    icon: Utensils,
    unit: 'serving',
    types: [
      { id: 'FOOD_VEGETARIAN', label: 'Vegetarian Meal', unit: 'serving', factor: 0.80 },
      { id: 'FOOD_NON_VEGETARIAN', label: 'Non-Vegetarian Meal (Poultry/Fish)', unit: 'serving', factor: 2.50 },
      { id: 'FOOD_BEEF', label: 'Beef Meal', unit: 'serving', factor: 5.00 }
    ]
  },
  SHOPPING: {
    label: 'Shopping',
    icon: ShoppingBag,
    unit: 'item',
    types: [
      { id: 'CLOTHING', label: 'Clothing Item', unit: 'item', factor: 10.00 },
      { id: 'ELECTRONICS', label: 'Electronic Device', unit: 'item', factor: 50.00 },
      { id: 'GROCERIES', label: 'Groceries (Spend INR)', unit: 'inr', factor: 0.002 },
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

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formCategory, setFormCategory] = useState('TRANSPORT');
  const [formActivityType, setFormActivityType] = useState('CAR_PETROL');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('km');
  const [formDate, setFormDate] = useState(getTodayString());
  const [formError, setFormError] = useState('');
  const [lastCreated, setLastCreated] = useState(null);

  // Modal State (for secondary modal trigger)
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters & sorting
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  // Load activities from backend API
  const fetchActivities = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // When category tab changes, automatically select the first valid activity type and unit
  const handleCategoryChange = (catKey) => {
    setFormCategory(catKey);
    const firstType = ACTIVITY_CATALOG[catKey]?.types[0];
    if (firstType) {
      setFormActivityType(firstType.id);
      setFormUnit(firstType.unit);
    }
    setFormError('');
  };

  // When activity type dropdown changes, automatically sync the correct unit
  const handleTypeChange = (typeId) => {
    setFormActivityType(typeId);
    const cat = ACTIVITY_CATALOG[formCategory];
    const match = cat?.types.find((t) => t.id === typeId);
    if (match) {
      setFormUnit(match.unit);
    }
    setFormError('');
  };

  // Real-time emission factor lookup
  const currentFactorInfo = useMemo(() => {
    const cat = ACTIVITY_CATALOG[formCategory];
    const match = cat?.types.find((t) => t.id === formActivityType);
    return match || null;
  }, [formCategory, formActivityType]);

  // Real-time preview calculation: quantity * emissionFactor
  const previewEstimate = useMemo(() => {
    const q = parseFloat(formQuantity);
    if (isNaN(q) || q <= 0 || !currentFactorInfo) return null;
    return (q * currentFactorInfo.factor).toFixed(3);
  }, [formQuantity, currentFactorInfo]);

  // Prefill form from quick-log carousel
  const handlePrefillFromCarousel = (activity) => {
    setFormCategory(activity.category);
    setFormActivityType(activity.activityType);
    setFormQuantity(String(activity.quantity));
    setFormUnit(activity.unit);
    setFormDate(getTodayString());
    setFormError('');

    // Scroll to form smoothly
    const formEl = document.getElementById('activity-logging-form-card');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Activity submit handler
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
      setFormError('Activity date cannot be in the future (backend validation requirement).');
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
      setFormQuantity('');
      setIsModalOpen(false);

      // Instantly insert into local state and refresh from backend
      setActivities((prev) => [created, ...prev.filter((a) => a.id !== created.id)]);
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
            Log your daily travel, power, diet, and shopping to compute verified CO₂e emissions.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setFormError('');
            setIsModalOpen(true);
          }}
        >
          <Plus size={18} />
          <span>Record Activity Modal</span>
        </button>
      </div>

      {/* Global Success Notification */}
      {lastCreated && (
        <div className="activity-success-banner">
          <div className="success-banner-content">
            <CheckCircle2 size={20} color="var(--forest-primary)" />
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
            aria-label="Dismiss banner"
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

      {/* Feature 12: Quick-Log Carousel for frequently logged activities */}
      <QuickLogCarousel
        onQuickLogged={(newAct) => {
          setLastCreated(newAct);
          setActivities((prev) => [newAct, ...prev.filter((a) => a.id !== newAct.id)]);
          fetchActivities();
        }}
        onPrefillForm={handlePrefillFromCarousel}
        className="mb-6"
      />

      {/* Tasks 3.1: Inline Activity Logging Interface Card */}
      <div id="activity-logging-form-card" className="dashboard-card activity-logging-card">
        <div className="card-header-clean">
          <div>
            <h2 className="card-heading">Log an Activity</h2>
            <p className="card-subheading">
              Select category, activity type, quantity, and date. Real-time preview is computed instantly.
            </p>
          </div>
          <span className="live-preview-pill">
            <Sparkles size={14} color="var(--forest-primary)" />
            <span>Real-Time Estimation</span>
          </span>
        </div>

        {formError && (
          <div className="auth-alert alert-error mb-4" role="alert">
            <AlertCircle size={18} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="activity-main-form">
          {/* Requirement 2: Four Category Tabs */}
          <div className="category-tabs-container">
            <label className="form-label-bold">1. Select Sector Category</label>
            <div className="category-tabs-row" role="tablist">
              {Object.entries(ACTIVITY_CATALOG).map(([key, cat]) => {
                const Icon = cat.icon;
                const isSelected = formCategory === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    className={`cat-tab-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(key)}
                    disabled={isSubmitting}
                  >
                    <Icon size={18} className="cat-tab-icon" />
                    <span className="cat-tab-label">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="form-fields-grid">
            {/* Requirement 3 & 4: Activity Type Dropdown based on Category */}
            <div className="form-group">
              <label htmlFor="main-activity-type" className="form-label">
                2. Activity Type ({ACTIVITY_CATALOG[formCategory]?.label})
              </label>
              <select
                id="main-activity-type"
                className="form-select"
                value={formActivityType}
                onChange={(e) => handleTypeChange(e.target.value)}
                disabled={isSubmitting}
                required
              >
                {ACTIVITY_CATALOG[formCategory]?.types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label} — Factor: {type.factor} kg CO₂e/{type.unit}
                  </option>
                ))}
              </select>
            </div>

            {/* Requirement 5 & 6: Quantity Input and Unit Display */}
            <div className="form-group">
              <label htmlFor="main-activity-quantity" className="form-label">
                3. Quantity ({formUnit})
              </label>
              <div className="quantity-input-wrapper">
                <input
                  id="main-activity-quantity"
                  type="number"
                  step="any"
                  min="0.001"
                  placeholder={`e.g. ${formUnit === 'serving' ? '1' : formUnit === 'kWh' ? '10' : '15'}`}
                  className="form-input"
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <span className="quantity-unit-badge">{formUnit}</span>
              </div>
            </div>

            {/* Requirement 7: Date Selector */}
            <div className="form-group">
              <label htmlFor="main-activity-date" className="form-label">
                4. Activity Date
              </label>
              <input
                id="main-activity-date"
                type="date"
                max={getTodayString()}
                className="form-input"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <span className="field-hint">Date cannot be in the future.</span>
            </div>
          </div>

          {/* Requirement 9: Real-Time CO₂e Preview Box */}
          {previewEstimate !== null ? (
            <div className="realtime-estimate-box">
              <div className="estimate-formula-col">
                <span className="formula-tag">Verified Calculation Formula</span>
                <span className="formula-expression">
                  <strong>{formQuantity}</strong> {formUnit} × <strong>{currentFactorInfo?.factor}</strong> kg CO₂e/{formUnit}
                </span>
              </div>
              <div className="estimate-result-col">
                <span className="estimate-label">Estimated Footprint:</span>
                <span className="estimate-number">{previewEstimate} kg CO₂e</span>
              </div>
            </div>
          ) : (
            <div className="realtime-estimate-box pending">
              <Info size={16} color="var(--text-muted)" />
              <span>Enter a quantity to see the real-time CO₂e preview calculated using verified factors.</span>
            </div>
          )}

          {/* Form Actions (Requirement 14: Loading & Submission States) */}
          <div className="activity-form-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setFormQuantity('');
                setFormDate(getTodayString());
                setFormError('');
              }}
              disabled={isSubmitting}
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-submit-activity"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" message="" />
                  <span>Saving to Database...</span>
                </>
              ) : (
                <>
                  <Plus size={18} />
                  <span>Record Activity (POST /api/activities)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

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
          {Object.entries(ACTIVITY_CATALOG).map(([key, cat]) => {
            const Icon = cat.icon;
            return (
              <button
                key={key}
                type="button"
                className={`filter-pill ${filterCategory === key ? 'active' : ''}`}
                onClick={() => setFilterCategory(key)}
              >
                <Icon size={14} className="pill-icon" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="filter-search-group">
          <div className="search-input-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by activity name (e.g. car, bus, diet)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
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

      {/* Requirement 15: Activities History Ledger Table */}
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
            <LoadingSpinner message="Fetching activity records from Spring Boot backend..." />
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
                ? 'Your footprint ledger is ready. Log your daily commute, power consumption, or meals using the form above.'
                : 'Try adjusting your category filter or search keywords to view other logged entries.'
            }
            actionText={activities.length === 0 ? 'Log First Activity' : 'Clear Filters'}
            onAction={
              activities.length === 0
                ? () => {
                    const formEl = document.getElementById('activity-logging-form-card');
                    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                  }
                : () => {
                    setFilterCategory('ALL');
                    setSearchQuery('');
                  }
            }
          />
        )}
      </div>

      {/* Modal Dialog Option for Recording Activity */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon-bubble">
                  <Plus size={20} color="var(--forest-primary)" />
                </span>
                <div>
                  <h2 className="modal-title">Record Activity</h2>
                  <p className="modal-subtitle">Server-side database calculation via POST /api/activities</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                aria-label="Close modal"
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
                  {Object.entries(ACTIVITY_CATALOG).map(([key, cat]) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`cat-select-btn ${formCategory === key ? 'selected' : ''}`}
                        onClick={() => handleCategoryChange(key)}
                        disabled={isSubmitting}
                      >
                        <span className="cat-btn-icon"><Icon size={18} /></span>
                        <span className="cat-btn-text">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Activity Type Selector */}
              <div className="form-group">
                <label htmlFor="modal-activity-type" className="form-label">
                  Activity Type
                </label>
                <select
                  id="modal-activity-type"
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
                  <label htmlFor="modal-activity-quantity" className="form-label">
                    Quantity
                  </label>
                  <input
                    id="modal-activity-quantity"
                    type="number"
                    step="any"
                    min="0.001"
                    placeholder="e.g. 15"
                    className="form-input"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="modal-activity-unit" className="form-label">
                    Unit
                  </label>
                  <input
                    id="modal-activity-unit"
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
                <label htmlFor="modal-activity-date" className="form-label">
                  Activity Date
                </label>
                <input
                  id="modal-activity-date"
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
