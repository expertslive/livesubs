# LiveSubs

Real-time subtitling app for **Experts Live** IT conferences. Captures audio from a microphone or virtual audio device, transcribes speech using Azure Cognitive Services, optionally translates between English and Dutch, and displays configurable subtitles on a chroma-key green screen.

Built for multi-hour live events with automatic reconnection, device disconnect detection, screen wake lock, and session transcript export.

![Experts Live](static/logo.png)

## Architecture

```mermaid
graph LR
    A[Microphone / HDMI Audio] -->|Web Audio API| B[Browser]
    B -->|WebSocket| C[Azure Speech SDK]
    C -->|Partial + Final text| B
    B --> D[Green-Screen Subtitle Output]
    B --> E[Config Panel + Preview]

    subgraph Azure Cognitive Services
        C --> F[Speech-to-Text]
        F -->|if translation needed| G[Translation]
    end
```

### Recognizer Selection

The app chooses the optimal Azure recognizer based on language configuration:

```mermaid
flowchart TD
    A[User presses Start] --> B{Source and target\nsame language?}
    B -->|Yes or no target| C[SpeechRecognizer]
    B -->|No| D[TranslationRecognizer]
    C --> E[Lower latency, lower cost]
    D --> F[STT + translation in one pipeline]
    E --> G[PhraseListGrammar loaded]
    F --> G
    G --> H[recognizing → partial text]
    G --> I[recognized → final line]
    H --> J[Subtitle Display]
    I --> J
```

### Data Flow

```mermaid
flowchart LR
    subgraph Stores
        S1[settings store]
        S2[style store]
        S3[subtitles store]
    end

    subgraph Services
        SP[speech.ts]
        AU[audio.ts]
        RC[reconnection.ts]
        TR[transcript.ts]
        WL[wakelock.ts]
        DM[demo.ts]
    end

    S1 -->|Azure key, language,\nphrases, device| SP
    SP -->|partial text,\nfinal lines, status| S3
    SP -->|final lines| TR
    AU -->|audio level| S3
    RC -->|reconnect on failure| SP
    S2 --> SD[SubtitleDisplay]
    S3 --> SD
    DM -->|simulated text| S3

    S1 -.->|persisted| LS[(localStorage)]
    S2 -.->|persisted| LS
    TR -.->|export| DL[TXT / SRT download]
```

### Reconnection Flow

When Azure disconnects mid-session, the app automatically recovers:

```mermaid
stateDiagram-v2
    [*] --> Disconnected
    Disconnected --> Connecting: Start
    Connecting --> Connected: sessionStarted
    Connecting --> Error: auth / bad request
    Connected --> Reconnecting: transient error / session lost
    Reconnecting --> Connecting: backoff timer fires
    Reconnecting --> Error: max retries (10) exceeded
    Connected --> Disconnected: Stop
    Error --> Disconnected: Stop
    Reconnecting --> Disconnected: Stop

    note right of Reconnecting
        Exponential backoff
        1s → 2s → 4s → 8s → 16s → 30s cap
    end note
```

### Device Disconnect Handling

```mermaid
flowchart TD
    A[USB mic unplugged] --> B{Detection method}
    B -->|MediaStreamTrack ended| C[Track ended event]
    B -->|Device list changed| D[devicechange event\n500ms debounce]
    D --> E{Selected device\nstill present?}
    E -->|No| F[Set error status]
    E -->|Yes| G[No action]
    C --> F
    F --> H[Stop recognition]
    H --> I[Operator reconnects\ndevice and restarts]
```

## Tech Stack

| Component | Choice |
|-----------|--------|
| Framework | SvelteKit + TypeScript |
| Styling | Tailwind CSS v4 |
| Speech-to-text | Azure Cognitive Services Speech SDK |
| Translation | Azure Speech Translation (same SDK) |
| Architecture | Browser-direct — no backend server |
| Hosting | Azure Static Web Apps |
| State | Svelte writable stores + localStorage |

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── SubtitleDisplay.svelte    # Styled subtitle renderer (preview + fullscreen)
│   │   ├── ConfigPanel.svelte        # Main config UI (Experts Live branded)
│   │   ├── StatusIndicator.svelte    # Activity/health dot overlay
│   │   ├── AudioDeviceSelector.svelte
│   │   ├── StyleControls.svelte      # Font, size, color, outline, position
│   │   └── PhraseListEditor.svelte   # IT terminology phrase list
│   ├── stores/
│   │   ├── settings.ts               # Azure key, region, languages, device, phrases
│   │   ├── subtitles.ts              # Lines buffer, partial text, status, audio level
│   │   └── style.ts                  # Font, size, color, outline, position, maxLines
│   ├── services/
│   │   ├── speech.ts                 # Azure Speech SDK wrapper
│   │   ├── audio.ts                  # Device enumeration, VU meter, disconnect detection
│   │   ├── reconnection.ts           # Auto-reconnect with exponential backoff
│   │   ├── transcript.ts             # Session recording + TXT/SRT export
│   │   ├── wakelock.ts               # Screen Wake Lock API wrapper
│   │   └── demo.ts                   # Demo mode with canned conference text
│   └── utils/
│       └── phrases.ts                # ~90 default IT/cloud/Azure terms
├── routes/
│   ├── +page.svelte                  # Single page: config ↔ fullscreen toggle
│   ├── +layout.svelte
│   └── +layout.ts                    # SSR disabled, prerender enabled
├── app.css                           # Tailwind v4 + Experts Live CSS variables
└── app.html
```

## Getting Started

### Prerequisites

- Node.js 22+
- An [Azure Speech Services](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/) resource (S0 or free tier)

### Install and Run

```sh
npm install
npm run dev
```

Open the app in your browser, then:

1. Enter your **Azure Speech key** and **region** (e.g. `westeurope`)
2. Select an **audio input** device
3. Choose **source language** and optional **translation target**
4. Press **Start** — speak into the mic and see subtitles appear
5. Press **F** or the **Fullscreen** button for green-screen output

### Demo Mode

To test the app without Azure credentials, click the **Demo** button. This feeds canned conference text through the subtitle display at realistic typing speeds, simulating partial-to-final transitions. Demo mode does not require an Azure key or microphone.

### Build for Production

```sh
npm run build
```

Output is written to `build/` — a fully static site ready for any static host.

## Usage

### Config Panel

The left sidebar contains all settings:

- **Azure Speech** — subscription key and region
- **Language** — source language (English, Dutch, German, French, Spanish) and optional translation target
- **Audio Input** — select microphone or virtual audio device
- **Subtitle Style** — font, size, color, text outline, position, alignment, max lines
- **Phrase List** — IT terminology that boosts recognition accuracy (pre-loaded with ~90 Azure/cloud/DevOps terms)

### Controls

| Button | Action |
|--------|--------|
| **Start** | Begin recognition session (connects to Azure, acquires wake lock, starts transcript) |
| **Stop** | End session (disconnects, releases resources) |
| **Demo** | Run demo mode with sample text (no Azure key needed) |
| **Clear** | Clear displayed subtitles |
| **Export** | Download session transcript as TXT or SRT |
| **Fullscreen** | Enter green-screen output mode |

### Fullscreen Green Screen

Press **F** or click **Fullscreen** to enter chroma-key mode:

- Pure `#00FF00` green background
- Only subtitles are visible (no UI chrome)
- Designed for OBS/vMix chroma key into a video feed
- Press **Escape** to return to config

### Status Indicator

A small dot overlay appears in the top-right corner of the subtitle display:

| Color | Meaning |
|-------|---------|
| Green (pulsing) | Connected, speech activity within last 5 seconds |
| Amber (steady) | Connected, but no speech detected for 5+ seconds |
| Red (blinking) | Error or reconnecting |
| Hidden | Disconnected |

### Transcript Export

Every recognized line is recorded with a timestamp during the session. Click **Export** to download:

- **TXT** — timestamped plain text (`[HH:MM:SS] text`)
- **SRT** — standard subtitle format (compatible with video editors)

The entry count is shown on the Export button.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `F` | Toggle fullscreen green screen |
| `Escape` | Exit fullscreen |

## Production Hardening

Features designed for reliability during multi-hour live conferences:

- **Auto-reconnection** — transient network errors trigger exponential backoff reconnection (1s to 30s, max 10 attempts). Authentication and permission errors are not retried.
- **Device disconnect detection** — unplugging a USB mic is detected via `MediaStreamTrack.ended` events and `devicechange` listeners. Recognition is stopped with a clear error message.
- **Screen Wake Lock** — prevents the OS from sleeping the display during a session. Automatically re-acquires the lock when the tab regains visibility.
- **Tab visibility handling** — when the browser tab is backgrounded and restored, the audio context is automatically resumed to prevent VU meter stalls.
- **Partial text overflow fix** — when partial (in-progress) text is present, one line slot is reserved for it so the display never exceeds the configured `maxLines`.
- **Derived connection state** — the Start/Stop button state is derived directly from the subtitle store's `connectionStatus`, eliminating UI desync if recognition fails to start.

## Deployment

### Azure Static Web Apps

The repo includes a GitHub Actions workflow (`.github/workflows/azure-static-web-apps.yml`).

1. Create an Azure Static Web App resource
2. Add the deployment token as `AZURE_STATIC_WEB_APPS_API_TOKEN` in GitHub repo secrets
3. Push to `main` — the workflow builds and deploys automatically

### Estimated Costs

| Service | Cost |
|---------|------|
| Azure Speech (STT) | ~$1.00/hour |
| Azure Speech Translation | ~$2.50/hour |
| Azure Static Web Apps | Free tier or ~$9/month |
| **Per 1-hour event** | **~$1.00–$2.50** |

## License

See [LICENSE](LICENSE).
