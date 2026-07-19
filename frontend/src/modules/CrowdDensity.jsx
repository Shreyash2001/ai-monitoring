import { useState, useEffect } from 'react';
import { useObservable } from '../hooks/useObservable';
import { aiResponseSubject, loadingSubject, errorSubject, triggerAnalysis, selectedModuleSubject } from '../store/streams';
import ResponseCard from '../components/ResponseCard';

const MODE = 'crowd_density';

const QUICK_ZONES = ['Gate 1 - North', 'Gate 2 - East', 'Gate 3 - South', 'Gate 5 - West', 'Gate 7 - VIP', 'All Gates Overview'];

export default function CrowdDensity() {
  const [zone, setZone]           = useState('');
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
    triggerAnalysis(MODE, zone || 'All Gates Overview');
  };

  return (
    <div className="module-area" role="main">
      <div className="module-header">
        <div className="module-title-row">
          <div className="module-icon" aria-hidden="true">👥</div>
          <h1 className="module-name">Crowd Density Analyst</h1>
        </div>
        <p className="module-desc">Monitor gate &amp; zone crowding • Get AI-powered density assessment and radio messages</p>
      </div>

      <div className="module-body">
        {/* Input */}
        <div className="input-row">
          <div className="input-group">
            <label className="input-lbl" htmlFor="crowd-zone-input">Zone / Gate</label>
            <input
              id="crowd-zone-input"
              className="input-field"
              placeholder="e.g. Gate 5 - West, or All Gates Overview"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRun()}
            />
          </div>
          <button
            id="crowd-run-btn"
            className="btn-run"
            onClick={handleRun}
            disabled={loading}
          >
            {loading ? '⏳ Analysing…' : '▶ Run Analysis'}
          </button>
        </div>

        {/* Quick select */}
        <div>
          <div className="section-hdr">Quick Select</div>
          <div className="chip-row">
            {QUICK_ZONES.map((z) => (
              <button key={z} className="chip" onClick={() => { setZone(z); }}>
                {z}
              </button>
            ))}
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="loading-wrap">
            <div className="loading-ring" />
            <p className="loading-txt">Analysing crowd density with Gemini 2.5 Flash…</p>
          </div>
        )}

        {!loading && error && (
          <div className="error-box">
            <strong>⚠ Analysis Failed</strong>
            {error}
          </div>
        )}

        {!loading && localResp && !error && (
          <ResponseCard response={localResp} mode={MODE} />
        )}

        {!loading && !localResp && !error && (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">👥</div>
            <p className="empty-txt">Select a zone or type a gate name, then click Run Analysis to get an AI crowd density report with recommendations and a radio message draft.</p>
          </div>
        )}
      </div>
    </div>
  );
}
