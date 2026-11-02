import React, { useState, useMemo } from 'react';
import api from '../api/client';
import { CategoryBadge } from './StatusBadge';
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  Car,
  Utensils,
  ShoppingBag,
  Clock,
  Sparkles,
  Plus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const FREQUENT_ACTIVITIES = [
  {
    id: 'quick-car-petrol',
    title: 'Car Commute (Petrol)',
    category: 'TRANSPORT',
    activityType: 'CAR_PETROL',
    quantity: 15,
    unit: 'km',
    factor: 0.18,
    estimatedCo2e: 2.70,
    icon: Car,
    description: '15 km petrol commute'
  },
  {
    id: 'quick-bus',
    title: 'Public Bus Transit',
    category: 'TRANSPORT',
    activityType: 'BUS',
    quantity: 10,
    unit: 'km',
    factor: 0.08,
    estimatedCo2e: 0.80,
    icon: Car,
    description: '10 km city bus ride'
  },
  {
    id: 'quick-train',
    title: 'Metro / Passenger Train',
    category: 'TRANSPORT',
    activityType: 'TRAIN',
    quantity: 20,
    unit: 'km',
    factor: 0.04,
    estimatedCo2e: 0.80,
    icon: Car,
    description: '20 km train transit'
  },
  {
    id: 'quick-car-ev',
    title: 'Electric Vehicle Ride',
    category: 'TRANSPORT',
    activityType: 'CAR_ELECTRIC',
    quantity: 20,
    unit: 'km',
    factor: 0.05,
    estimatedCo2e: 1.00,
    icon: Car,
    description: '20 km zero tailpipe drive'
  },
  {
    id: 'quick-bike',
    title: 'Bicycle / Walk Commute',
    category: 'TRANSPORT',
    activityType: 'BICYCLE',
    quantity: 5,
    unit: 'km',
    factor: 0.00,
    estimatedCo2e: 0.00,
    icon: Car,
    description: '5 km zero emission travel'
  },
  {
    id: 'quick-electricity',
    title: 'Daily Home Power',
    category: 'ELECTRICITY',
    activityType: 'ELECTRICITY',
    quantity: 8,
    unit: 'kWh',
    factor: 0.70,
    estimatedCo2e: 5.60,
    icon: Zap,
    description: '8 kWh average household usage'
  },
  {
    id: 'quick-lpg',
    title: 'Cooking Gas (LPG)',
    category: 'ELECTRICITY',
    activityType: 'LPG',
    quantity: 0.5,
    unit: 'kg',
    factor: 3.00,
    estimatedCo2e: 1.50,
    icon: Zap,
    description: '0.5 kg kitchen cooking fuel'
  },
  {
    id: 'quick-meal-veg',
    title: 'Vegetarian Meal',
    category: 'FOOD',
    activityType: 'FOOD_VEGETARIAN',
    quantity: 1,
    unit: 'serving',
    factor: 0.80,
    estimatedCo2e: 0.80,
    icon: Utensils,
    description: '1 plant-based/veg serving'
  },
  {
    id: 'quick-meal-nonveg',
    title: 'Non-Vegetarian Meal',
    category: 'FOOD',
    activityType: 'FOOD_NON_VEGETARIAN',
    quantity: 1,
    unit: 'serving',
    factor: 2.50,
    estimatedCo2e: 2.50,
    icon: Utensils,
    description: '1 poultry or fish meal'
  },
  {
    id: 'quick-meal-beef',
    title: 'Beef Meal',
    category: 'FOOD',
    activityType: 'FOOD_BEEF',
    quantity: 1,
    unit: 'serving',
    factor: 5.00,
    estimatedCo2e: 5.00,
    icon: Utensils,
    description: '1 high-intensity beef serving'
  },
  {
    id: 'quick-clothing',
    title: 'New Apparel / Clothing',
    category: 'SHOPPING',
    activityType: 'CLOTHING',
    quantity: 1,
    unit: 'item',
    factor: 10.00,
    estimatedCo2e: 10.00,
    icon: ShoppingBag,
    description: '1 manufactured textile item'
  },
  {
    id: 'quick-electronics',
    title: 'Consumer Electronic',
    category: 'SHOPPING',
    activityType: 'ELECTRONICS',
    quantity: 1,
    unit: 'item',
    factor: 50.00,
    estimatedCo2e: 50.00,
    icon: ShoppingBag,
    description: '1 electronic gadget'
  },
  {
    id: 'quick-waste',
    title: 'Household Waste',
    category: 'SHOPPING',
    activityType: 'WASTE',
    quantity: 3,
    unit: 'kg',
    factor: 0.50,
    estimatedCo2e: 1.50,
    icon: ShoppingBag,
    description: '3 kg municipal solid waste'
  }
];

export default function QuickLogCarousel({
  onQuickLogged = null,
  onPrefillForm = null,
  className = ''
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [loggingId, setLoggingId] = useState(null);
  const [successItem, setSuccessItem] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const itemsPerPage = 3;
  const totalPages = Math.ceil(FREQUENT_ACTIVITIES.length / itemsPerPage);

  const visibleItems = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return FREQUENT_ACTIVITIES.slice(start, start + itemsPerPage);
  }, [currentPage, itemsPerPage]);

  const handlePrev = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  const handleQuickLog = async (activity) => {
    setLoggingId(activity.id);
    setErrorMessage('');
    setSuccessItem(null);

    const todayStr = new Date().toISOString().slice(0, 10);

    try {
      const created = await api.activities.create({
        category: activity.category,
        activityType: activity.activityType,
        quantity: activity.quantity,
        unit: activity.unit,
        logDate: todayStr
      });

      setSuccessItem({
        title: activity.title,
        co2eKg: created.co2eKg || activity.estimatedCo2e
      });

      if (onQuickLogged) {
        onQuickLogged(created);
      }

      // Auto dismiss success after 4s
      setTimeout(() => setSuccessItem(null), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to log activity. Please verify connection.');
    } finally {
      setLoggingId(null);
    }
  };

  return (
    <div className={`quick-log-section ${className}`}>
      <div className="quick-log-header">
        <div className="quick-log-header-left">
          <div className="quick-log-icon-bubble">
            <Sparkles size={18} color="var(--forest-primary)" />
          </div>
          <div>
            <h3 className="quick-log-heading">Quick-Log Frequent Activities</h3>
            <p className="quick-log-subheading">
              1-click logging for common daily routines using verified emission factors
            </p>
          </div>
        </div>

        <div className="quick-log-nav-controls">
          <span className="carousel-page-indicator">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            type="button"
            className="carousel-arrow-btn"
            onClick={handlePrev}
            aria-label="Previous frequent activities"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="carousel-arrow-btn"
            onClick={handleNext}
            aria-label="Next frequent activities"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {successItem && (
        <div className="quick-log-notification success">
          <CheckCircle2 size={16} />
          <span>
            Logged <strong>{successItem.title}</strong> (+{successItem.co2eKg} kg CO₂e) to your ledger!
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="quick-log-notification error">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Carousel Track */}
      <div className="quick-log-cards-grid">
        {visibleItems.map((act) => {
          const isBusy = loggingId === act.id;
          const Icon = act.icon;

          return (
            <div key={act.id} className="quick-log-card">
              <div className="card-top-row">
                <CategoryBadge category={act.category} />
                <span className="co2-pill">
                  {act.estimatedCo2e.toFixed(2)} kg CO₂e
                </span>
              </div>

              <div className="card-info-main">
                <div className="card-icon-wrap">
                  <Icon size={20} color="var(--forest-primary)" />
                </div>
                <div>
                  <h4 className="card-activity-title">{act.title}</h4>
                  <span className="card-quantity-label">
                    {act.quantity} {act.unit}
                  </span>
                </div>
              </div>

              <div className="card-action-row">
                {onPrefillForm && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => onPrefillForm(act)}
                    title="Customize quantity or date in form"
                  >
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary btn-sm btn-quick-submit"
                  onClick={() => handleQuickLog(act)}
                  disabled={isBusy}
                >
                  {isBusy ? (
                    <span className="btn-spinner-sm" />
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Quick Log</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

