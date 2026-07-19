import { useEffect, useRef, useCallback, useState } from 'react';
import { registerCaptureFrame, sensorDataSubject } from '../store/streams';
import { useObservable } from '../hooks/useObservable';

import cameraConfig from '../cameras.json';

function pad(n) { return String(n).padStart(2, '0'); }

export default function CCTVPlayer() {
  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);   // hidden canvas used only for frame capture
  const [clock, setClock]   = useState(new Date());
  const [activeCamera, setActiveCamera] = useState('overview');
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const [sensorData] = useObservable(sensorDataSubject, null);

  // Live clock tick
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ─── Frame capture for Gemini ─────────────────────────────────────────────
  const captureFrame = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    // Keep capture small — 320×180 at q0.35 ≈ 25 KB base64, well within proxy limits
    canvas.width  = 320;
    canvas.height = 180;

    if (video && videoReady && !videoError) {
      try {
        // Try to draw the actual video frame (requires CORS headers on the video)
        ctx.drawImage(video, 0, 0, 320, 180);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.35);
        return dataUrl.replace(/^data:image\/jpeg;base64,/, '');
      } catch {
        // CORS taint — fall through to synthetic frame
      }
    }

    // ── Synthetic fallback frame: sensor data heatmap (320×180) ───────────
    const gates = sensorData?.gates ?? {};
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, 320, 180);

    const ZONES = [
      { key: 'gate1', label: 'G1·N', x: 10,  y: 10,  w: 80,  h: 50 },
      { key: 'gate2', label: 'G2·E', x: 100, y: 10,  w: 80,  h: 50 },
      { key: 'gate3', label: 'G3·S', x: 190, y: 10,  w: 120, h: 50 },
      { key: 'gate5', label: 'G5·W', x: 10,  y: 70,  w: 80,  h: 50 },
      { key: 'gate7', label: 'G7·V', x: 100, y: 70,  w: 80,  h: 50 },
    ];

    ZONES.forEach(({ key, label, x, y, w, h }) => {
      const g = gates[key] ?? { queue: 0, capacity: 500 };
      const pct = Math.min((g.queue ?? 0) / (g.capacity ?? 500), 1);
      const color = pct >= 0.9 ? '#ef4444' : pct >= 0.7 ? '#f59e0b' : pct >= 0.4 ? '#3b82f6' : '#22c55e';

      ctx.fillStyle = `${color}22`;
      ctx.strokeStyle = `${color}88`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = `${color}cc`;
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(label, x + 3, y + 9);
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`${Math.round(pct * 100)}%`, x + w / 2, y + h / 2 + 4);
    });

    // Timestamp overlay
    const ts = new Date();
    ctx.fillStyle = 'rgba(34,197,94,0.8)';
    ctx.font = '7px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${pad(ts.getHours())}:${pad(ts.getMinutes())}:${pad(ts.getSeconds())}`, 5, 8);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.35);
    return dataUrl.replace(/^data:image\/jpeg;base64,/, '');
  }, [videoReady, videoError, sensorData]);

  useEffect(() => {
    registerCaptureFrame(captureFrame);
    return () => registerCaptureFrame(null);
  }, [captureFrame]);

  // Gate statuses derived from sensorData
  const gates      = sensorData?.gates ?? {};
  const gateKeys   = ['gate1','gate2','gate3','gate5','gate7'];
  const hasCritical = gateKeys.some(k => (gates[k]?.queue ?? 0) / (gates[k]?.capacity ?? 500) >= 0.9);

  const timeStr = `${pad(clock.getFullYear())}-${pad(clock.getMonth()+1)}-${pad(clock.getDate())} ${pad(clock.getHours())}:${pad(clock.getMinutes())}:${pad(clock.getSeconds())}`;

  return (
    <div className="cctv-wrapper" role="img" aria-label="CCTV stadium crowd feed">
      {/* ── Real crowd video ─────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        className="cctv-video"
        src={import.meta.env.VITE_CCTV_VIDEO_URL ?? cameraConfig[activeCamera]}
        autoPlay
        loop
        muted
        playsInline
        crossOrigin="anonymous"
        onCanPlay={() => setVideoReady(true)}
        onError={() => { setVideoError(true); setVideoReady(false); }}
        style={{ display: videoError ? 'none' : 'block' }}
      />

      {/* ── Fallback: dark background when video fails ──────────────────── */}
      {videoError && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, #0d1e38 0%, #02060f 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ textAlign: 'center', opacity: 0.4, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#22c55e' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📡</div>
            <div>FEED UNAVAILABLE</div>
            <div style={{ fontSize: 9, marginTop: 4 }}>CHECK NETWORK CONNECTION</div>
          </div>
        </div>
      )}

      {/* ── Cinematic overlays ──────────────────────────────────────────── */}
      {/* Dark gradient at top for HUD readability */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 22%, transparent 75%, rgba(0,0,0,0.35) 100%)',
      }} aria-hidden="true" />

      {/* Scanlines */}
      <div className="cctv-scanlines" aria-hidden="true" />

      {/* CCTV HUD — top-left */}
      <div className="cctv-info-tl" aria-hidden="true" style={{ pointerEvents: 'auto' }}>
        <div style={{ marginBottom: 4 }}>
          <select 
            style={{ 
              background: 'rgba(0,0,0,0.6)', color: 'rgba(34,197,94,0.85)', 
              border: '1px solid rgba(34,197,94,0.4)', outline: 'none', 
              fontFamily: 'inherit', fontSize: '9.5px', padding: '2px 4px', 
              borderRadius: '3px', cursor: 'pointer',
              textShadow: '0 0 8px rgba(34,197,94,0.45)'
            }}
            value={activeCamera} 
            onChange={(e) => setActiveCamera(e.target.value)}
          >
            {Object.keys(cameraConfig).map(key => (
              <option key={key} value={key} style={{ background: '#000' }}>
                CAM-{key.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div>{timeStr}</div>
        <div>LEVI'S STADIUM · SANTA CLARA</div>
      </div>

      {/* CCTV HUD — top-right */}
      <div className="cctv-info-tr" aria-hidden="true">
        <div className="cctv-rec">
          <span className="cctv-rec-dot" />
          <span>● REC</span>
        </div>
        <div>RES 2560×1440</div>
        <div>CAMS {sensorData?.security?.cameras_online ?? 247} ONLINE</div>
      </div>

      {/* Gate density strip — bottom overlay ──────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(0deg, rgba(2,6,15,0.88) 0%, rgba(2,6,15,0.5) 70%, transparent 100%)',
        padding: '20px 14px 8px',
        display: 'flex', gap: 5, pointerEvents: 'none',
      }} aria-hidden="true">
        {gateKeys.map(k => {
          const g = gates[k] ?? { queue: 0, capacity: 500 };
          const pct = Math.round(Math.min((g.queue ?? 0) / (g.capacity ?? 500), 1) * 100);
          let color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : pct >= 40 ? '#60a5fa' : '#22c55e';
          const labels = { gate1:'G1', gate2:'G2', gate3:'G3', gate5:'G5', gate7:'G7' };
          return (
            <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{
                background: `${color}20`,
                border: `1px solid ${color}55`,
                borderRadius: 4, padding: '3px 6px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: '#8da0b8', fontWeight: 700 }}>
                  {labels[k]}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color, fontWeight: 800 }}>
                  {pct}%
                </span>
              </div>
              {/* Mini bar */}
              <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`, background: color,
                  borderRadius: 2, transition: 'width 800ms ease',
                  boxShadow: pct >= 90 ? `0 0 6px ${color}` : 'none',
                }} />
              </div>
            </div>
          );
        })}

        {/* Alert pill */}
        {hasCritical && (
          <div style={{
            padding: '3px 8px', borderRadius: 4,
            background: 'rgba(220,38,38,0.18)', border: '1px solid rgba(220,38,38,0.5)',
            fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: '#fca5a5',
            fontWeight: 800, letterSpacing: 1, alignSelf: 'flex-start',
            animation: 'pulse-badge 1.5s infinite',
          }}>
            ⚠ CRITICAL
          </div>
        )}
      </div>

      {/* Corner brackets */}
      {['tl','tr','bl','br'].map(pos => (
        <div key={pos} className={`cctv-corner ${pos}`} aria-hidden="true" />
      ))}

      {/* Hidden canvas for frame capture only */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
