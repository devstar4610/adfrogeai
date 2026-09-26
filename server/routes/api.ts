/**
 * AdForge AI - Central API Router
 * Dispatches all creative workspace requests: Project management, Creative Planning,
 * Storyboard image generation, Gemini Omni video synthesis & conversational edits,
 * Lyria adaptive soundtrack scoring, and FFmpeg media composition.
 */
import { Router, Request, Response } from 'express';
import fs from 'fs';
import crypto from 'crypto';
import { db, Project, Scene, VideoVersion, AudioVersion, ExportRecord, VideoEdit } from '../database';
import { plannerProvider } from '../providers/planner';
import { nanoBananaProvider } from '../providers/image';
import { geminiOmniVideoProvider } from '../providers/video';
import { lyriaAudioProvider } from '../providers/audio';
import { mediaComposer } from '../services/composer';
import { jobQueue } from '../services/jobQueue';
import { storage } from '../storage';

export const apiRouter = Router();

// ==========================================
// Health & Diagnostic
// ==========================================
apiRouter.get('/health', (_req: Request, res: Response) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: hasKey,
    models: {
      planner: 'gemini-3.8-flash',
      image: 'gemini-3.1-flash-lite-image',
      video: 'gemini-omni-1.1-flash',
      audio: 'lyria-3.5 / lyria-3-clip-preview',
    },
  });
});

// ==========================================
// Storage Serving (Streaming with Range Support)
// ==========================================
apiRouter.get('/storage/:subfolder/:filename', (req: Request, res: Response) => {
  try {
    const key = `${req.params.subfolder}/${req.params.filename}`;
    const filePath = storage.getFilePath(key);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(filePath, { acceptRanges: true }, (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ error: 'Failed to serve asset', details: err.message });
      }
    });
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(404).json({ error: 'Asset not found', details: err.message });
    }
  }
});

// ==========================================
// Projects
// ==========================================
apiRouter.get('/projects', async (_req: Request, res: Response) => {
  try {
    const projects = await db.listProjects();
    res.json({ projects });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/projects', async (req: Request, res: Response) => {
  try {
    const { title, brief, target_audience, duration, visual_style, aspect_ratio, brand_info } = req.body;

    if (!title || !brief) {
      return res.status(400).json({ error: 'Title and creative brief are required.' });
    }

    const defaultVisualBible = {
      characters: [],
      products: [],
      locations: [],
      visual_style: visual_style || 'Cinematic High-End Commercial',
      color_palette: ['#0A0A0A', '#1E3A8A', '#3B82F6', '#93C5FD'],
      lighting_style: 'Dramatic low-key cinematic lighting with high-contrast accents',
      camera_language: 'Dynamic 35mm anamorphic tracking shots with shallow depth of field',
      environment: 'Urban futuristic cityscape at twilight',
    };

    const project: Project = {
      id: crypto.randomUUID(),
      title,
      brief,
      target_audience: target_audience || 'Young urban professionals',
      duration: duration || 20,
      visual_style: visual_style || 'Cinematic, Futuristic',
      aspect_ratio: aspect_ratio || '16:9',
      brand_info,
      visual_bible: defaultVisualBible,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.saveProject(project);
    res.status(201).json({ project });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/projects/:id', async (req: Request, res: Response) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const scenes = await db.getScenesByProject(project.id);
    const videoVersions = await db.getVideoVersions(project.id);
    const videoEdits = await db.getVideoEdits(project.id);
    const audioVersions = await db.getAudioVersions(project.id);
    const exports = await db.getExports(project.id);

    res.json({
      project,
      scenes,
      videoVersions,
      videoEdits,
      audioVersions,
      exports,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/projects/:id', async (req: Request, res: Response) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const allowed = ['title', 'brief', 'target_audience', 'duration', 'visual_style', 'aspect_ratio', 'brand_info', 'visual_bible', 'current_video_version_id', 'current_audio_version_id'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        (project as any)[key] = req.body[key];
      }
    }

    await db.saveProject(project);
    res.json({ project });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/projects/:id', async (req: Request, res: Response) => {
  try {
    const success = await db.deleteProject(req.params.id);
    if (!success) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Creative Planner (Brief -> Plan + Visual Bible + Scenes)
// ==========================================
apiRouter.post('/projects/:id/plan', async (req: Request, res: Response) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    console.log(`[Planner] Generating creative plan for project "${project.title}"...`);

    const result = await plannerProvider.generatePlan({
      title: project.title,
      brief: project.brief,
      target_audience: project.target_audience,
      duration: project.duration,
      visual_style: project.visual_style,
      aspect_ratio: project.aspect_ratio,
      brand_info: project.brand_info,
    });

    project.plan = result.plan;
    project.visual_bible = result.visual_bible;
    await db.saveProject(project);

    // Convert scenes in plan to database Scene records
    const scenes: Scene[] = result.plan.scenes.map((s) => ({
      id: crypto.randomUUID(),
      project_id: project.id,
      scene_number: s.scene_number,
      title: s.title,
      duration: s.duration,
      description: s.description,
      subject: s.subject,
      camera: s.camera,
      lighting: s.lighting,
      transition: s.transition,
      energy_level: s.energy_level,
      is_locked: false,
      status: 'idle',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    await db.setScenesForProject(project.id, scenes);

    res.json({
      project,
      plan: result.plan,
      visual_bible: result.visual_bible,
      scenes,
    });
  } catch (err: any) {
    console.error('[Planner] Generation failed:', err);
    res.status(500).json({ error: err.message || 'Failed to generate creative plan' });
  }
});

// ==========================================
// Storyboard & Nano Banana 2 Lite Visuals
// ==========================================
apiRouter.post('/scenes/:id/generate', async (req: Request, res: Response) => {
  try {
    const scene = await db.getScene(req.params.id);
    if (!scene) return res.status(404).json({ error: 'Scene not found' });

    const project = await db.getProject(scene.project_id);
    if (!project || !project.plan) {
      return res.status(400).json({ error: 'Project creative plan must be generated before rendering visuals.' });
    }

    scene.status = 'generating';
    await db.saveScene(scene);

    const alternativePrompt = req.body.alternativePrompt;

    const { media, promptUsed } = await nanoBananaProvider.generateSceneImage({
      scene,
      plan: project.plan,
      visualBible: project.visual_bible,
      aspectRatio: project.aspect_ratio,
      alternativePrompt,
    });

    scene.image_url = media.url;
    scene.image_asset_id = media.key;
    scene.status = 'completed';
    scene.prompt_used = promptUsed;
    scene.error = undefined;
    await db.saveScene(scene);

    res.json({ scene });
  } catch (err: any) {
    console.error('[NanoBanana] Scene generation failed:', err);
    const scene = await db.getScene(req.params.id);
    if (scene) {
      scene.status = 'failed';
      scene.error = err.message;
      await db.saveScene(scene);
    }
    res.status(500).json({ error: err.message || 'Scene image generation failed' });
  }
});

apiRouter.post('/projects/:id/storyboard/generate-all', async (req: Request, res: Response) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project || !project.plan) {
      return res.status(400).json({ error: 'Project plan must exist before generating storyboard.' });
    }

    const scenes = await db.getScenesByProject(project.id);
    const unlockedScenes = scenes.filter((s) => !s.is_locked);

    if (unlockedScenes.length === 0) {
      return res.json({ message: 'All scenes are locked. None generated.', scenes });
    }

    // Launch async batch generation or run sequentially
    const results: Scene[] = [];
    for (const scene of unlockedScenes) {
      try {
        scene.status = 'generating';
        await db.saveScene(scene);

        const { media, promptUsed } = await nanoBananaProvider.generateSceneImage({
          scene,
          plan: project.plan,
          visualBible: project.visual_bible,
          aspectRatio: project.aspect_ratio,
        });

        scene.image_url = media.url;
        scene.image_asset_id = media.key;
        scene.status = 'completed';
        scene.prompt_used = promptUsed;
        await db.saveScene(scene);
        results.push(scene);
      } catch (err: any) {
        console.error(`[NanoBanana] Scene ${scene.scene_number} failed:`, err);
        scene.status = 'failed';
        scene.error = err.message;
        await db.saveScene(scene);
        results.push(scene);
      }
    }

    const updatedScenes = await db.getScenesByProject(project.id);
    res.json({ scenes: updatedScenes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/scenes/:id', async (req: Request, res: Response) => {
  try {
    const scene = await db.getScene(req.params.id);
    if (!scene) return res.status(404).json({ error: 'Scene not found' });

    const allowed = ['title', 'description', 'camera', 'lighting', 'transition', 'energy_level', 'is_locked', 'duration'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        (scene as any)[key] = req.body[key];
      }
    }

    await db.saveScene(scene);
    res.json({ scene });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Gemini Omni Flash Video Pipeline
// ==========================================
apiRouter.post('/projects/:id/video/generate', async (req: Request, res: Response) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const scenes = await db.getScenesByProject(project.id);
    if (scenes.length === 0) {
      return res.status(400).json({ error: 'No scenes defined in project. Generate a creative plan first.' });
    }

    console.log(`[GeminiOmni] Initiating video v1 generation for project "${project.title}"...`);

    // Prepare reference images from storyboard frames where available
    const referenceImages: Array<{ mimeType: string; data: string }> = [];
    for (const s of scenes) {
      if (s.image_asset_id) {
        try {
          const { buffer, mimeType } = await storage.getBuffer(s.image_asset_id);
          referenceImages.push({
            mimeType,
            data: buffer.toString('base64'),
          });
        } catch {
          // ignore
        }
      }
    }

    const { media, interactionId, model, parameters } = await geminiOmniVideoProvider.generateInitialVideo({
      project,
      scenes,
      aspectRatio: project.aspect_ratio,
      referenceImages,
    });

    const existingVersions = await db.getVideoVersions(project.id);
    const versionNumber = existingVersions.length + 1;

    const videoVersion: VideoVersion = {
      id: crypto.randomUUID(),
      project_id: project.id,
      version_number: versionNumber,
      interaction_id: interactionId,
      user_instruction: 'Initial approved storyboard video synthesis',
      video_url: media.url,
      video_asset_id: media.key,
      duration: project.duration,
      aspect_ratio: project.aspect_ratio,
      model,
      parameters,
      created_at: new Date().toISOString(),
    };

    await db.saveVideoVersion(videoVersion);
    project.current_video_version_id = videoVersion.id;
    await db.saveProject(project);

    res.json({ videoVersion });
  } catch (err: any) {
    console.error('[GeminiOmni] Video generation failed:', err);
    res.status(500).json({ error: err.message || 'Video generation failed' });
  }
});

// Conversational Video Revision (Creates v2, v3... with context preservation)
apiRouter.post('/projects/:id/video/edit', async (req: Request, res: Response) => {
  try {
    const { instruction, target_scene_number } = req.body;
    if (!instruction) {
      return res.status(400).json({ error: 'Instruction is required for conversational video editing.' });
    }

    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const versions = await db.getVideoVersions(project.id);
    if (versions.length === 0) {
      return res.status(400).json({ error: 'No existing video version found to edit. Generate Video v1 first.' });
    }

    const currentVersion =
      versions.find((v) => v.id === project.current_video_version_id) || versions[versions.length - 1];

    const scenes = await db.getScenesByProject(project.id);

    console.log(`[GeminiOmni] Executing conversational edit on video v${currentVersion.version_number}: "${instruction}"`);

    const { media, interactionId, model, interpretation, parameters } = await geminiOmniVideoProvider.editVideo({
      project,
      currentVersion,
      instruction,
      targetSceneNumber: target_scene_number,
      scenes,
    });

    const newVersionNumber = versions.length + 1;

    const newVersion: VideoVersion = {
      id: crypto.randomUUID(),
      project_id: project.id,
      version_number: newVersionNumber,
      parent_version_id: currentVersion.id,
      interaction_id: interactionId,
      user_instruction: instruction,
      video_url: media.url,
      video_asset_id: media.key,
      duration: project.duration,
      aspect_ratio: project.aspect_ratio,
      model,
      parameters,
      created_at: new Date().toISOString(),
    };

    await db.saveVideoVersion(newVersion);

    const videoEdit: VideoEdit = {
      id: crypto.randomUUID(),
      project_id: project.id,
      video_version_id: newVersion.id,
      instruction,
      target_scope: target_scene_number ? 'scene' : 'global',
      target_scene_number,
      ai_interpretation: interpretation,
      timestamp: new Date().toISOString(),
    };
    await db.saveVideoEdit(videoEdit);

    project.current_video_version_id = newVersion.id;
    await db.saveProject(project);

    res.json({
      videoVersion: newVersion,
      videoEdit,
      message: interpretation,
    });
  } catch (err: any) {
    console.error('[GeminiOmni] Conversational edit failed:', err);
    res.status(500).json({ error: err.message || 'Video conversational editing failed' });
  }
});

apiRouter.get('/projects/:id/video/versions', async (req: Request, res: Response) => {
  try {
    const versions = await db.getVideoVersions(req.params.id);
    const edits = await db.getVideoEdits(req.params.id);
    res.json({ versions, edits });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/projects/:id/video/restore', async (req: Request, res: Response) => {
  try {
    const { version_id } = req.body;
    const version = await db.getVideoVersion(version_id);
    if (!version || version.project_id !== req.params.id) {
      return res.status(404).json({ error: 'Video version not found' });
    }

    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.current_video_version_id = version.id;
    await db.saveProject(project);

    res.json({ project, currentVersion: version });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Lyria 3.5 Adaptive Soundtrack Scoring
// ==========================================
apiRouter.post('/projects/:id/audio/generate', async (req: Request, res: Response) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const scenes = await db.getScenesByProject(project.id);
    const { mood, energy_level, user_instruction } = req.body;

    const existingAudio = await db.getAudioVersions(project.id);
    const currentAudio = existingAudio.find((a) => a.id === project.current_audio_version_id);

    console.log(`[Lyria] Generating soundtrack for "${project.title}" (Mood: ${mood || 'Cinematic'}, Energy: ${energy_level || 'high'})...`);

    const { media, model, duration, parameters } = await lyriaAudioProvider.generateSoundtrack({
      project,
      scenes,
      mood: mood || 'Cinematic Futuristic',
      energyLevel: energy_level || 'high',
      userInstruction: user_instruction,
      parentVersionId: currentAudio?.id,
    });

    const newVersionNumber = existingAudio.length + 1;

    const audioVersion: AudioVersion = {
      id: crypto.randomUUID(),
      project_id: project.id,
      version_number: newVersionNumber,
      parent_version_id: currentAudio?.id,
      user_instruction,
      mood: mood || 'Cinematic Futuristic',
      energy_level: energy_level || 'high',
      audio_url: media.url,
      audio_asset_id: media.key,
      duration,
      model,
      parameters,
      created_at: new Date().toISOString(),
    };

    await db.saveAudioVersion(audioVersion);
    project.current_audio_version_id = audioVersion.id;
    await db.saveProject(project);

    res.json({ audioVersion });
  } catch (err: any) {
    console.error('[Lyria] Audio scoring failed:', err);
    res.status(500).json({ error: err.message || 'Soundtrack generation failed' });
  }
});

apiRouter.get('/projects/:id/audio/versions', async (req: Request, res: Response) => {
  try {
    const versions = await db.getAudioVersions(req.params.id);
    res.json({ versions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// FFmpeg Video + Audio Media Composition
// ==========================================
apiRouter.post('/projects/:id/export', async (req: Request, res: Response) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const versions = await db.getVideoVersions(project.id);
    if (versions.length === 0) {
      return res.status(400).json({ error: 'No video version available to export. Generate video first.' });
    }

    const currentVideo =
      versions.find((v) => v.id === project.current_video_version_id) || versions[versions.length - 1];

    const audioVersions = await db.getAudioVersions(project.id);
    const currentAudio = audioVersions.find((a) => a.id === project.current_audio_version_id) || audioVersions[audioVersions.length - 1];

    console.log(`[Composer] Composing final export for project "${project.title}" (Video: v${currentVideo.version_number}, Audio: ${currentAudio ? `v${currentAudio.version_number}` : 'none'})...`);

    const result = await mediaComposer.compose({
      videoKey: currentVideo.video_asset_id,
      audioKey: currentAudio?.audio_asset_id,
      duration: project.duration,
      outputResolution: '1080p',
    });

    const exportRecord: ExportRecord = {
      id: crypto.randomUUID(),
      project_id: project.id,
      video_version_id: currentVideo.id,
      audio_version_id: currentAudio?.id,
      export_url: result.exportUrl,
      thumbnail_url: result.thumbnailUrl,
      status: 'completed',
      duration: result.duration,
      resolution: result.resolution,
      file_size: result.fileSize,
      created_at: new Date().toISOString(),
    };

    await db.saveExport(exportRecord);

    res.json({ export: exportRecord });
  } catch (err: any) {
    console.error('[Composer] Export failed:', err);
    res.status(500).json({ error: err.message || 'Media composition failed' });
  }
});

apiRouter.get('/projects/:id/exports', async (req: Request, res: Response) => {
  try {
    const exports = await db.getExports(req.params.id);
    res.json({ exports });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Jobs Status
// ==========================================
apiRouter.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const job = await db.getJob(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ job });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
