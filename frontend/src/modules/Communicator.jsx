import { useState, useEffect } from 'react';
import { useObservable } from '../hooks/useObservable';
import { aiResponseSubject, loadingSubject, errorSubject, triggerAnalysis, selectedModuleSubject } from '../store/streams';
import ResponseCard from '../components/ResponseCard';

const MODE = 'communicator';

const AUDIENCE_OPTIONS = [
  { value: 'all',      label: 'All Channels' },
  { value: 'security', label: 'Security Radio Only' },
  { value: 'public',   label: 'Public PA Only' },
  { value: 'social',   label: 'Social Media Only' },
  { value: 'internal', label: 'Internal Chat Only' },
];

const TONE_OPTIONS = [
  { value: 'calm',    label: 'Calm & Reassuring' },
  { value: 'urgent',  label: 'Urgent & Direct' },
  { value: 'formal',  label: 'Formal & Official' },
  { value: 'concise', label: 'Concise & Factual' },
];

const INCIDENT_PROMPTS = [
  'Overcrowding at Gate 5 — redirect fans to Gate 7',
  'Medical emergency in Section A — area temporarily closed',
  'Security alert resolved — normal operations resumed',
  'Match delay of 15 minutes announced by officials',
  'Heavy rain expected in 20 minutes — direct fans under cover',
];

export default function Communicator() {
  const [audience,  setAudience]  = useState('all');
  const [tone,      setTone]      = useState('calm');
  const [incident,  setIncident]  = useState('');
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
    if (!incident.trim()) return;
    const userInput = `Audience: ${audience}. Tone: ${tone}. Incident/situation: ${incident}`;
    triggerAnalysis(MODE, userInput);
  };

  return (
    <div className="module-area" role="main">
      <div className="module-header">
        <div className="module-title-row">
          <div className="module-icon" aria-hidden="true">📡</div>
          <h1 className="module-name">Multi-Stakeholder Communicator</h1>
        </div>
        <p className="module-desc">Generate audience-tailored messages for Security Radio, Public PA, Social Media &amp; Internal Chat</p>
      </div>

      <div className="module-body">
        <div className="input-row">
          <div className="input-group">
            <label className="input-lbl" htmlFor="comm-audience">Target Audience</label>
            <select id="comm-audience" className="select-field" value={audience} onChange={(e) => setAudience(e.target.value)}>
              {AUDIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-lbl" htmlFor="comm-tone">Tone</label>
            <select id="comm-tone" className="select-field" value={tone} onChange={(e) => setTone(e.target.value)}>
              {TONE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="input-group">
          <label className="input-lbl" htmlFor="comm-incident">Incident / Situation to Communicate</label>
          <textarea
            id="comm-incident"
            className="textarea-field"
            placeholder="e.g. Overcrowding at Gate 5 — redirect fans to Gate 7 and Gate 3"
            value={incident}
            onChange={(e) => setIncident(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            id="comm-run-btn"
            className="btn-run"
            onClick={handleRun}
            disabled={loading || !incident.trim()}
          >
            {loading ? '⏳ Drafting…' : '📡 Generate Messages'}
          </button>
        </div>

        <div>
          <div className="section-hdr">Common Situations</div>
          <div className="chip-row">
            {INCIDENT_PROMPTS.map((p) => (
              <button key={p} className="chip" style={{ textAlign: 'left' }} onClick={() => setIncident(p)}>
                {p.length > 45 ? p.slice(0, 42) + '…' : p}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="loading-wrap">
            <div className="loading-ring" />
            <p className="loading-txt">Drafting messages for all channels…</p>
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
            <div className="empty-icon" aria-hidden="true">📡</div>
            <p className="empty-txt">Describe the situation, select audience and tone — Gemini generates ready-to-send drafts for Security Radio, Public PA, Social Media, and Internal Chat simultaneously.</p>
          </div>
        )}
      </div>
    </div>
  );
}
