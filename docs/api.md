# AdForge AI - API Specification

## Endpoints Summary

### System & Diagnostic
- `GET /api/health`: Health status & verified AI model configuration.

### Projects & Briefs
- `GET /api/projects`: List all creative projects.
- `POST /api/projects`: Initialize a project with brief, audience, and duration.
- `GET /api/projects/:id`: Fetch complete creative state (plan, scenes, versions, edits).
- `PATCH /api/projects/:id`: Update project metadata or Visual Bible.
- `DELETE /api/projects/:id`: Delete project and cascade-remove assets.

### Creative Planner
- `POST /api/projects/:id/plan`: Invoke Gemini 3.8 Flash to synthesize structured Creative Plan & Visual Bible.

### Storyboard Visuals (Nano Banana 2 Lite)
- `POST /api/scenes/:id/generate`: Render or regenerate single scene frame with context.
- `POST /api/projects/:id/storyboard/generate-all`: Batch render all unlocked scenes.
- `PATCH /api/scenes/:id`: Update scene attributes (title, description, camera, lighting, lock).

### Video Engine (Gemini Omni Flash)
- `POST /api/projects/:id/video/generate`: Synthesize Video Cut v1 using approved frames.
- `POST /api/projects/:id/video/edit`: Execute conversational video edit creating Video Cut v2, v3...
- `GET /api/projects/:id/video/versions`: List all video cuts.
- `POST /api/projects/:id/video/restore`: Switch active video cut.

### Soundtrack Scoring (Lyria 3.5)
- `POST /api/projects/:id/audio/generate`: Score adaptive soundtrack matching timeline energy curve.
- `GET /api/projects/:id/audio/versions`: List scored audio versions.

### Final Media Composition (FFmpeg)
- `POST /api/projects/:id/export`: Render synchronized MP4 commercial via FFmpeg.
- `GET /api/projects/:id/exports`: List final export renders.

### Media Storage
- `GET /api/storage/:subfolder/:filename`: Serve stored media assets (images, audio, video).
