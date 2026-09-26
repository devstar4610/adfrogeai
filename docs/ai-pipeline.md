# AdForge AI - Multimodal Pipeline & Context Flow

## The Semantic Context Engine
AdForge AI prevents hallucination and visual drift by propagating a persistent creative context across every stage.

```
Creative Brief: "Create a 20-second cinematic ad for a futuristic electric motorcycle..."
      │
      ▼
Creative Planner (`gemini-3.8-flash`)
   Produces:
   1. CreativePlan (Scene breakdowns, camera moves, lighting cues, duration: 20s)
   2. VisualBible (VoltX Motorcycle: matte obsidian, cyan LED accents, cyberpunk streets)
      │
      ▼
Storyboard Frames (`gemini-3.1-flash-lite-image` / Nano Banana 2 Lite)
   Receives:
   CreativePlan + VisualBible + Scene Subject + Camera Framing + Lighting
   Produces:
   Photorealistic 16:9 still frames for Scene 1 through Scene 5
      │
      ▼
Video Synthesis (`gemini-omni-1.1-flash` / Gemini Omni Flash)
   Receives:
   VisualBible + Storyboard Reference Frames (base64 image payloads) + Shot List
   Produces:
   Video Cut v1 (Continuous commercial)
      │
      ▼
Conversational Video Editing (`gemini-omni-1.1-flash` via Interactions API)
   User: "Make scene 2 darker and give the camera a low-angle movement while keeping motorcycle unchanged."
   Receives:
   previous_interaction_id + Target Scene 2 + Continuity Mandate
   Produces:
   Video Cut v2 (Revises only Scene 2, preserving established hero assets)
      │
      ▼
Adaptive Soundtrack (`lyria-3-clip-preview` / Lyria 3.5)
   Receives:
   Campaign Mood + Scene Timing + Energy Level Curve (low → build → climax)
   Produces:
   Adaptive commercial soundtrack (Audio v1, Audio v2)
      │
      ▼
FFmpeg Media Multiplexer
   Combines Video Cut v2 + Audio Score v2 into broadcast MP4.
```
