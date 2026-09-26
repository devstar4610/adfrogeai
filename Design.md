# AdForge AI - System Architecture & Design Specification

## 1. System Overview
AdForge AI is a multimodal AI creative production studio. It unifies creative brief decomposition, storyboard visual asset generation, continuous video synthesis, conversational video editing, adaptive music scoring, and final media composition into a single coherent workflow.

The core differentiator is **cross-modal continuity**: every downstream AI operation (image, video, edit, audio) consumes the persistent creative state (Creative Brief, Creative Plan, Visual Bible, Scene Timeline, and Version History).

```
Creative Brief
      ↓
AI Creative Planner (gemini-3.8-flash)
      ↓
Structured Creative Plan + Visual Bible
      ↓
Nano Banana 2 Lite (gemini-3.1-flash-lite-image)
      ↓
Storyboard Visual Assets
      ↓
Gemini Omni Flash (gemini-omni-1.1-flash)
      ↓
Video Version 1 (v1)
      ↓
Conversational AI Video Editor (Interactions API with previous_interaction_id)
      ↓
Video Version 2 (v2, preserving visual bible & untouched scenes)
      ↓
Lyria 3.5 (lyria-3-clip-preview / lyria-3.5)
      ↓
Adaptive Soundtrack (Audio v1, Audio v2 based on timeline energy)
      ↓
FFmpeg Media Engine
      ↓
Final Composed Creative (MP4 with synchronized audio & video)
```

## 2. Model Allocations & Verification
- **Creative Planning & Context Parser**: `gemini-3.8-flash` with structured JSON schema (`responseMimeType: "application/json"`).
- **Rapid Visual Asset & Storyboard Generation**: Nano Banana 2 Lite (`gemini-3.1-flash-lite-image`) using `@google/genai` SDK. Supports aspect ratios `16:9`, `9:16`, `1:1`.
- **Video Synthesis & Conversational Editing**: Gemini Omni Flash (`gemini-omni-1.1-flash`) via the Interactions API (`ai.interactions.create`). Supports starting images, reference image collections, and multi-turn conversational video revisions using `previous_interaction_id`.
- **Adaptive Soundtrack Scoring**: Lyria 3.5 / Lyria Clip (`lyria-3-clip-preview` and `lyria-3.5`) via streaming audio generation with mood and intensity curve matching.
- **Media Composition**: Server-side `/usr/bin/ffmpeg` for video/audio multiplexing, audio normalization, length alignment, and thumbnail extraction.

## 3. Data Models & Entities
- **Project**: Root container (`id`, `title`, `brief`, `target_audience`, `duration`, `visual_style`, `aspect_ratio`, `created_at`, `updated_at`).
- **CreativePlan**: Structured creative direction (`concept`, `audience`, `duration`, `tone`, `color_direction`, `camera_language`, `music_direction`, `scenes`).
- **VisualBible**: Visual consistency anchor (`characters`, `products`, `locations`, `visual_style`, `color_palette`, `lighting_style`, `camera_language`, `environment`).
- **Scene**: Storyboard unit (`id`, `project_id`, `scene_number`, `title`, `duration`, `description`, `subject`, `camera`, `lighting`, `transition`, `image_asset_id`, `is_locked`, `status`).
- **Asset**: Media item (`id`, `project_id`, `type: image | video | audio | export`, `url`, `mime_type`, `size`, `width`, `height`, `duration`, `provider`, `model`, `metadata`).
- **VideoVersion**: Immutable video iteration (`id`, `project_id`, `version_number`, `parent_version_id`, `interaction_id`, `user_instruction`, `video_asset_id`, `created_at`).
- **VideoEdit**: Chat-based edit action record (`id`, `project_id`, `video_version_id`, `instruction`, `target_scope`, `ai_interpretation`, `timestamp`).
- **AudioVersion**: Immutable soundtrack iteration (`id`, `project_id`, `version_number`, `parent_version_id`, `mood`, `energy_level`, `user_instruction`, `audio_asset_id`, `duration`, `created_at`).
- **Timeline**: Pacing and cue sheet (`duration`, `scenes: [{scene_id, start, end, energy}]`, `audio_track_id`, `video_track_id`).
- **Export**: Final rendered media record (`id`, `project_id`, `video_version_id`, `audio_version_id`, `asset_id`, `status`, `duration`, `resolution`, `created_at`).
- **GenerationJob**: Asynchronous work order (`id`, `project_id`, `type: plan | storyboard_image | video | video_edit | audio | composition`, `status: queued | processing | completed | failed`, `progress_message`, `error_message`, `result_data`, `created_at`, `updated_at`).

## 4. API Endpoints
- `POST /api/auth/session`: User session & workspace access.
- `GET /api/projects`: List projects.
- `POST /api/projects`: Create project from brief.
- `GET /api/projects/:id`: Get complete project creative state.
- `PATCH /api/projects/:id`: Update project metadata or visual bible.
- `DELETE /api/projects/:id`: Remove project.
- `POST /api/projects/:id/plan`: Generate or regenerate structured creative plan.
- `POST /api/projects/:id/storyboard/generate-all`: Trigger storyboard visual batch generation.
- `POST /api/scenes/:id/generate`: Generate/regenerate single scene image with visual bible context.
- `PATCH /api/scenes/:id`: Update scene attributes or lock status.
- `POST /api/projects/:id/video/generate`: Generate initial video v1 using Gemini Omni Flash.
- `POST /api/projects/:id/video/edit`: Conversational edit to create Video v2, v3... with context preservation.
- `GET /api/projects/:id/video/versions`: List all video iterations.
- `POST /api/projects/:id/audio/generate`: Generate adaptive soundtrack via Lyria.
- `GET /api/projects/:id/audio/versions`: List audio iterations.
- `POST /api/projects/:id/export`: Render final synchronized video + soundtrack via FFmpeg.
- `GET /api/jobs/:id`: Poll background job status.
- `GET /api/storage/:key`: Serve generated media assets safely.

## 5. Security & Reliability
- Zero client-side API keys; all `@google/genai` invocations run strictly on the backend.
- Request deduplication & idempotency on long-running AI jobs.
- Sanitized FFmpeg CLI arguments preventing arbitrary command injection.
- Non-destructive versioning guaranteeing previous AI creations are never erased.
