/**
 * ResponseCard — generic renderer for Gemini AI responses.
 * Handles all 6 module output shapes by inspecting JSON keys.
 */

function SeverityBadge({ value }) {
  if (!value) return null;
  const cls = value.toUpperCase();
  return <span className={`sev-badge ${cls}`}>{cls}</span>;
}

function ActionList({ items = [] }) {
  return (
    <ol className="action-list" aria-label="Recommended actions">
      {items.map((item, i) => (
        <li key={i} className={`action-item p${Math.min(i + 1, 3)}`}>
          <span className="action-num" aria-hidden="true">#{i + 1}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function TransmissionBlock({ text, label = 'Message' }) {
  if (!text) return null;
  return (
    <div>
      <div className="section-hdr">{label}</div>
      <div className="tx-block" role="log" aria-label={label}>{text}</div>
    </div>
  );
}

function MetricRow({ metrics = [] }) {
  return (
    <div className="metric-row">
      {metrics.map(({ label, value, color }) => (
        <div className="metric-pill" key={label}>
          <span className="metric-val" style={color ? { color } : {}}>{value}</span>
          <span className="metric-lbl">{label}</span>
        </div>
      ))}
    </div>
  );
}

function CommsGrid({ data }) {
  const entries = [
    { key: 'security_radio', icon: '📻', label: 'Security Radio' },
    { key: 'public_pa',      icon: '📢', label: 'Public PA' },
    { key: 'social_media',   icon: '📱', label: 'Social Media' },
    { key: 'internal_chat',  icon: '💬', label: 'Internal Chat' },
  ].filter(({ key }) => data[key]);

  return (
    <div className="comms-grid">
      {entries.map(({ key, icon, label }) => (
        <div className="comm-item" key={key}>
          <div className="comm-item-hdr">{icon} {label}</div>
          <div className="comm-item-txt">{data[key]}</div>
        </div>
      ))}
    </div>
  );
}

function DebriefReport({ data }) {
  const sections = [
    { key: 'report',          title: 'Executive Summary' },
    { key: 'key_incidents',   title: 'Key Incidents', isArray: true },
    { key: 'decisions_made',  title: 'Decisions Made', isArray: true },
    { key: 'lessons_learned', title: 'Lessons Learned', isArray: true },
  ].filter(({ key }) => data[key]);

  return (
    <div className="debrief-block">
      {sections.map(({ key, title, isArray }) => (
        <div className="debrief-section" key={key}>
          <div className="debrief-section-hdr">{title}</div>
          {isArray && Array.isArray(data[key]) ? (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {data[key].map((item, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  <span style={{ color: 'var(--gold-500)', flexShrink: 0 }}>›</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="debrief-txt">{data[key]}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function ResourceList({ items = [] }) {
  return (
    <div className="resource-list">
      {items.map((item, i) => (
        <div className="resource-item" key={i}>
          <span className="resource-item-icon" aria-hidden="true">⚡</span>
          <span>{typeof item === 'string' ? item : item.action ?? JSON.stringify(item)}</span>
        </div>
      ))}
    </div>
  );
}

export default function ResponseCard({ response, mode }) {
  if (!response) return null;
  const d = response;

  return (
    <div className="resp-card" role="region" aria-label="AI Analysis Result">
      <div className="resp-card-header">
        <span className="resp-card-title">🤖 Gemini Analysis</span>
        {d.severity && <SeverityBadge value={d.severity} />}
      </div>

      <div className="resp-card-body">

        {/* ── Summary / Report ─────────────────────────────── */}
        {d.summary && (
          <div>
            <div className="section-hdr">Summary</div>
            <div className="summary-block">{d.summary}</div>
          </div>
        )}

        {/* ── Crowd density metrics ────────────────────────── */}
        {d.density_pct !== undefined && (
          <MetricRow metrics={[
            { label: 'Density', value: `${d.density_pct}%`, color: d.density_pct >= 90 ? 'var(--sev-high)' : d.density_pct >= 70 ? 'var(--sev-medium)' : 'var(--sev-low)' },
            { label: 'Queue',   value: d.current_queue ?? '–' },
            { label: 'Cap',     value: d.capacity ?? '–' },
            { label: 'Clear (min)', value: d.estimated_clearance_min ?? '–' },
          ]} />
        )}

        {/* ── Recommendations / Action plan ───────────────── */}
        {Array.isArray(d.recommendations) && d.recommendations.length > 0 && (
          <div>
            <div className="section-hdr">Recommended Actions</div>
            <ActionList items={d.recommendations} />
          </div>
        )}
        {Array.isArray(d.action_plan) && d.action_plan.length > 0 && (
          <div>
            <div className="section-hdr">Action Plan</div>
            <ActionList items={d.action_plan} />
          </div>
        )}
        {Array.isArray(d.priority_actions) && d.priority_actions.length > 0 && (
          <div>
            <div className="section-hdr">Priority Actions</div>
            <ActionList items={d.priority_actions} />
          </div>
        )}

        {/* ── Resource reallocation ────────────────────────── */}
        {Array.isArray(d.reallocation_plan) && d.reallocation_plan.length > 0 && (
          <div>
            <div className="section-hdr">Reallocation Plan</div>
            <ResourceList items={d.reallocation_plan} />
          </div>
        )}

        {/* ── Radio / dispatch transmission ───────────────── */}
        {d.radio_message && (
          <TransmissionBlock text={d.radio_message} label="Radio Message" />
        )}
        {d.dispatch_instructions && (
          <TransmissionBlock text={d.dispatch_instructions} label="Dispatch Instructions" />
        )}

        {/* ── Resource requirements ────────────────────────── */}
        {d.resource_requirements && (
          <div>
            <div className="section-hdr">Resources Required</div>
            <div className="summary-block">{
              typeof d.resource_requirements === 'string'
                ? d.resource_requirements
                : JSON.stringify(d.resource_requirements, null, 2)
            }</div>
          </div>
        )}

        {/* ── What-If impact ───────────────────────────────── */}
        {d.predicted_impact && (
          <div>
            <div className="section-hdr">Predicted Impact</div>
            <div className="impact-card">
              <div className="impact-hdr">📊 Simulation Result</div>
              <div className="impact-txt">{d.predicted_impact}</div>
            </div>
          </div>
        )}
        {d.cascade_effects && (
          <div>
            <div className="section-hdr">Cascade Effects</div>
            <div className="summary-block">{d.cascade_effects}</div>
          </div>
        )}
        {(d.queue_changes || d.estimated_delays) && (
          <MetricRow metrics={[
            d.queue_changes   ? { label: 'Queue Δ',   value: d.queue_changes }   : null,
            d.estimated_delays ? { label: 'Est. Delay', value: d.estimated_delays } : null,
          ].filter(Boolean)} />
        )}

        {/* ── Comms grid ───────────────────────────────────── */}
        {(d.security_radio || d.public_pa || d.social_media || d.internal_chat) && (
          <div>
            <div className="section-hdr">Multi-Channel Drafts</div>
            <CommsGrid data={d} />
          </div>
        )}

        {/* ── Debrief ─────────────────────────────────────── */}
        {(d.report || d.key_incidents || d.decisions_made) && (
          <DebriefReport data={d} />
        )}

      </div>
    </div>
  );
}
