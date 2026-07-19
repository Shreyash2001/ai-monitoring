import { BehaviorSubject, interval, from, of } from 'rxjs';
import { switchMap, startWith, catchError } from 'rxjs/operators';

// ─── Core State Subjects ──────────────────────────────────────────────────────

/** Holds the latest sensor JSON object, updated every 2 seconds */
export const sensorDataSubject = new BehaviorSubject(null);

/** Holds the most recent base64 JPEG frame captured from the CCTV canvas */
export const cctvFrameSubject = new BehaviorSubject(null);

/** Holds the currently active module ID */
export const selectedModuleSubject = new BehaviorSubject('crowd_density');

/**
 * Holds the latest AI response object: { mode: string, data: object }
 * Reset to null when switching modules or starting a new analysis.
 */
export const aiResponseSubject = new BehaviorSubject(null);

/** Boolean — true while a Gemini API call is in flight */
export const loadingSubject = new BehaviorSubject(false);

/** Error message string | null */
export const errorSubject = new BehaviorSubject(null);

// ─── Frame Capture Registry ───────────────────────────────────────────────────
// CCTVPlayer registers its captureFrame fn here so other modules can trigger it.

let _captureFrameFn = null;

export const registerCaptureFrame = (fn) => {
  _captureFrameFn = fn;
};

export const captureCurrentFrame = () => {
  if (_captureFrameFn) {
    const base64 = _captureFrameFn();
    if (base64) cctvFrameSubject.next(base64);
    return base64;
  }
  return cctvFrameSubject.getValue();
};

// ─── Analysis Trigger ─────────────────────────────────────────────────────────

/**
 * Orchestrates a full AI analysis cycle:
 * 1. Captures CCTV frame
 * 2. Gets current sensor data
 * 3. Calls Gemini via geminiService
 * 4. Pushes result into aiResponseSubject
 */
export const triggerAnalysis = async (mode, userInput) => {
  loadingSubject.next(true);
  errorSubject.next(null);
  aiResponseSubject.next(null);

  const imageBase64 = captureCurrentFrame();
  const sensorData = sensorDataSubject.getValue();

  // Dynamic import avoids circular dependency (geminiService imports subjects from here)
  const { callGemini } = await import('../services/geminiService.js');
  callGemini({ mode, imageBase64, sensorData, userInput });
};

// ─── Module Switch Helper ─────────────────────────────────────────────────────

export const selectModule = (moduleId) => {
  selectedModuleSubject.next(moduleId);
  aiResponseSubject.next(null);
  errorSubject.next(null);
};

// ─── Sensor Polling ───────────────────────────────────────────────────────────

const SENSOR_URL = '/sensor.json';

export const startSensorPolling = () => {
  const poll$ = interval(2000).pipe(
    startWith(0),
    switchMap(() =>
      from(
        fetch(`${SENSOR_URL}?_t=${Date.now()}`, { cache: 'no-store' }).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
      ).pipe(
        catchError((err) => {
          console.error('[SensorPolling] Error:', err.message);
          return of(null);
        })
      )
    )
  );

  const subscription = poll$.subscribe((data) => {
    if (data) sensorDataSubject.next(data);
  });

  return subscription; // caller can .unsubscribe() on cleanup
};
