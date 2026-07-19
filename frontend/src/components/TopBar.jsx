import { useState, useEffect } from 'react';
import { useObservable } from '../hooks/useObservable';
import { sensorDataSubject } from '../store/streams';

function pad(n) { return String(n).padStart(2, '0'); }

export default function TopBar() {
  const [time, setTime] = useState(new Date());
  const [sensorData] = useObservable(sensorDataSubject, null);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hasAlert =
    sensorData?.security?.alerts_active > 0 ||
    sensorData?.medical?.incidents_active > 2;

  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;

  const attendance = sensorData?.total_attendance ?? 0;
  const capacity   = sensorData?.capacity_total ?? 75000;
  const fillPct    = Math.round((attendance / capacity) * 100);

  return (
    <header className="topbar" role="banner">
      {/* Logo */}
      <div className="topbar-logo">
        <div className="topbar-logo-icon" aria-hidden="true">⚡</div>
        <div className="topbar-logo-wordmark">
          <div className="topbar-logo-name">Match<em>Pulse</em> Ops</div>
          <div className="topbar-logo-venue">
            {sensorData?.stadium ?? "Levi's Stadium · Santa Clara"}
          </div>
        </div>
      </div>

      {/* Center: match info + clock */}
      <div className="topbar-center">
        <div className="topbar-match">
          {sensorData?.match ?? 'Brazil vs Argentina — Group D'}
        </div>
        <time className="topbar-clock" aria-label="Current time">{timeStr}</time>
      </div>

      {/* Right: stats + status */}
      <div className="topbar-right">
        <div className="topbar-stat">
          <span className="topbar-stat-val" style={{ color: 'var(--gold-400)' }}>
            {sensorData?.event_phase ?? 'Pre-Match'}
          </span>
          <span className="topbar-stat-lbl">Event Phase</span>
        </div>

        <div className="topbar-stat">
          <span
            className="topbar-stat-val"
            style={{ color: fillPct > 85 ? 'var(--sev-high)' : 'var(--text-primary)' }}
          >
            {attendance.toLocaleString()}
          </span>
          <span className="topbar-stat-lbl">Attendance ({fillPct}%)</span>
        </div>

        <div className="topbar-stat">
          <span
            className="topbar-stat-val"
            style={{ color: (sensorData?.medical?.incidents_active ?? 0) > 0 ? 'var(--sev-high)' : 'var(--sev-low)' }}
          >
            {sensorData?.medical?.incidents_active ?? 0}
          </span>
          <span className="topbar-stat-lbl">Active Incidents</span>
        </div>

        <div className={`status-badge ${hasAlert ? 'alert' : 'nominal'}`} role="status">
          <span className="status-dot" aria-hidden="true" />
          {hasAlert ? 'ALERT' : 'All Nominal'}
        </div>
      </div>
    </header>
  );
}
