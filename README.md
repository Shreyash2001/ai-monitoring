# MatchPulse Ops - AI-Powered Stadium Intelligence

MatchPulse Ops is a next-generation, GenAI-enabled stadium operations platform built specifically for the FIFA World Cup 2026. The solution acts as a "co-pilot" for command centre operators, intelligently fusing real-time CCTV video feeds and simulated IoT sensor data (turnstiles, occupancy, security cameras) into actionable insights using advanced Multimodal Large Language Models (LLMs).

## Problem Statement Alignment

**The Challenge**: Build a GenAI-enabled solution that enhances stadium operations and the overall tournament experience for fans, organizers, volunteers, or venue staff during the FIFA World Cup 2026.

**Our Solution**: MatchPulse Ops directly addresses this by providing **real-time operational intelligence and decision support**. The system tackles key areas of stadium management:
- **Crowd Management & Navigation**: AI analyzes crowd density across gates from CCTV streams, identifies bottlenecks, and predicts clearance times to optimize fan ingress.
- **Incident Response**: When incidents are reported, the AI correlates visual density with sensor data to immediately draft actionable dispatch instructions and estimate resource requirements (e.g., medics, security).
- **Resource Optimization**: Dynamically recommends staff and volunteer reallocation to under-resourced gates.
- **Multilingual / Multi-Stakeholder Communication**: Automatically drafts tailored announcements for public address systems, social media, and internal radio based on real-time events.
- **Proactive What-If Simulations**: Allows operators to query hypothetical scenarios (e.g., "What if Gate 3 scanner fails?") and receive predicted cascading impacts.

## Chosen Vertical

**Vertical**: Stadium Operations & Event Management

MatchPulse Ops specifically targets the intense logistical challenges of managing ultra-large-scale events like the FIFA World Cup. By focusing on the stadium operations vertical, the solution empowers venue management, security teams, and fan experience coordinators to operate with unprecedented foresight and coordination.

## Approach and Logic

The core philosophy of MatchPulse Ops is **Multimodal Data Fusion**. 
Traditional stadium operations rely on disparate dashboards (CCTV on one screen, turnstile counts on another). MatchPulse Ops bridges this gap using Generative AI capable of understanding both visual and tabular data simultaneously.

The logic is built around a continuous sense-and-respond loop:
1. **Visual Context**: Extracting raw, real-time visual frames from CCTV feeds.
2. **Telemetry Context**: Capturing live IoT data (queue sizes, gate capacities, camera statuses).
3. **AI Reasoning**: Feeding both the visual frame (via Base64) and the telemetry payload (via JSON) into a multimodal LLM (Gemini 1.5 Flash / Moondream). 
4. **Structured Action**: Forcing the LLM to output highly structured JSON using strict prompting, which the React UI instantly parses into actionable, color-coded widgets, incident cards, and dispatch commands.

## How the Solution Works

1. **Data Ingestion**: 
   - A hidden `<canvas>` element continuously samples the active CCTV `<video>` feed at low resolution (320x180).
   - Simultaneously, an RxJS polling stream (`streams.js`) simulates and fetches live stadium IoT metrics (turnstile counts, occupancy percentages).
2. **User Interaction**: The command center operator selects a specific AI module (e.g., *Resource Optimizer* or *What-If Simulator*) from the sidebar and types a query (e.g., "Gate 3 is overflowing, where do we send staff?").
3. **Prompt Construction**: `geminiService.js` constructs a complex prompt that includes the operator's query, the JSON string of the IoT telemetry, and the base64-encoded CCTV frame.
4. **Inference & Fallback**: The payload is sent directly to the Gemini API. If Gemini hits rate limits or fails, the system automatically reconstructs the payload and queries the Moondream API.
5. **UI Update**: The AI returns a structured JSON string. The service strips any markdown formatting, parses the JSON, and pipes the data back into the RxJS `aiResponseSubject`.
6. **Rendering**: The active React module subscribes to this stream and instantly renders the AI's recommendations—such as updating staff allocation charts, flashing critical warnings, or drafting PA announcements.

## Assumptions Made

- **Availability of CCTV Feeds**: Assumes that modern stadiums have IP-based CCTV cameras capable of exposing video feeds (via WebRTC, HLS, or direct MP4 streams) that can be drawn to an HTML5 canvas.
- **Structured Sensor Data**: Assumes the venue possesses an IoT infrastructure (smart turnstiles, ticket scanners) capable of aggregating queue lengths and occupancy data into a centralized JSON API endpoint.
- **Real-Time Connectivity**: Assumes the command center operates on a high-bandwidth, low-latency network capable of supporting near real-time API calls to cloud AI providers.
- **CORS Configuration**: Assumes that the CCTV video feeds are served with appropriate Cross-Origin Resource Sharing (CORS) headers (`Access-Control-Allow-Origin: *`), allowing the client-side browser to extract canvas frames without security tainting. (If CORS fails, the app safely falls back to a synthetic heatmap).

## Architecture

The project is built around a modern, reactive frontend interacting directly with multimodal AI APIs.

- **Frontend Core**: React 18 powered by Vite. The UI mimics a high-tech command center HUD.
- **State Management**: Reactive streams using **RxJS** (`rxjs`). This decouple sensor polling and AI response cycles from React component renders, providing a highly performant, glitch-free UI.
- **AI Integration**:
  - **Google Gemini API**: Direct integration via `geminiService.js`. The app dynamically captures low-res frames from the active CCTV `<video>` element, pairs it with the latest JSON sensor payload, and sends it to the Gemini API (`gemini-1.5-flash` primarily).
  - **Fallback Chain**: The system implements an automatic fallback mechanism. If primary models are rate-limited, it cascades through `gemini-2.0-flash`, `gemini-2.0-flash-lite`, and finally gracefully falls back to the **Moondream API** (`moondream3.1-9B-A2B`).
- **Configuration**: Uses a local `cameras.json` to configure live video stream URLs mapped to physical stadium gates, allowing operators to seamlessly switch viewpoints.

## Code Quality

- **Modular Design**: The codebase is split into specific, single-responsibility components (`CCTVPlayer`, `TopBar`, `SensorPanel`) and domain-specific AI modules (`CrowdDensity.jsx`, `IncidentResponse.jsx`, etc.).
- **Reactive Hooks**: Custom hooks (`useObservable`) neatly bind RxJS observables to React state, ensuring components only render when their specific slice of data updates.
- **Centralized API Logic**: All prompt construction, JSON extraction, error handling, and model fallback logic is encapsulated within a single service layer (`geminiService.js`).
- **Resilience**: API responses are aggressively scrubbed (stripping markdown fences) and wrapped in try-catch blocks to ensure that malformed AI outputs never crash the application.

## Security

- **Environment Variables**: Sensitive API keys (Gemini, Moondream) are strictly managed via `.env` files (`VITE_GEMINI_API_KEY`, `VITE_MOONDREAM_API_KEY`) and excluded from source control (`.gitignore`).
- **CORS Handling**: The application natively handles Cross-Origin Resource Sharing (CORS) edge cases. Video feeds employ `crossOrigin="anonymous"` to avoid canvas tainting, allowing secure frame extraction without exposing cross-domain vulnerabilities.
- **Data Privacy**: Only heavily downscaled, compressed snapshot frames (at 35% JPEG quality) are transmitted to the AI APIs, minimizing bandwidth and potential PII exposure from high-res footage.

## Efficiency

- **Optimized Payloads**: Extracting frames directly from the `<canvas>` element at a low resolution (320x180) ensures the base64 payload remains under 25KB, leading to ultra-fast AI inference times and drastically reduced bandwidth costs.
- **Model Cascading**: By defaulting to `gemini-1.5-flash` and failing over to lighter/alternative models, the app guarantees high availability and rapid response times even during API rate limits.
- **Lazy Rendering**: Using a sidebar tab system means only the active AI module runs inference, conserving client-side resources and avoiding unnecessary concurrent API requests.
- **Synthetic Fallback**: If a video feed drops or faces strict CORS blocks, the system automatically generates a synthetic heatmap canvas representation of the crowd data and sends *that* to the AI, ensuring 100% operational uptime.

## Testing

- **Resilience Testing**: The multi-model fallback chain ensures graceful degradation. The system is designed to seamlessly recover from 429 (Rate Limit) and 5xx network errors.
- **Data Mocking**: The `streams.js` engine simulates realistic, fluctuating stadium sensor telemetry (e.g., varying queue lengths, capacities, online camera counts), allowing developers to rigorously test the AI's analytical capabilities without needing a physical stadium backend.
- **Strict Parsing Verification**: AI outputs are strictly mandated to be JSON. The `cleanAndParse` utility is tested against edge cases (trailing commas, unexpected markdown injections) to guarantee predictable UI states.

## Accessibility

- **Semantic HTML & ARIA**: Essential ARIA attributes are employed. For example, decorative scanlines, vignettes, and HUD overlays use `aria-hidden="true"`, while the main CCTV wrapper utilizes `role="img"` and an `aria-label`.
- **High Contrast Design**: The command center UI heavily leverages high-contrast colors—bright Electric Blue and FIFA Gold against a Deep Void background—making metrics readable in varied lighting conditions.
- **Clear Visual Hierarchy**: Color-coded severity systems (Green/Low, Amber/Medium, Red/High, Flashing Red/Critical) provide instant cognitive recognition for operators monitoring multiple systems simultaneously.
