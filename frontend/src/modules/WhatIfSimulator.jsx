import { useState, useEffect } from 'react';
import { useObservable } from '../hooks/useObservable';
import { aiResponseSubject, loadingSubject, errorSubject, triggerAnalysis, selectedModuleSubject } from '../store/streams';
import ResponseCard from '../components/ResponseCard';

const MODE = 'what_if';

const PRESETS = [
  'What if we close Gate 5 and redirect crowd to Gate 7?',
  'What if we open an emergency exit on the North side?',
  'What if medical response time increases by 5 minutes?',
  'What if we deploy 50 extra security staff to Gate 2?',
  'What if it starts raining and attendance drops by 10%?',
  'What if Gate 1 closes for maintenance for 20 minutes?',
];

export default function WhatIfSimulator() {
  const [scenario, setScenario] = useState('');
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
    if (!scenario.trim()) return;
    triggerAnalysis(MODE, scenario);
  };

  return (
    <div className="module-area" role="main">
      <div className="module-header">
        <div className="module-title-row">
          <div className="module-icon" aria-hidden="true">🔮</div>
          <h1 className="module-name">What-If Simulator</h1>
        </div>
        <p className="module-desc">Predict cascade effects of hypothetical operational decisions before acting</p>
      </div>

      <div className="module-body">
        <div className="input-group">
          <label className="input-lbl" htmlFor="whatif-scenario">Describe your scenario</label>
          <textarea
            id="whatif-scenario"
            className="textarea-field"
            style={{ minHeight: 76 }}
            placeholder="e.g. What if we close Gate 5 and open Gate 7 to relieve overcrowding?"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            id="whatif-run-btn"
            className="btn-run"
            onClick={handleRun}
            disabled={loading || !scenario.trim()}
          >
            {loading ? '⏳ Simulating…' : '🔮 Run Simulation'}
          </button>
          {scenario && (
            <button className="btn-ghost" onClick={() => setScenario('')}>Clear</button>
          )}
        </div>

        {/* Preset scenarios */}
        <div>
          <div className="section-hdr">Try a Scenario</div>
          <div className="chip-row">
            {PRESETS.map((p) => (
              <button key={p} className="chip" style={{ textAlign: 'left' }} onClick={() => setScenario(p)}>
                {p.length > 45 ? p.slice(0, 42) + '…' : p}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="loading-wrap">
            <div className="loading-ring" />
            <p className="loading-txt">Simulating scenario with Gemini…</p>
          </div>
        )}

        {!loading && error && (
          <div className="error-box">
            <strong>⚠ Simulation Failed</strong>{error}
          </div>
        )}

        {!loading && localResp && !error && (
          <ResponseCard response={localResp} mode={MODE} />
        )}

        {!loading && !localResp && !error && (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">🔮</div>
            <p className="empty-txt">Describe a hypothetical scenario — gate closures, staff changes, weather events — and Gemini will predict queue impacts, estimated delays, and cascading crowd effects.</p>
          </div>
        )}
      </div>
    </div>
  );
}
