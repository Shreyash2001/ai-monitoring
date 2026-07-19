import { useState, useEffect } from 'react';
import { useObservable } from '../hooks/useObservable';
import { aiResponseSubject, loadingSubject, errorSubject, triggerAnalysis, selectedModuleSubject } from '../store/streams';
import ResponseCard from '../components/ResponseCard';

const MODE = 'debrief';

const TIME_PRESETS = [
  { label: 'Last 30 min',  value: 'last 30 minutes' },
  { label: 'Last 1 hour',  value: 'last 1 hour' },
  { label: 'Last 2 hours', value: 'last 2 hours' },
  { label: 'Last 4 hours', value: 'last 4 hours' },
  { label: 'Full Day',     value: 'full day' },
  { label: 'Pre-Match',    value: 'pre-match period' },
];

export default function PostEventDebrief() {
  const [timeWindow, setTimeWindow] = useState('last 2 hours');
  const [focus,      setFocus]      = useState('');
  const [localResp,  setLocalResp]  = useState(null);

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
    const userInput = `Generate after-action review for the ${timeWindow}. ${focus ? `Focus area: ${focus}` : ''}`.trim();
    triggerAnalysis(MODE, userInput);
  };

  return (
    <div className="module-area" role="main">
      <div className="module-header">
        <div className="module-title-row">
          <div className="module-icon" aria-hidden="true">📋</div>
          <h1 className="module-name">Post-Event Debrief Generator</h1>
        </div>
        <p className="module-desc">Synthesise operational history into structured after-action reports &amp; lessons learned</p>
      </div>

      <div className="module-body">
        <div>
          <div className="section-hdr">Time Window</div>
          <div className="chip-row" style={{ marginBottom: 10 }}>
            {TIME_PRESETS.map(({ label, value }) => (
              <button
                key={value}
                className={`chip ${timeWindow === value ? 'chip-active' : ''}`}
                style={timeWindow === value ? { borderColor: 'var(--gold-500)', color: 'var(--gold-400)', background: 'rgba(200,168,75,0.08)' } : {}}
                onClick={() => setTimeWindow(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label className="input-lbl" htmlFor="debrief-focus">Focus Area (optional)</label>
          <input
            id="debrief-focus"
            className="input-field"
            placeholder="e.g. Medical response, Gate 5 overcrowding, VIP security"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            id="debrief-run-btn"
            className="btn-run"
            onClick={handleRun}
            disabled={loading}
          >
            {loading ? '⏳ Generating…' : '📋 Generate Debrief'}
          </button>
          {localResp && !loading && (
            <button className="btn-ghost" onClick={handleRun}>↺ Regenerate</button>
          )}
        </div>

        {loading && (
          <div className="loading-wrap">
            <div className="loading-ring" />
            <p className="loading-txt">Generating after-action review…</p>
          </div>
        )}

        {!loading && error && (
          <div className="error-box">
            <strong>⚠ Generation Failed</strong>{error}
          </div>
        )}

        {!loading && localResp && !error && (
          <ResponseCard response={localResp} mode={MODE} />
        )}

        {!loading && !localResp && !error && (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">📋</div>
            <p className="empty-txt">Select a time window and click Generate to produce an AI-written after-action review covering incidents, decisions, resource movements, and lessons learned.</p>
          </div>
        )}
      </div>
    </div>
  );
}
