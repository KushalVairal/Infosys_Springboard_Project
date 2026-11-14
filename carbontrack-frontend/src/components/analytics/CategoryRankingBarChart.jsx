import React, { useState, useMemo } from 'react';
import {
  Car,
  Zap,
  Utensils,
  ShoppingBag,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ArrowDownUp
} from 'lucide-react';
import './CategoryRankingBarChart.css';

const CATEGORY_META = {
  TRANSPORT: {
    name: 'Transport',
    icon: Car,
    lightColor: '#E06D53',
    darkColor: '#F08069',
    gradient: 'linear-gradient(90deg, #E06D53 0%, #F59E0B 100%)',
    description: 'Vehicle travel, public transit, and flights'
  },
  ELECTRICITY: {
    name: 'Electricity',
    icon: Zap,
    lightColor: '#D9822B',
    darkColor: '#F59E0B',
    gradient: 'linear-gradient(90deg, #D9822B 0%, #FBBF24 100%)',
    description: 'Home appliances, lighting, and grid power'
  },
  FOOD: {
    name: 'Food',
    icon: Utensils,
    lightColor: '#244B35',
    darkColor: '#3DA868',
    gradient: 'linear-gradient(90deg, #244B35 0%, #668F63 100%)',
    description: 'Meals, plant-based or meat diet choices'
  },
  SHOPPING: {
    name: 'Shopping',
    icon: ShoppingBag,
    lightColor: '#2A9D8F',
    darkColor: '#38B2AC',
    gradient: 'linear-gradient(90deg, #2A9D8F 0%, #6EE7B7 100%)',
    description: 'Consumer goods, clothing, and packaged items'
  }
};

/**
 * CategoryRankingBarChart (Analytics 12 Implementation)
 * Sortable horizontal bar ranking for CarbonTrack's 4 verified sectors.
 */
export default function CategoryRankingBarChart({
  categoryTotals = {},
  unitLabel = 'kg CO₂e',
  isTonnes = false,
  isDark = false
}) {
  const [sortOrder, setSortOrder] = useState('DESC'); // 'DESC' | 'ASC' | 'ALPHA'
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Normalise 4 verified categories
  const categoriesList = useMemo(() => {
    const keys = ['TRANSPORT', 'ELECTRICITY', 'FOOD', 'SHOPPING'];
    let maxVal = 0.001;
    let sumTotal = 0;

    const data = keys.map((key) => {
      const rawVal = Number(categoryTotals[key] || 0);
      sumTotal += rawVal;
      if (rawVal > maxVal) maxVal = rawVal;
      return {
        key,
        name: CATEGORY_META[key].name,
        icon: CATEGORY_META[key].icon,
        gradient: CATEGORY_META[key].gradient,
        color: isDark ? CATEGORY_META[key].darkColor : CATEGORY_META[key].lightColor,
        description: CATEGORY_META[key].description,
        rawKg: rawVal,
        emissions: isTonnes ? Number((rawVal / 1000).toFixed(3)) : Number(rawVal.toFixed(2))
      };
    });

    return data
      .map((item) => ({
        ...item,
        percentage: sumTotal > 0 ? ((item.rawKg / sumTotal) * 100).toFixed(1) : '0.0',
        barWidth: maxVal > 0 ? Math.max(Math.round((item.rawKg / maxVal) * 100), item.rawKg > 0 ? 5 : 0) : 0
      }))
      .sort((a, b) => {
        if (sortOrder === 'DESC') return b.rawKg - a.rawKg;
        if (sortOrder === 'ASC') return a.rawKg - b.rawKg;
        return a.name.localeCompare(b.name);
      });
  }, [categoryTotals, sortOrder, isTonnes, isDark]);

  return (
    <div className="analytics-ranking-block">
      <div className="ranking-header">
        <div className="ranking-title-group">
          <h3 className="ranking-title">Verified Sector Emissions Ranking</h3>
          <p className="ranking-subtitle">
            Ranked by actual recorded footprint across the 4 verified sustainability categories
          </p>
        </div>

        {/* Sort Controls */}
        <div className="ranking-sort-controls" role="group" aria-label="Sort category rankings">
          <button
            type="button"
            className={`ranking-sort-btn ${sortOrder === 'DESC' ? 'active' : ''}`}
            onClick={() => setSortOrder('DESC')}
            title="Sort highest emissions first"
          >
            <ArrowDownWideNarrow size={14} />
            <span>Highest</span>
          </button>
          <button
            type="button"
            className={`ranking-sort-btn ${sortOrder === 'ASC' ? 'active' : ''}`}
            onClick={() => setSortOrder('ASC')}
            title="Sort lowest emissions first"
          >
            <ArrowUpNarrowWide size={14} />
            <span>Lowest</span>
          </button>
          <button
            type="button"
            className={`ranking-sort-btn ${sortOrder === 'ALPHA' ? 'active' : ''}`}
            onClick={() => setSortOrder('ALPHA')}
            title="Sort alphabetically"
          >
            <ArrowDownUp size={14} />
            <span>A-Z</span>
          </button>
        </div>
      </div>

      <div className="ranking-bars-list">
        {categoriesList.map((item, index) => {
          const IconComponent = item.icon;
          const isTooltipActive = activeTooltip === item.key;

          return (
            <div
              key={item.key}
              className="ranking-bar-item"
              onMouseEnter={() => setActiveTooltip(item.key)}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              <div className="ranking-meta-left">
                <span className="ranking-position-num">#{index + 1}</span>
                <span className="ranking-icon-wrap" style={{ color: item.color }}>
                  <IconComponent size={18} />
                </span>
                <div className="ranking-label-wrap">
                  <span className="ranking-cat-name">{item.name}</span>
                  <span className="ranking-cat-share">{item.percentage}% share</span>
                </div>
              </div>

              <div className="ranking-bar-track-wrap">
                <div className="ranking-bar-track">
                  <div
                    className="ranking-bar-fill"
                    style={{
                      width: `${item.barWidth}%`,
                      background: item.gradient
                    }}
                  />
                </div>
              </div>

              <div className="ranking-val-right">
                <strong className="ranking-emissions-val">
                  {item.emissions}
                </strong>
                <span className="ranking-emissions-unit">{unitLabel}</span>
              </div>

              {/* Tooltip */}
              {isTooltipActive && (
                <div className="ranking-hover-tooltip" role="tooltip">
                  <div className="tooltip-title">
                    <IconComponent size={14} />
                    <strong>{item.name}</strong>
                  </div>
                  <p className="tooltip-desc">{item.description}</p>
                  <div className="tooltip-stat">
                    <span>Emissions:</span>
                    <strong>{item.emissions} {unitLabel} ({item.percentage}%)</strong>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
