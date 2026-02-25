# LiveSubs

Real-time subtitling app for **Experts Live** IT conferences. Captures audio from a microphone or virtual audio device, transcribes speech using Azure Cognitive Services, optionally translates between languages, and displays configurable subtitles on a chroma-key green screen.

Built for multi-hour live events with automatic reconnection, device disconnect detection, screen wake lock, session transcript export, and operator-friendly features like keyboard shortcuts, shareable config URLs, and settings presets.

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
    A[User presses Start] --> AA{Source language\n= auto?}
    AA -->|Yes| AB[AutoDetectSourceLanguageConfig\nfrom candidate languages]
    AA -->|No| B
    AB --> B{Target language\ndiffers from source?}
    B -->|Yes or auto source| D[TranslationRecognizer]
    B -->|Same or no target| C[SpeechRecognizer]
    C --> E[Lower latency, lower cost]
    D --> F[STT + translation in one pipeline]
    E --> G[PhraseListGrammar loaded\n+ profanity filter applied]
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
        S4[presets store]
    end

    subgraph Services
        SE[session.ts]
        SP[speech.ts]
        AU[audio.ts]
        RC[reconnection.ts]
        TR[transcript.ts]
        WL[wakelock.ts]
        DM[demo.ts]
    end

    subgraph Utils
        UP[url-params.ts]
    end

    SE -->|orchestrates start/stop| SP
    SE -->|audio monitor| AU
    SE -->|enable/disable| RC
    SE -->|wake lock| WL
    SE -->|start session| TR
    SE -->|session timer| S3

    S1 -->|Azure key, language,\nphrases, device, profanity| SP
    SP -->|partial text,\nfinal lines, status| S3
    SP -->|final lines| TR
    AU -->|audio level| S3
    RC -->|reconnect on failure| SP
    S2 --> SD[SubtitleDisplay]
    S3 --> SD
    DM -->|simulated text| S3

    UP -->|apply URL params| S1
    UP -->|apply URL params| S2
    S4 -->|load preset| S1
    S4 -->|load preset| S2

    S1 -.->|persisted| LS[(localStorage)]
    S2 -.->|persisted| LS
    S4 -.->|persisted| LS
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

### Session Lifecycle

The `session.ts` service centralizes session management, ensuring consistent behavior whether triggered by the UI button, keyboard shortcut, or device disconnect:

```mermaid
flowchart TD
    A[Start Session] --> B[Start transcript session]
    B --> C[Set session timer start]
    C --> D[Enable auto-reconnect]
    D --> E[Create audio level monitor]
    E --> F[Watch for device changes]
    F --> G[Acquire wake lock]
    G --> H[Start speech recognition]

    I[Stop Session] --> J[Disable auto-reconnect]
    J --> K[Release wake lock]
    K --> L[Stop speech recognition]
    L --> M[Reset session timer]
    M --> N[Stop device watcher]
    N --> O[Stop audio monitor]
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
│   │   ├── SubtitleDisplay.svelte    # Styled subtitle renderer with entry animations
│   │   ├── ConfigPanel.svelte        # Main config UI (Experts Live branded)
│   │   ├── StatusIndicator.svelte    # Activity/health dot overlay
│   │   ├── AudioDeviceSelector.svelte
│   │   ├── StyleControls.svelte      # Font, size, color, outline, position, animation
│   │   ├── PhraseListEditor.svelte   # IT terminology phrase list
│   │   └── PresetManager.svelte      # Save/load named configuration presets
│   ├── stores/
│   │   ├── settings.ts               # Azure key, region, languages, device, phrases, profanity
│   │   ├── subtitles.ts              # Lines buffer, partial text, status, audio level, timer
│   │   ├── style.ts                  # Font, size, color, outline, position, maxLines, animation
│   │   └── presets.ts                # Named configuration presets (localStorage-persisted)
│   ├── services/
│   │   ├── session.ts                # Session lifecycle (start/stop orchestration)
│   │   ├── speech.ts                 # Azure Speech SDK wrapper + auto-detect + profanity
│   │   ├── audio.ts                  # Device enumeration, VU meter, disconnect detection
│   │   ├── reconnection.ts           # Auto-reconnect with exponential backoff
│   │   ├── transcript.ts             # Session recording + TXT/SRT export
│   │   ├── wakelock.ts               # Screen Wake Lock API wrapper
│   │   └── demo.ts                   # Demo mode with canned conference text
│   └── utils/
│       ├── phrases.ts                # ~90 default IT/cloud/Azure terms
│       └── url-params.ts             # URL query parameter read/write for shareable URLs
├── routes/
│   ├── +page.svelte                  # Single page: config ↔ fullscreen toggle + shortcuts
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
3. Choose **source language** (or **Auto-detect**) and optional **translation target**
4. Press **Start** (or **Space**) — speak into the mic and see subtitles appear
5. Press **F** or the **Fullscreen** button for green-screen output

Alternatively, open a pre-configured URL (see [URL Parameters](#url-parameters)) or load a saved preset.

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

- **Presets** — save and load named configurations for recurring rooms/events
- **Azure Speech** — subscription key and region
- **Language** — source language (English, Dutch, German, French, Spanish, or **Auto-detect**), optional translation target, and profanity filter (Masked/Removed/Raw)
- **Audio Input** — select microphone or virtual audio device
- **Subtitle Style** — font, size, color, text outline, position, alignment, max lines, and entry animation (None/Fade/Slide)
- **Phrase List** — IT terminology that boosts recognition accuracy (pre-loaded with ~90 Azure/cloud/DevOps terms)
- **Copy URL** — button in the header copies a shareable URL with current settings (Shift+click to include the Azure key)

### Controls

| Button | Shortcut | Action |
|--------|----------|--------|
| **Start** | `Space` | Begin recognition session (connects to Azure, acquires wake lock, starts transcript, starts session timer) |
| **Stop** | `Space` | End session (disconnects, releases resources, stops timer) |
| **Demo** | | Run demo mode with sample text (no Azure key needed) |
| **Clear** | `C` | Clear displayed subtitles |
| **Export** | | Download session transcript as TXT or SRT |
| **Fullscreen** | `F` | Enter green-screen output mode |

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

All shortcuts are disabled when focus is in a text input, select, or textarea.

| Key | Action |
|-----|--------|
| `Space` | Toggle Start / Stop recognition |
| `C` | Clear subtitles |
| `F` | Toggle fullscreen green screen |
| `Escape` | Exit fullscreen |

### URL Parameters

Pre-configure the app via URL query parameters — useful for bookmarking per-room setups or sharing with operators:

| Parameter | Maps to | Example |
|-----------|---------|---------|
| `region` | Azure region | `westeurope` |
| `source` | Source language | `nl-NL`, `auto` |
| `target` | Target language | `en` |
| `device` | Audio device ID | (device-specific) |
| `key` | Azure Speech key | (stripped from URL after loading) |
| `font` | Font family | `Arial, sans-serif` |
| `fontSize` | Font size | `48` |
| `maxLines` | Max subtitle lines | `2` |
| `position` | Subtitle position | `top`, `center`, `bottom` |
| `align` | Text alignment | `left`, `center`, `right` |

Example: `https://your-app.com/?region=westeurope&source=nl-NL&target=en&fontSize=56`

The `key` parameter is automatically removed from the browser address bar after loading to prevent accidental leaking in screenshots or bookmarks.

### Settings Presets

Save named configurations for recurring events or multi-room setups:

1. Configure all settings as desired
2. Expand the **Presets** section in the sidebar
3. Enter a name (e.g. "Main Stage EN→NL") and click **Save**
4. To restore: click **Load** on any saved preset

Presets persist across browser sessions via localStorage. The Azure key is excluded from presets for security.

### Auto-detect Source Language

When **Auto-detect** is selected as the source language, Azure automatically identifies which language is being spoken from a list of candidate languages. This is useful at multilingual conferences where speakers may switch between languages mid-session.

Select at least 2 candidate languages from the checkbox list that appears. More candidates may slightly increase latency.

### Profanity Filter

Controls how Azure handles profanity in recognized speech:

| Mode | Behavior |
|------|----------|
| **Masked** (default) | Profanity replaced with `***` |
| **Removed** | Profanity silently dropped |
| **Raw** | No filtering applied |

### Subtitle Animations

Subtitle lines can animate in rather than appearing instantly:

| Mode | Effect |
|------|--------|
| **None** | Instant appearance |
| **Fade** (default) | 200ms fade in |
| **Slide** | 250ms slide up with fade |

Partial (in-progress) text is never animated since it updates too frequently.

### Session Timer

When a session is running, the status bar displays elapsed time in `HH:MM:SS` format next to the connection indicator. The timer resets on each new session start and disappears when the session stops. Useful for tracking conference slot durations and estimating Azure costs.

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
