import { useState, useEffect } from 'react';
import { useObservable } from '../hooks/useObservable';
import { aiResponseSubject, loadingSubject, errorSubject, triggerAnalysis, selectedModuleSubject } from '../store/streams';
import ResponseCard from '../components/ResponseCard';

const MODE = 'resource_optimizer';

export default function ResourceOptimizer() {
  const [localResp, setLocalResp] = useState(null);
  const [hasRun, setHasRun]       = useState(false);

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
    setHasRun(true);
    triggerAnalysis(MODE, 'Analyse current sensor snapshot and provide optimal resource allocation recommendations.');
  };

  return (
    <div className="module-area" role="main">
      <div className="module-header">
        <div className="module-title-row">
          <div className="module-icon" aria-hidden="true">⚡</div>
          <h1 className="module-name">Resource Optimizer</h1>
        </div>
        <p className="module-desc">AI analyses the full sensor snapshot to recommend staff reallocation, lane management &amp; volunteer routing</p>
      </div>

      <div className="module-body">
        {/* Info card */}
        <div className="impact-card">
          <div className="impact-hdr">ℹ How it works</div>
          <div className="impact-txt">
            This module requires no input. It reads the current live sensor data — all gate queues,
            staff positions, medical status and facility utilisation — and uses Gemini to compute the
            optimal resource allocation across the entire stadium.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            id="resource-run-btn"
            className="btn-run"
            onClick={handleRun}
            disabled={loading}
          >
            {loading ? '⏳ Optimising…' : '⚡ Optimise Resources Now'}
          </button>
          {localResp && (
            <button className="btn-ghost" onClick={handleRun} disabled={loading}>
              ↺ Refresh
            </button>
          )}
        </div>

        {loading && (
          <div className="loading-wrap">
            <div className="loading-ring" />
            <p className="loading-txt">Computing optimal resource allocation…</p>
          </div>
        )}

        {!loading && error && (
          <div className="error-box">
            <strong>⚠ Optimisation Failed</strong>{error}
          </div>
        )}

        {!loading && localResp && !error && (
          <ResponseCard response={localResp} mode={MODE} />
        )}

        {!loading && !localResp && !error && (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">⚡</div>
            <p className="empty-txt">Click Optimise to let Gemini analyse all sensor data and generate staff reallocation, lane opening/closing, and volunteer routing recommendations.</p>
          </div>
        )}
      </div>
    </div>
  );
}
