import React, { useState } from 'react';
import { Car, Zap, Utensils, ShoppingBag, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { CATEGORIES as DATA_CATEGORIES } from '../../data/categories';

const SUPPORTED_CATEGORIES = [
  {
    id: 'transport',
    key: 'TRANSPORT',
    name: 'Transport',
    icon: Car,
    color: '#246B43',
    tagline: 'Vehicle Commutes, Public Transit & Aviation',
    factorValue: '0.192 kg CO₂e / km (Petrol Car) · 0.105 kg / km (Bus)',
    summary:
      'Transport accounts for the single largest share of personal emissions for daily commuters. CarbonTrack differentiates between solo petrol/diesel driving, public buses, regional trains, and short or long-haul flights.',
    exampleActivities: [
      { name: 'Petrol Car Commute (25 km)', impact: '4.80 kg CO₂e' },
      { name: 'Public Transit / Bus (25 km)', impact: '2.63 kg CO₂e' },
      { name: 'Train Travel (50 km)', impact: '1.75 kg CO₂e' }
    ],
    verifiedFormula:
      'Emissions (kg CO₂e) = Distance (km) × Factor (e.g. 0.192 kg/km for Petrol Car)',
    actionTip: 'Replacing just 1 car commute per week with public transit saves ~175 kg CO₂e annually.'
  },
  {
    id: 'electricity',
    key: 'ELECTRICITY',
    name: 'Electricity / Energy',
    icon: Zap,
    color: '#D9822B',
    tagline: 'Household kWh & Grid Carbon Intensity',
    factorValue: '0.708 kg CO₂e / kWh (Grid Power) · 0.041 kg / kWh (Solar)',
    summary:
      'Household power emissions depend directly on utility grid fuel mixes versus clean renewable generation. CarbonTrack calculates emissions for metered grid power consumption and clean rooftop solar.',
    exampleActivities: [
      { name: 'Air Conditioning 8 hrs (12 kWh)', impact: '8.50 kg CO₂e' },
      { name: 'LED Lighting 10 hrs (0.5 kWh)', impact: '0.35 kg CO₂e' },
      { name: 'Solar Powered Generation (12 kWh)', impact: '0.49 kg CO₂e' }
    ],
    verifiedFormula:
      'Emissions (kg CO₂e) = Metered Energy (kWh) × Factor (0.708 kg/kWh Grid vs. 0.041 kg/kWh Solar)',
    actionTip: 'Raising your air conditioner temperature by 2°C cuts refrigeration energy by up to 15%.'
  },
  {
    id: 'food',
    key: 'FOOD',
    name: 'Food & Nutrition',
    icon: Utensils,
    color: '#5C946E',
    tagline: 'Nutritional Lifecycle Differentials',
    factorValue: '7.20 kg CO₂e (Beef) · 2.50 kg (Chicken) · 0.50 kg (Vegan)',
    summary:
      'Agricultural supply chains and livestock produce significant greenhouse gas footprints. CarbonTrack accounts for the distinct carbon intensity across vegan, vegetarian, poultry, and beef meals.',
    exampleActivities: [
      { name: 'Beef Meal Serving', impact: '7.20 kg CO₂e' },
      { name: 'Chicken Meal Serving', impact: '2.50 kg CO₂e' },
      { name: 'Plant-Based Vegan Meal', impact: '0.50 kg CO₂e' }
    ],
    verifiedFormula:
      'Emissions (kg CO₂e) = Serving Count × Meal Factor (0.50 to 7.20 kg CO₂e / serving)',
    actionTip: 'Adopting plant-based meals two days a week saves up to 450 kg CO₂e per individual annually.'
  },
  {
    id: 'shopping',
    key: 'SHOPPING',
    name: 'Shopping & Consumer Goods',
    icon: ShoppingBag,
    color: '#1A7A82',
    tagline: 'Embodied Supply Chain Carbon',
    factorValue: '0.005 kg CO₂e / INR (Clothing) · 0.020 kg / INR (Electronics)',
    summary:
      'Manufactured consumer products carry embedded supply chain emissions from raw material extraction, fabrication, and freight. CarbonTrack quantifies clothing, electronics, and grocery spend.',
    exampleActivities: [
      { name: 'Clothing Purchase (₹3,000)', impact: '15.00 kg CO₂e' },
      { name: 'Consumer Electronics (₹25,000)', impact: '500.00 kg CO₂e' },
      { name: 'Household Groceries (₹4,000)', impact: '8.00 kg CO₂e' }
    ],
    verifiedFormula:
      'Emissions (kg CO₂e) = Purchase Spend (INR) × Product Category Carbon Factor',
    actionTip: 'Choosing durable, repairable items directly prevents recurring manufacturing emissions.'
  }
];

export default function CategoryExplorer() {
  const [selectedId, setSelectedId] = useState('transport');
  const activeCat = SUPPORTED_CATEGORIES.find((c) => c.id === selectedId) || SUPPORTED_CATEGORIES[0];
  const Icon = activeCat.icon;

  return (
    <section className="landing-categories-section" id="categories">
      <div className="landing-container">
        {/* Section Header */}
        <div className="section-header-centered">
          <span className="section-eyebrow">Comprehensive Coverage</span>
          <h2 className="section-title">Interactive Carbon Footprint Explorer</h2>
          <p className="section-description">
            Inspect how CarbonTrack quantifies daily emissions across the 4 primary supported lifestyle domains.
          </p>
        </div>

        {/* Category Selection Tabs - Horizontally scrollable on mobile */}
        <div className="category-tabs-scroll-wrapper">
          <div className="category-pill-row" role="tablist">
            {SUPPORTED_CATEGORIES.map((cat) => {
              const TabIcon = cat.icon;
              const isSelected = cat.id === selectedId;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`category-pill-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedId(cat.id)}
                >
                  <TabIcon size={16} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Category Calculation Breakdown Card */}
        <div className="category-display-card">
          <div className="category-display-grid">
            {/* Left Detail Column */}
            <div className="cat-detail-col">
              <div className="cat-eyebrow-row">
                <span className="cat-dot" style={{ backgroundColor: activeCat.color }} />
                <span className="cat-tagline">{activeCat.tagline}</span>
              </div>

              <h3 className="cat-main-title">{activeCat.name} Accounting</h3>
              <p className="cat-summary-text">{activeCat.summary}</p>

              {/* Standardized Scientific Factor Card */}
              <div className="cat-factor-box">
                <div className="factor-box-header">
                  <ShieldCheck size={14} className="factor-icon" />
                  <span>Standardized Scientific Factor</span>
                </div>
                <div className="factor-box-value">
                  <code>{activeCat.factorValue}</code>
                </div>
                <p className="factor-box-formula">
                  Calculation Model: {activeCat.verifiedFormula}
                </p>
              </div>
            </div>

            {/* Right Activity Calculations Column */}
            <div className="cat-activities-col">
              <h4 className="activities-heading">Representative Activity Calculations</h4>
              <p className="activities-subheading">
                Real-time output computed by CarbonTrack’s emission calculation engine:
              </p>

              <div className="activities-list">
                {activeCat.exampleActivities.map((act, i) => (
                  <div key={i} className="activity-calc-row">
                    <span className="activity-name">{act.name}</span>
                    <strong className="activity-impact">{act.impact}</strong>
                  </div>
                ))}
              </div>

              {/* High-Leverage Eco Tip */}
              <div className="cat-action-tip-box">
                <CheckCircle2 size={16} className="tip-icon" />
                <p className="tip-text">{activeCat.actionTip}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
