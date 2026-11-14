import React, { useMemo, useState } from 'react';
import { Calendar, Flame, CheckCircle, BarChart2, Info } from 'lucide-react';
import './ActivityConsistencyMatrix.css';

/**
 * ActivityConsistencyMatrix (Analytics 11 Implementation)
 * Renders actual month-by-month activity logging consistency across weekly periods.
 * Strictly uses real user data.
 */
export default function ActivityConsistencyMatrix({
  activities = [],
  unitLabel = 'kg CO₂e',
  isTonnes = false,
  isDark = false
}) {
  const [hoveredCell, setHoveredCell] = useState(null);

  // Group real activities by year-month and week-of-month
  const matrixData = useMemo(() => {
    if (!activities || activities.length === 0) return [];

    const monthMap = {};

    activities.forEach((act) => {
      if (!act.logDate) return;
      const date = new Date(act.logDate);
      if (isNaN(date.getTime())) return;

      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const dayOfMonth = date.getDate();
      // Week index: 0 = Days 1-7, 1 = Days 8-14, 2 = Days 15-21, 3 = Days 22-28, 4 = Days 29-31
      const weekIndex = Math.min(Math.floor((dayOfMonth - 1) / 7), 4);

      if (!monthMap[yearMonth]) {
        const monthLabel = date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
        monthMap[yearMonth] = {
          key: yearMonth,
          label: monthLabel,
          weeks: [
            { count: 0, emissions: 0, days: new Set() },
            { count: 0, emissions: 0, days: new Set() },
            { count: 0, emissions: 0, days: new Set() },
            { count: 0, emissions: 0, days: new Set() },
            { count: 0, emissions: 0, days: new Set() }
          ],
          totalActivities: 0,
          totalEmissions: 0,
          activeDaysCount: new Set()
        };
      }

      const co2 = Number(act.co2eKg) || 0;
      monthMap[yearMonth].weeks[weekIndex].count += 1;
      monthMap[yearMonth].weeks[weekIndex].emissions += co2;
      monthMap[yearMonth].weeks[weekIndex].days.add(dayOfMonth);

      monthMap[yearMonth].totalActivities += 1;
      monthMap[yearMonth].totalEmissions += co2;
      monthMap[yearMonth].activeDaysCount.add(act.logDate);
    });

    return Object.values(monthMap)
      .sort((a, b) => b.key.localeCompare(a.key))
      .slice(0, 8) // Show up to 8 most recent months
      .map((m) => {
        const activeWeeks = m.weeks.filter((w) => w.count > 0).length;
        const consistencyRate = Math.round((activeWeeks / 4.5) * 100);
        return {
          ...m,
          activeDays: m.activeDaysCount.size,
          activeWeeks,
          consistencyRate: Math.min(consistencyRate, 100),
          displayEmissions: isTonnes
            ? (m.totalEmissions / 1000).toFixed(3)
            : m.totalEmissions.toFixed(2),
          weeksData: m.weeks.map((w, idx) => ({
            weekNum: idx + 1,
            label: idx === 4 ? 'W5 (29+)' : `Week ${idx + 1}`,
            count: w.count,
            daysLogged: w.days.size,
            emissions: isTonnes ? (w.emissions / 1000).toFixed(3) : w.emissions.toFixed(2)
          }))
        };
      });
  }, [activities, isTonnes]);

  const getIntensityClass = (count) => {
    if (count === 0) return 'cell-empty';
    if (count <= 2) return 'cell-low';
    if (count <= 5) return 'cell-med';
    if (count <= 9) return 'cell-high';
    return 'cell-vhigh';
  };

  return (
    <div className="analytics-matrix-card">
      <div className="matrix-header">
        <div>
          <h3 className="matrix-title">Monthly Activity Consistency Matrix</h3>
          <p className="matrix-subtitle">
            Actual month-by-month tracking frequency and weekly logging consistency
          </p>
        </div>

        {/* Legend */}
        <div className="matrix-legend">
          <span className="legend-label">Activity Volume:</span>
          <span className="legend-box cell-empty" title="0 activities" />
          <span className="legend-box cell-low" title="1-2 activities" />
          <span className="legend-box cell-med" title="3-5 activities" />
          <span className="legend-box cell-high" title="6-9 activities" />
          <span className="legend-box cell-vhigh" title="10+ activities" />
          <span className="legend-text">Higher</span>
        </div>
      </div>

      {matrixData.length === 0 ? (
        <div className="matrix-empty-state">
          <Calendar size={32} className="matrix-empty-icon" />
          <h4>No Activity Consistency History Yet</h4>
          <p>
            As you log your daily trips, electricity usage, and meals, your weekly consistency patterns
            will automatically emerge here.
          </p>
        </div>
      ) : (
        <div className="matrix-table-wrap">
          <table className="matrix-table" role="grid" aria-label="Monthly Activity Consistency Grid">
            <thead>
              <tr>
                <th scope="col" className="col-month">Month</th>
                <th scope="col" className="col-week">W1 (1-7)</th>
                <th scope="col" className="col-week">W2 (8-14)</th>
                <th scope="col" className="col-week">W3 (15-21)</th>
                <th scope="col" className="col-week">W4 (22-28)</th>
                <th scope="col" className="col-week">W5 (29+)</th>
                <th scope="col" className="col-stat">Active Days</th>
                <th scope="col" className="col-stat">Consistency</th>
                <th scope="col" className="col-stat text-right">Emissions</th>
              </tr>
            </thead>
            <tbody>
              {matrixData.map((row) => (
                <tr key={row.key} className="matrix-row">
                  <td className="row-month-cell">
                    <strong>{row.label}</strong>
                    <span className="row-total-sub">{row.totalActivities} logs</span>
                  </td>

                  {row.weeksData.map((week) => {
                    const cellKey = `${row.key}-w${week.weekNum}`;
                    const isHovered = hoveredCell === cellKey;
                    const intensityClass = getIntensityClass(week.count);

                    return (
                      <td
                        key={cellKey}
                        className={`matrix-data-cell ${intensityClass}`}
                        onMouseEnter={() => setHoveredCell(cellKey)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <span className="cell-num">{week.count > 0 ? week.count : '—'}</span>

                        {isHovered && (
                          <div className="cell-tooltip" role="tooltip">
                            <div className="tooltip-head">
                              <strong>{row.label} · {week.label}</strong>
                            </div>
                            <div className="tooltip-row">
                              <span>Activities:</span>
                              <strong>{week.count}</strong>
                            </div>
                            <div className="tooltip-row">
                              <span>Days Logged:</span>
                              <strong>{week.daysLogged} days</strong>
                            </div>
                            <div className="tooltip-row">
                              <span>Footprint:</span>
                              <strong>{week.emissions} {unitLabel}</strong>
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}

                  <td className="col-stat">
                    <span className="stat-pill">{row.activeDays} days</span>
                  </td>

                  <td className="col-stat">
                    <div className="consistency-bar-wrap">
                      <div className="consistency-bar-track">
                        <div
                          className="consistency-bar-fill"
                          style={{ width: `${row.consistencyRate}%` }}
                        />
                      </div>
                      <span className="consistency-rate-text">{row.consistencyRate}%</span>
                    </div>
                  </td>

                  <td className="col-stat text-right">
                    <strong>{row.displayEmissions}</strong>
                    <span className="stat-unit-sub">{unitLabel}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

