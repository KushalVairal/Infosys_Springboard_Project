import React, { useMemo, useState, useEffect } from 'react';
import { Calendar, Flame, Activity, Info, RefreshCw } from 'lucide-react';
import './ActivityHeatmap.css';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function ActivityHeatmap({ activities = [], preferredUnit = 'KG_CO2E', onRefresh }) {
  const [metricMode, setMetricMode] = useState('both'); // 'both' | 'co2e' | 'count'
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Close heatmap tooltip on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setHoveredCell(null);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Group real activities by date key: YYYY-MM-DD
  const activitiesByDate = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(activities)) return map;

    activities.forEach((act) => {
      if (!act) return;
      // Handle both logDate (YYYY-MM-DD or ISO string) and createdAt
      const rawDate = act.logDate || act.createdAt;
      if (!rawDate) return;
      const dateStr = String(rawDate).split('T')[0];

      const current = map.get(dateStr) || {
        dateStr,
        count: 0,
        totalCo2e: 0,
        items: []
      };

      current.count += 1;
      current.totalCo2e += Number(act.co2eKg) || 0;
      current.items.push({
        id: act.id,
        category: act.category,
        activityType: act.activityType,
        quantity: act.quantity,
        unit: act.unit,
        co2eKg: Number(act.co2eKg) || 0
      });

      map.set(dateStr, current);
    });

    return map;
  }, [activities]);

  // Construct 52 weeks (364 days + remainder to today)
  const { weeks, monthHeaders, maxCo2e, stats } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // End on Saturday of the current week for neat alignment
    const dayOfWeek = today.getDay(); // 0 is Sunday
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - dayOfWeek));

    // 52 weeks = 364 days back
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (52 * 7 - 1));

    const weeksArr = [];
    let currentWeek = [];
    const monthPosMap = [];
    let currentMonth = -1;

    let totalActiveDays = 0;
    let totalYearActivities = 0;
    let totalYearCo2e = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    let peakCo2e = 0;
    let peakCount = 0;

    // Traverse day by day
    const iterDate = new Date(startDate);
    let weekIndex = 0;

    while (iterDate <= endDate) {
      const dateKey = formatDateKey(iterDate);
      const isFuture = iterDate > today;
      const record = activitiesByDate.get(dateKey) || null;

      const count = record ? record.count : 0;
      const co2e = record ? record.totalCo2e : 0;

      if (count > peakCount) peakCount = count;
      if (co2e > peakCo2e) peakCo2e = co2e;

      if (!isFuture) {
        if (count > 0) {
          totalActiveDays++;
          totalYearActivities += count;
          totalYearCo2e += co2e;
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
      }

      // Check month header placement
      const monthOfIter = iterDate.getMonth();
      if (monthOfIter !== currentMonth && iterDate.getDate() <= 7) {
        currentMonth = monthOfIter;
        monthPosMap.push({
          month: MONTH_NAMES[monthOfIter],
          weekIdx: weekIndex
        });
      }

      currentWeek.push({
        date: new Date(iterDate),
        dateKey,
        isFuture,
        count,
        co2e,
        items: record ? record.items : []
      });

      if (currentWeek.length === 7) {
        weeksArr.push(currentWeek);
        currentWeek = [];
        weekIndex++;
      }

      iterDate.setDate(iterDate.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeksArr.push(currentWeek);
    }

    // Calculate current streak working backwards from today
    let checkDate = new Date(today);
    let streakCount = 0;
    while (true) {
      const key = formatDateKey(checkDate);
      const rec = activitiesByDate.get(key);
      if (rec && rec.count > 0) {
        streakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // Allow streak to continue if today has no activities yet, but yesterday did
        if (streakCount === 0 && formatDateKey(today) === key) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yKey = formatDateKey(checkDate);
          const yRec = activitiesByDate.get(yKey);
          if (yRec && yRec.count > 0) {
            streakCount++;
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }
    currentStreak = streakCount;

    return {
      weeks: weeksArr,
      monthHeaders: monthPosMap,
      maxCo2e: peakCo2e || 10,
      maxCount: peakCount || 4,
      stats: {
        totalActiveDays,
        totalYearActivities,
        totalYearCo2e,
        currentStreak,
        longestStreak
      }
    };
  }, [activitiesByDate]);

  // Determine intensity level (0 to 4)
  const getIntensityLevel = (cell) => {
    if (cell.isFuture || cell.count === 0) return 0;

    if (metricMode === 'count') {
      if (cell.count === 1) return 1;
      if (cell.count === 2) return 2;
      if (cell.count === 3) return 3;
      return 4;
    }

    if (metricMode === 'co2e') {
      const ratio = cell.co2e / maxCo2e;
      if (ratio <= 0.15) return 1;
      if (ratio <= 0.4) return 2;
      if (ratio <= 0.75) return 3;
      return 4;
    }

    // Default 'both' (combined balanced activity & carbon intensity)
    if (cell.count === 1 && cell.co2e < 2) return 1;
    if (cell.count <= 2 || cell.co2e < 8) return 2;
    if (cell.count <= 4 || cell.co2e < 20) return 3;
    return 4;
  };

  const handleCellMouseEnter = (e, cell) => {
    if (cell.isFuture) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const rawX = rect.left + rect.width / 2;
    const clampedX = Math.max(130, Math.min(window.innerWidth - 130, rawX));
    setTooltipPos({
      x: clampedX,
      y: rect.top
    });
    setHoveredCell(cell);
  };

  const handleCellClick = (e, cell) => {
    e.stopPropagation();
    if (cell.isFuture) return;
    if (hoveredCell && hoveredCell.dateKey === cell.dateKey) {
      setHoveredCell(null);
    } else {
      handleCellMouseEnter(e, cell);
    }
  };

  const handleCellMouseLeave = () => {
    setHoveredCell(null);
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    if (onRefresh) {
      onRefresh();
    }
    window.dispatchEvent(new CustomEvent('carbontrack:activity-changed'));
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="activity-heatmap-card dashboard-card" id="analytics-9-heatmap">
      {/* Header */}
      <div className="heatmap-header">
        <div className="heatmap-title-wrap">
          <div className="heatmap-badge-pill">
            <Activity size={13} color="var(--forest-primary, #2e7d32)" />
            <span>Analytics 9 · Contribution Heatmap</span>
          </div>
          <h2 className="heatmap-heading">Activity Contribution Heatmap</h2>
          <p className="heatmap-subheading">
            Daily activity frequency and emission patterns across the past 52 weeks (365 days)
          </p>
        </div>

        <div className="heatmap-controls-row">
          {/* Mode Switcher */}
          <div className="heatmap-mode-pills" role="radiogroup" aria-label="Heatmap metric display mode">
            <button
              type="button"
              className={`mode-pill ${metricMode === 'both' ? 'active' : ''}`}
              onClick={() => setMetricMode('both')}
            >
              Balanced
            </button>
            <button
              type="button"
              className={`mode-pill ${metricMode === 'count' ? 'active' : ''}`}
              onClick={() => setMetricMode('count')}
            >
              Log Count
            </button>
            <button
              type="button"
              className={`mode-pill ${metricMode === 'co2e' ? 'active' : ''}`}
              onClick={() => setMetricMode('co2e')}
            >
              CO₂e Footprint
            </button>
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            className={`heatmap-refresh-btn ${isRefreshing ? 'spinning' : ''}`}
            onClick={handleManualRefresh}
            title="Refresh heatmap data from authenticated activity ledger"
            aria-label="Refresh activity heatmap"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="heatmap-stats-strip">
        <div className="heatmap-stat-item">
          <span className="stat-label">Active Days</span>
          <strong className="stat-number">{stats.totalActiveDays}</strong>
          <span className="stat-sub">in past 365 days</span>
        </div>

        <div className="heatmap-stat-item">
          <span className="stat-label">
            <Flame size={13} className="stat-icon-flame" /> Current Streak
          </span>
          <strong className="stat-number">{stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}</strong>
          <span className="stat-sub">Best: {stats.longestStreak} days</span>
        </div>

        <div className="heatmap-stat-item">
          <span className="stat-label">Logged Entries</span>
          <strong className="stat-number">{stats.totalYearActivities}</strong>
          <span className="stat-sub">verified records</span>
        </div>

        <div className="heatmap-stat-item">
          <span className="stat-label">Recorded Footprint</span>
          <strong className="stat-number">
            {preferredUnit === 'TONNES_CO2E'
              ? `${(stats.totalYearCo2e / 1000).toFixed(3)} t`
              : `${stats.totalYearCo2e.toFixed(1)} kg`}
          </strong>
          <span className="stat-sub">CO₂e generated</span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="heatmap-matrix-scroll-wrapper">
        <div className="heatmap-matrix-inner">
          {/* Month labels along top */}
          <div className="heatmap-months-row">
            <div className="heatmap-day-label-spacer" />
            <div className="heatmap-months-track">
              {monthHeaders.map((m, idx) => (
                <span
                  key={`${m.month}-${idx}`}
                  className="heatmap-month-tag"
                  style={{ left: `${m.weekIdx * 15}px` }}
                >
                  {m.month}
                </span>
              ))}
            </div>
          </div>

          {/* 7-Row Grid with Day Labels */}
          <div className="heatmap-grid-layout">
            {/* Weekday indicators */}
            <div className="heatmap-days-col" aria-hidden="true">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Weeks Columns */}
            <div className="heatmap-weeks-columns">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="heatmap-week-column">
                  {week.map((cell) => {
                    const level = getIntensityLevel(cell);
                    return (
                      <div
                        key={cell.dateKey}
                        className={`heatmap-day-cell level-${level} ${cell.isFuture ? 'future-day' : ''}`}
                        onMouseEnter={(e) => handleCellMouseEnter(e, cell)}
                        onMouseLeave={handleCellMouseLeave}
                        onClick={(e) => handleCellClick(e, cell)}
                        aria-label={`${cell.dateKey}: ${cell.count} activities, ${cell.co2e.toFixed(1)} kg CO2e`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Legend */}
      <div className="heatmap-footer">
        <div className="heatmap-info-hint">
          <Info size={13} />
          <span>Intensity maps daily verified ledger submissions to DEFRA/EPA calculation factors.</span>
        </div>

        <div className="heatmap-legend-row" aria-label="Contribution intensity scale">
          <span className="legend-text">Less</span>
          <span className="legend-cell level-0" title="0 activities logged" />
          <span className="legend-cell level-1" title="Level 1: Minimal emissions / 1 activity" />
          <span className="legend-cell level-2" title="Level 2: Moderate daily activity" />
          <span className="legend-cell level-3" title="Level 3: Significant activity / emissions" />
          <span className="legend-cell level-4" title="Level 4: Peak logged activity" />
          <span className="legend-text">More</span>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredCell && (
        <div
          className="heatmap-floating-tooltip"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`
          }}
        >
          <div className="tooltip-date">
            <Calendar size={12} />
            <span>
              {hoveredCell.date.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>

          <div className="tooltip-stats">
            {hoveredCell.count > 0 ? (
              <>
                <div className="tooltip-stat-line highlight">
                  <strong>{hoveredCell.count} {hoveredCell.count === 1 ? 'activity' : 'activities'} logged</strong>
                </div>
                <div className="tooltip-stat-line">
                  <span>Footprint:</span>
                  <strong>{hoveredCell.co2e.toFixed(2)} kg CO₂e</strong>
                </div>
                {hoveredCell.items && hoveredCell.items.length > 0 && (
                  <div className="tooltip-items-list">
                    {hoveredCell.items.slice(0, 3).map((it, i) => (
                      <div key={i} className="tooltip-item-pill">
                        <span className="item-name">{it.activityType || it.category}</span>
                        <span className="item-val">{it.co2eKg.toFixed(1)} kg</span>
                      </div>
                    ))}
                    {hoveredCell.items.length > 3 && (
                      <small className="tooltip-more-hint">+{hoveredCell.items.length - 3} more</small>
                    )}
                  </div>
                )}
              </>
            ) : (
              <span className="tooltip-empty">No activities recorded on this date.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
