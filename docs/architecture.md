# AdForge AI - System Architecture

## Architecture Overview
AdForge AI is organized as a production-grade full-stack studio. It combines a high-performance React frontend with an Express + Node.js backend executing `@google/genai` model pipelines and media processing utilities.

```
Client (Browser)
    │  - React 19 SPA + Vite
    │  - Real-time Pipeline Tracker
    │  - Storyboard Deck + Frame Inspector
    │  - Video Player with Scene Markers & Scrubber
    │  - Conversational Video Editor Chat
    │  - Adaptive Audio Scoring Studio
    │  - Timeline Cue Sheet
    ▼
Express API Router (`/api/*`)
    │
    ├── Providers Layer
    │     ├── `planner.ts`: Gemini 3.8 Flash structured decomposition
    │     ├── `image.ts`: Nano Banana 2 Lite (`gemini-3.1-flash-lite-image`)
    │     ├── `video.ts`: Gemini Omni Flash (`gemini-omni-1.1-flash`)
    │     └── `audio.ts`: Lyria 3.5 (`lyria-3-clip-preview`)
    │
    ├── Services
    │     ├── `storage.ts`: S3-compatible asset storage & local fallback
    │     ├── `database.ts`: Non-destructive relational JSON database
    │     ├── `composer.ts`: FFmpeg 6+ media composition engine
    │     └── `jobQueue.ts`: Asynchronous job orchestration
    │
    └── Background Media Storage (`/data/storage/*`)
```

## Security Model
- No client-side API keys: Browser only interacts with server proxy routes (`/api/*`).
- FFmpeg argument sanitization: Invoked with argument lists rather than raw shell strings to prevent command injection.
- Atomic file persistence: Disk writes use temporary files and atomic rename operations.
