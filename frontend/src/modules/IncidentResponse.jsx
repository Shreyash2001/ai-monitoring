import { useState, useEffect } from 'react';
import { useObservable } from '../hooks/useObservable';
import { aiResponseSubject, loadingSubject, errorSubject, triggerAnalysis, selectedModuleSubject } from '../store/streams';
import ResponseCard from '../components/ResponseCard';

const MODE = 'incident_response';

const INCIDENT_TYPES = ['Medical Emergency', 'Security Threat', 'Fire Alarm', 'Crowd Crush', 'Suspicious Package', 'VIP Security Breach'];
const LOCATIONS      = ['Gate 1 - North', 'Gate 2 - East', 'Gate 5 - West', 'Section A Concourse', 'Medical Bay', 'VIP Lounge', 'Parking Lot B'];

export default function IncidentResponse() {
  const [type, setType]       = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes]     = useState('');
  const [localResp, setLocalResp] = useState(null);

  const [response] = useObservable(aiResponseSubject, null);
  const [loading]  = useObservable(loadingSubject, false);
  const [error]    = useObservable(errorSubject, null);
  const [selMod]   = useObservable(selectedModuleSubject, null);

  useEffect(() => {
    if (selMod === MODE && response?.mode === MODE && response?.data) {
      setLocalResp(response.data);
    }
  }, [response, selMod]);

  const handleRun = () => {
    if (!type || !location) return;
    const userInput = `Incident type: ${type}. Location: ${location}. ${notes ? `Additional notes: ${notes}` : ''}`.trim();
    triggerAnalysis(MODE, userInput);
  };

  return (
    <div className="module-area" role="main">
      <div className="module-header">
        <div className="module-title-row">
          <div className="module-icon" aria-hidden="true">🚨</div>
          <h1 className="module-name">Incident Response Co-Pilot</h1>
        </div>
        <p className="module-desc">Medical, security &amp; safety incidents • Severity triage • Step-by-step action plan</p>
      </div>

      <div className="module-body">
        {/* Inputs */}
        <div className="input-row">
          <div className="input-group">
            <label className="input-lbl" htmlFor="incident-type-select">Incident Type</label>
            <select
              id="incident-type-select"
              className="select-field"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">Select type…</option>
              {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-lbl" htmlFor="incident-location-select">Location</label>
            <select
              id="incident-location-select"
              className="select-field"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">Select location…</option>
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="input-group">
          <label className="input-lbl" htmlFor="incident-notes">Additional Context (optional)</label>
          <textarea
            id="incident-notes"
            className="textarea-field"
            placeholder="e.g. Elderly fan, unconscious near Gate 2 turnstile…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            id="incident-run-btn"
            className="btn-run"
            onClick={handleRun}
            disabled={loading || !type || !location}
          >
            {loading ? '⏳ Triaging…' : '🚨 Activate Response'}
          </button>
        </div>

        {/* Quick scenarios */}
        <div>
          <div className="section-hdr">Common Scenarios</div>
          <div className="chip-row">
            {[
              ['Medical Emergency', 'Gate 2 - East'],
              ['Crowd Crush', 'Gate 5 - West'],
              ['Security Threat', 'Section A Concourse'],
              ['Fire Alarm', 'Gate 1 - North'],
            ].map(([t, l]) => (
              <button
                key={`${t}-${l}`}
                className="chip"
                onClick={() => { setType(t); setLocation(l); }}
              >
                {t} @ {l.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="loading-wrap">
            <div className="loading-ring" />
            <p className="loading-txt">Generating incident response plan…</p>
          </div>
        )}

        {!loading && error && (
          <div className="error-box">
            <strong>⚠ Analysis Failed</strong>{error}
          </div>
        )}

        {!loading && localResp && !error && (
          <ResponseCard response={localResp} mode={MODE} />
        )}

        {!loading && !localResp && !error && (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">🚨</div>
            <p className="empty-txt">Select an incident type and location to generate a full response plan with severity triage, resource requirements, and dispatch instructions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
