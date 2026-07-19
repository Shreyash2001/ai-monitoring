import { from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { aiResponseSubject, loadingSubject, errorSubject } from '../store/streams.js';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Model fallback chain — ordered by free-tier daily quota (highest first).
const MODELS = [
  'gemini-1.5-flash',           // 1,500 req/day  — primary
  'gemini-2.0-flash',           //   200 req/day  — fallback 1
  'gemini-2.0-flash-lite',      //   200 req/day  — fallback 2
  'gemini-1.5-flash-8b',        // 1,500 req/day  — fallback 3
];

function buildPrompt(mode, sensorData, userInput) {
  const sensorStr = JSON.stringify(sensorData ?? {}, null, 2);

  switch (mode) {
    case 'crowd_density':
      return `You are an expert stadium crowd management analyst working at the FIFA World Cup 2026 command centre at Levi's Stadium, Santa Clara.

The attached image is a synthetic CCTV visualisation showing crowd density levels across all gates and zones. Each coloured zone represents a gate: green = low density, blue = normal, amber = high, red = critical.

Current live sensor data:
${sensorStr}

Operator query: "${userInput}"

Analyse the crowd situation for the specified zone/gate (or all gates if "overview" is requested). Provide actionable, specific guidance.

Respond with ONLY valid JSON — no markdown fences, no extra text. Use exactly this structure:
{
  "summary": "2–3 sentence assessment of current crowd conditions",
  "density_pct": <number 0–100>,
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "zone": "<zone name>",
  "current_queue": <number>,
  "capacity": <number>,
  "recommendations": ["specific action 1", "specific action 2", "specific action 3", "action 4"],
  "radio_message": "DISPATCH ALL UNITS — [realistic radio message that an operations manager would say verbatim]",
  "estimated_clearance_min": <number>
}`;

    case 'incident_response':
      return `You are an expert stadium incident response coordinator at the FIFA World Cup 2026 command centre.

The attached image shows the current crowd density visualisation across the stadium.

Current live sensor data:
${sensorStr}

Incident reported: "${userInput}"

Based on the incident type, location, and sensor data, generate a comprehensive response plan. Be specific about resource numbers, timing, and communication steps.

Respond with ONLY valid JSON — no markdown fences, no extra text:
{
  "summary": "Brief incident assessment in 2 sentences",
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "resource_requirements": "Description of exact resources needed (e.g. '3 medics, 1 AED, 2 security officers')",
  "action_plan": [
    "IMMEDIATE (0–2 min): specific action",
    "SHORT-TERM (2–5 min): specific action",
    "MEDIUM-TERM (5–15 min): specific action",
    "MONITORING: ongoing action"
  ],
  "dispatch_instructions": "Verbatim dispatch message for response teams, in realistic operational format",
  "estimated_response_min": <number>,
  "area_clearance_required": true | false,
  "notify_authorities": true | false
}`;

    case 'resource_optimizer':
      return `You are an expert stadium operations resource optimiser at the FIFA World Cup 2026 command centre.

The attached image shows the crowd density heatmap with gate-level queue information.

Current live sensor data (use ALL fields for a comprehensive analysis):
${sensorStr}

Analyse the full sensor snapshot and generate an optimal resource reallocation plan to address crowd hotspots, staff inefficiencies, and facility bottlenecks.

Respond with ONLY valid JSON — no markdown fences, no extra text:
{
  "summary": "2–3 sentence executive overview of current resource situation",
  "reallocation_plan": [
    "Move X staff from [underused area] to [hotspot] — reason",
    "Open/close [specific lane or facility] — reason",
    "Re-route [volunteer team] to [location] — reason"
  ],
  "priority_actions": [
    "CRITICAL: action to take immediately",
    "HIGH: action within 5 min",
    "MEDIUM: action within 15 min"
  ],
  "estimated_improvement_pct": <number, crowd flow improvement>,
  "staff_redistribution": {
    "from": "<current hotspot gate or area>",
    "to": "<destination>",
    "count": <number>
  }
}`;

    case 'what_if':
      return `You are an expert stadium crowd simulation analyst at the FIFA World Cup 2026 command centre.

The attached image shows the current crowd density visualisation.

Current live sensor data:
${sensorStr}

Hypothetical scenario posed by the operator: "${userInput}"

Simulate the cascading effects of this scenario on crowd flow, queue lengths, staff requirements, and safety. Be specific with numbers and timelines.

Respond with ONLY valid JSON — no markdown fences, no extra text:
{
  "summary": "1–2 sentence framing of the scenario",
  "predicted_impact": "Detailed narrative of what would happen (3–4 sentences, include specific gate/zone effects)",
  "queue_changes": "e.g. Gate 7 queue: +180 pax (+40%), Gate 5 relief: -220 pax (-50%)",
  "estimated_delays": "e.g. 8–12 additional minutes for fan ingress at Gate 7",
  "cascade_effects": "Secondary/tertiary effects on concessions, restrooms, medical resources, etc.",
  "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "recommendation": "Whether to proceed with the scenario and key conditions to set before doing so"
}`;

    case 'communicator':
      return `You are an expert stadium communications officer at the FIFA World Cup 2026 command centre.

Current live sensor data:
${sensorStr}

Communication task: "${userInput}"

Generate audience-tailored messages for the same situation. Each message must use the appropriate language, formality, length, and call-to-action for its channel.

Respond with ONLY valid JSON — no markdown fences, no extra text:
{
  "summary": "One sentence describing what is being communicated",
  "security_radio": "Terse, code-based radio message for security team (max 40 words, include unit designations)",
  "public_pa": "Calm, clear public address announcement for fans (max 60 words, polite, no alarm language)",
  "social_media": "Engaging tweet/post for official stadium social media (max 280 chars, include relevant hashtags like #FIFAWorldCup2026)",
  "internal_chat": "Direct message for operations staff Slack/Teams channel (informal, include action items and who's responsible)"
}`;

    case 'debrief':
      return `You are an expert stadium operations debrief analyst at the FIFA World Cup 2026 command centre.

The attached image shows the current crowd density visualisation (representative of recent conditions).

Current live sensor data:
${sensorStr}

Debrief request: "${userInput}"

Generate a comprehensive after-action review. Base your analysis on the sensor data provided, infer realistic operational events, and provide genuine lessons learned that would help improve future events.

Respond with ONLY valid JSON — no markdown fences, no extra text:
{
  "report": "Executive summary paragraph (4–6 sentences covering overall operation, major events, and outcomes)",
  "key_incidents": [
    "Incident 1: description with time, location, and resolution",
    "Incident 2: description",
    "Incident 3: description"
  ],
  "decisions_made": [
    "Decision 1: what was decided and why",
    "Decision 2: what was decided and why"
  ],
  "lessons_learned": [
    "Lesson 1: specific, actionable improvement for next event",
    "Lesson 2: specific, actionable improvement",
    "Lesson 3: specific, actionable improvement"
  ],
  "performance_score": <number 0–100>,
  "next_event_recommendations": "2–3 sentence summary of top priorities for future events"
}`;

    default:
      return `You are a stadium operations AI assistant. Current sensor data: ${sensorStr}. User query: "${userInput}". Respond with a valid JSON object containing a "summary" field.`;
  }
}

function cleanAndParse(text) {
  let cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
  return JSON.parse(cleaned);
}

/**
 * Calls Gemini directly, bypassing any backend proxy.
 * Pushes results back into the shared RxJS subjects.
 *
 * @param {{ mode: string, imageBase64: string|null, sensorData: object|null, userInput: string }} params
 */
export const callGemini = ({ mode, imageBase64, sensorData, userInput }) => {
  const request$ = from(
    (async () => {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('VITE_GEMINI_API_KEY environment variable is not set in .env');
      }

      const prompt = buildPrompt(mode, sensorData, userInput);
      const parts = [];

      if (imageBase64 && imageBase64.length > 100) {
        const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, "");
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64,
          },
        });
      }

      parts.push({ text: prompt });

      const geminiPayload = {
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.4,
          topP: 0.85,
          maxOutputTokens: 1500,
        },
      };

      let lastError = '';

      for (const model of MODELS) {
        const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;

        try {
          const geminiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload),
          });

          if (geminiRes.status === 429) {
            console.warn(`[Gemini] ${model} quota exhausted, trying next model...`);
            lastError = `${model} quota exhausted (429)`;
            continue;
          }

          if (!geminiRes.ok) {
            const errBody = await geminiRes.text();
            console.error(`[Gemini API error] ${model}`, geminiRes.status, errBody.slice(0, 300));
            throw new Error(`${model} returned HTTP ${geminiRes.status}: ${errBody.slice(0, 150)}`);
          }

          const geminiData = await geminiRes.json();
          const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

          if (!rawText) {
            lastError = `${model} returned an empty response`;
            console.warn('[Gemini] Empty response from', model);
            continue;
          }

          try {
            const parsed = cleanAndParse(rawText);
            console.log(`[Gemini] Success using ${model}`);
            return parsed;
          } catch (parseErr) {
            console.error('[JSON parse error]', model, parseErr.message, '\nRaw:', rawText.slice(0, 400));
            throw new Error(`Gemini (${model}) response was not valid JSON. Snippet: ${rawText.slice(0, 150)}`);
          }
        } catch (networkErr) {
          console.error(`[Network error] ${model}:`, networkErr.message);
          lastError = `Network error with ${model}: ${networkErr.message}`;
          continue;
        }
      }

      console.warn('[Gemini] All models failed. Falling back to Moondream...');
      
      const moondreamKey = import.meta.env.VITE_MOONDREAM_API_KEY;
      if (!moondreamKey) {
        throw new Error('All Gemini models failed and VITE_MOONDREAM_API_KEY is not set for fallback.');
      }

      // Restore data URI prefix if it's missing or use original
      let moondreamImageUrl = imageBase64;
      if (moondreamImageUrl && !moondreamImageUrl.startsWith('data:image')) {
        moondreamImageUrl = `data:image/jpeg;base64,${moondreamImageUrl}`;
      }

      const moondreamPayload = {
        model: "moondream3.1-9B-A2B",
        question: prompt
      };
      
      if (moondreamImageUrl && moondreamImageUrl.length > 100) {
        moondreamPayload.image_url = moondreamImageUrl;
      }

      try {
        const moonRes = await fetch('https://api.moondream.ai/v1/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Moondream-Auth': moondreamKey
          },
          body: JSON.stringify(moondreamPayload)
        });

        if (!moonRes.ok) {
          const errBody = await moonRes.text();
          throw new Error(`Moondream returned HTTP ${moonRes.status}: ${errBody.slice(0, 150)}`);
        }

        const moonData = await moonRes.json();
        const moonRawText = moonData?.answer ?? '';
        
        if (!moonRawText) {
          throw new Error('Moondream returned an empty response');
        }

        try {
          const parsed = cleanAndParse(moonRawText);
          console.log('[Moondream] Success');
          return parsed;
        } catch (parseErr) {
          console.error('[JSON parse error]', parseErr.message, '\nRaw:', moonRawText.slice(0, 400));
          throw new Error(`Moondream response was not valid JSON. Snippet: ${moonRawText.slice(0, 150)}`);
        }
      } catch (moonErr) {
        throw new Error(`All Gemini models failed, and Moondream fallback also failed: ${moonErr.message}`);
      }
    })()
  ).pipe(
    catchError((err) => {
      const msg = err.message || 'Unknown network error occurred.';
      errorSubject.next(msg);
      loadingSubject.next(false);
      return throwError(() => err);
    })
  );

  request$.subscribe({
    next: (data) => {
      aiResponseSubject.next({ mode, data });
      loadingSubject.next(false);
    },
    error: () => {
      // errorSubject already updated in catchError
    },
  });

  return request$;
};
