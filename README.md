# AdForge AI - Multimodal AI Creative Production Studio

AdForge AI is a multimodal AI commercial production platform designed for creative pipelines. Rather than operating as three disconnected generators, AdForge AI connects brief decomposition, visual asset grounding, continuous video synthesis, conversational video editing, adaptive soundtrack scoring, and media composition into a single creative workflow.

```text
Creative Brief
      ↓
AI Creative Planner (gemini-3.8-flash)
      ↓
Storyboard (4-5 Scenes)
      ↓
Nano Banana 2 Lite (gemini-3.1-flash-lite-image)
      ↓
Visual Assets & Grounded Frames
      ↓
Gemini Omni Flash (gemini-omni-1.1-flash)
      ↓
Video Version 1 (v1)
      ↓
Conversational AI Video Editing (Multi-turn Interactions API)
      ↓
Video Version 2 (v2, preserving Visual Bible & untouched scenes)
      ↓
Lyria 3.5 (lyria-3-clip-preview / lyria-3.5)
      ↓
Adaptive Timeline Soundtrack (Audio v1, Audio v2)
      ↓
FFmpeg Media Composition
      ↓
Broadcast-Ready Advertisement (MP4)
```

---

## Key Differentiator: Cross-Modal Continuity

In standard AI applications, image models, video models, and audio tools operate in complete isolation. AdForge AI anchors every generation step in the **Creative State**:
1. **Creative Plan**: Converts high-level user briefs into structured scene sequences, shot timings, and camera language.
2. **Visual Bible**: Stores persistent hero product designs, recurring characters, key environments, color palettes, and lighting architecture.
3. **Conversational Video Revisions**: Gemini Omni Flash uses the Interactions API with `previous_interaction_id`, allowing users to say:
   > *"Make scene 2 darker and give the camera a low-angle movement while keeping the motorcycle design unchanged."*
   The system generates **Video Cut v2**, updating only the targeted scene while strictly retaining established hero assets.
4. **Adaptive Soundtrack**: Lyria 3.5 scores music that crescendos precisely along the scene energy curve (e.g. accelerating during high-speed scenes).
5. **Real Composition**: Server-side `/usr/bin/ffmpeg` multiplexes the synthesized video and adaptive audio into a final, web-optimized MP4 with audio normalization.

---

## AI Models & Official API Allocations

| Pipeline Stage | Model Identifier | SDK / API Surface |
| :--- | :--- | :--- |
| **Creative Planner** | `gemini-3.8-flash` | `@google/genai` `ai.models.generateContent` with JSON schema |
| **Storyboard Visuals** | `gemini-3.1-flash-lite-image` (Nano Banana 2 Lite) | `@google/genai` with `imageConfig: { aspectRatio: "16:9" }` |
| **Video Synthesis & Edits** | `gemini-omni-1.1-flash` (Gemini Omni Flash) | `@google/genai` `ai.interactions.create` with `store: true` & `previous_interaction_id` |
| **Adaptive Scoring** | `lyria-3-clip-preview` / `lyria-3.5` (Lyria 3.5) | `@google/genai` `ai.models.generateContentStream` with `[Modality.AUDIO]` |
| **Media Composition** | FFmpeg 6+ | Server-side `/usr/bin/ffmpeg` video/audio multiplexer |

---

## Quickstart & Local Development

### 1. Requirements
- Node.js 18+
- FFmpeg (`which ffmpeg`)
- Valid Gemini API key configured in AI Studio Secrets

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `GEMINI_API_KEY` is present.

### 3. Run Development Server
```bash
npm run dev
```
The server will start on port `3000` (`http://localhost:3000`).

---

## Architecture & Documentation
- [System Architecture](docs/architecture.md)
- [AI Pipeline & Context Flow](docs/ai-pipeline.md)
- [API Reference](docs/api.md)
- [Deployment Guide](docs/deployment.md)
