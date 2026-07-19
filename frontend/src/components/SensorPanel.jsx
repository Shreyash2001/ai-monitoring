import { useObservable } from '../hooks/useObservable';
import { sensorDataSubject } from '../store/streams';

const GATE_ORDER = ['gate1', 'gate2', 'gate3', 'gate5', 'gate7'];
const GATE_LABELS = { gate1: 'G1', gate2: 'G2', gate3: 'G3', gate5: 'G5', gate7: 'G7' };

function gateClass(pct) {
  if (pct >= 90) return 'critical';
  if (pct >= 70) return 'high';
  if (pct >= 40) return 'normal';
  return 'low';
}

export default function SensorPanel() {
  const [sd] = useObservable(sensorDataSubject, null);

  const gates   = sd?.gates ?? {};
  const medical = sd?.medical ?? {};
  const weather = sd?.weather ?? {};
  const fac     = sd?.facilities ?? {};
  const staff   = sd?.staff ?? {};
  const sec     = sd?.security ?? {};

  return (
    <div className="sensor-panel" role="complementary" aria-label="Live sensor metrics">

      {/* Gate queues */}
      <div className="sw" style={{ minWidth: 130 }}>
        <div className="sw-label label-xs">Gate Queues</div>
        <div className="gate-bars">
          {GATE_ORDER.map((key) => {
            const g = gates[key] ?? {};
            const pct = g.capacity ? Math.round((g.queue / g.capacity) * 100) : 0;
            const cls = gateClass(pct);
            return (
              <div className="gate-row" key={key}>
                <span className="gate-row-lbl">{GATE_LABELS[key]}</span>
                <div className="gate-track">
                  <div
                    className={`gate-fill ${cls}`}
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <span className="gate-pct">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Medical */}
      <div className="sw">
        <div className="sw-label label-xs">Medical</div>
        <div className={`sw-val ${(medical.incidents_active ?? 0) > 0 ? 'bad' : 'ok'}`}>
          {medical.incidents_active ?? 0}
        </div>
        <div className="sw-sub">Active incidents</div>
        <div className="sw-sub">{medical.medics_on_duty ?? '–'} medics on duty</div>
      </div>

      {/* Weather */}
      <div className="sw">
        <div className="sw-label label-xs">Weather</div>
        <div className="sw-val" style={{ color: 'var(--gold-400)' }}>
          {weather.temp_c ?? '–'}°C
        </div>
        <div className="sw-sub">{weather.condition ?? '–'} • {weather.humidity_pct ?? '–'}% RH</div>
        <div className="sw-sub">UV {weather.uv_index ?? '–'} • Wind {weather.wind_kmh ?? '–'} km/h</div>
      </div>

      {/* Facilities */}
      <div className="sw">
        <div className="sw-label label-xs">Facilities</div>
        <div className={`sw-val ${(fac.restroom_availability_pct ?? 100) < 40 ? 'med' : 'ok'}`}>
          {fac.restroom_availability_pct ?? '–'}%
        </div>
        <div className="sw-sub">Restroom availability</div>
        <div className="sw-sub">{fac.concession_wait_avg_min ?? '–'} min concession wait</div>
      </div>

      {/* Staff */}
      <div className="sw">
        <div className="sw-label label-xs">Staff</div>
        <div className="sw-val">{(staff.total_on_duty ?? 0).toLocaleString()}</div>
        <div className="sw-sub">{staff.security ?? '–'} security</div>
        <div className="sw-sub">{staff.volunteers ?? '–'} volunteers</div>
      </div>

      {/* Security */}
      <div className="sw">
        <div className="sw-label label-xs">Security</div>
        <div className={`sw-val ${(sec.alerts_active ?? 0) > 0 ? 'bad' : 'ok'}`}>
          {sec.alerts_active ?? 0}
        </div>
        <div className="sw-sub">Active alerts</div>
        <div className="sw-sub">{sec.cameras_online ?? '–'} cams online</div>
      </div>

    </div>
  );
}
