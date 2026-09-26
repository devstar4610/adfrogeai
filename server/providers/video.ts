/**
 * AdForge AI - Gemini Omni Flash Video Generation & Conversational Editor Provider
 * Implements the Interactions API with multi-turn conversation memory, storyboard
 * reference frame injection, and continuity-preserving scene revisions.
 */
import { getGenAI } from './client';
import { config } from '../config';
import { storage, StoredMedia } from '../storage';
import { Project, Scene, VisualBible, CreativePlan, VideoVersion } from '../database';

export interface VideoGenerationContext {
  project: Project;
  scenes: Scene[];
  aspectRatio: '16:9' | '9:16' | '1:1';
  referenceImages?: Array<{ mimeType: string; data: string }>;
}

export interface VideoEditContext {
  project: Project;
  currentVersion: VideoVersion;
  instruction: string;
  targetSceneNumber?: number;
  scenes: Scene[];
}

export class GeminiOmniVideoProvider {
  /**
   * Build complete contextual directive for video generation
   */
  private buildVideoPrompt(project: Project, scenes: Scene[]): string {
    const visual = project.visual_bible;
    const sceneDescriptions = scenes
      .map(
        (s) =>
          `[Scene ${s.scene_number} - ${s.duration}s]: "${s.title}"\nAction: ${s.description}\nCamera: ${s.camera}\nLighting: ${s.lighting}\nTransition: ${s.transition}`
      )
      .join('\n\n');

    return `MASTER COMMERCIAL VIDEO PRODUCTION BRIEF:
Campaign: "${project.title}"
Total Duration: ${project.duration} seconds
Target Audience: ${project.target_audience}
Cinematographic Style: ${visual.visual_style}
Color Direction: ${visual.color_palette.join(', ')}
Lighting Language: ${visual.lighting_style}
Camera Direction: ${visual.camera_language}

HERO ASSET REPUTATION & CONTINUITY:
${visual.products.map((p) => `Product "${p.name}": ${p.description} (${p.visual_features})`).join('\n')}
${visual.characters.map((c) => `Character "${c.name}": ${c.description}`).join('\n')}

SEQUENTIAL SHOT LIST & PACING:
${sceneDescriptions}

DIRECTIVE:
Render a seamless, photorealistic, cinematic high-production commercial conforming exactly to the scene sequence, camera language, and product specifications outlined above.`;
  }

  /**
   * Initial Video Generation (v1)
   */
  async generateInitialVideo(ctx: VideoGenerationContext): Promise<{
    media: StoredMedia;
    interactionId?: string;
    model: string;
    parameters: Record<string, unknown>;
  }> {
    const ai = getGenAI();
    const prompt = this.buildVideoPrompt(ctx.project, ctx.scenes);

    const inputParts: any[] = [];

    // Add up to 3 reference images from storyboard frames if available
    if (ctx.referenceImages && ctx.referenceImages.length > 0) {
      for (const ref of ctx.referenceImages.slice(0, 3)) {
        inputParts.push({
          type: 'image',
          mime_type: ref.mimeType,
          data: ref.data,
        });
      }
    }

    inputParts.push({
      type: 'text',
      text: prompt,
    });

    const aspect = ctx.aspectRatio === '9:16' ? '9:16' : '16:9';
    // gemini-omni-1.1-flash officially requires duration as string '5s' or '10s'
    const videoDuration = ctx.project.duration <= 5 ? '5s' : '10s';

    const interaction = await ai.interactions.create(
      {
        model: config.models.videoGenerator,
        input: inputParts.length === 1 ? inputParts[0].text : inputParts,
        background: false,
        store: true, // Required for multi-turn editing with previous_interaction_id
        stream: false,
        response_format: {
          type: 'video',
          aspect_ratio: aspect,
          duration: videoDuration,
        },
      },
      { timeout: config.timeouts.video }
    );

    const videoPart = interaction.output_video;
    let base64Video = videoPart?.data;
    const mimeType = videoPart?.mime_type || 'video/mp4';

    if (!base64Video && (videoPart as any)?.uri) {
      // Fetch URI if provided
      const res = await fetch((videoPart as any).uri);
      const arrayBuffer = await res.arrayBuffer();
      base64Video = Buffer.from(arrayBuffer).toString('base64');
    }

    if (!base64Video) {
      // Check in steps
      for (const step of (interaction.steps as any[]) || []) {
        if (step.type === 'model_output') {
          const v = step.content?.find((c: any) => c.type === 'video');
          if (v && (v as any).data) {
            base64Video = (v as any).data;
            break;
          }
        }
      }
    }

    if (!base64Video) {
      throw new Error(
        `Gemini Omni Flash generated the video interaction (ID: ${interaction.id}), but no video payload was returned.`
      );
    }

    const media = await storage.saveBase64(base64Video, 'videos', 'mp4', mimeType);

    return {
      media,
      interactionId: interaction.id,
      model: config.models.videoGenerator,
      parameters: {
        aspect_ratio: aspect,
        duration: ctx.project.duration,
        promptLength: prompt.length,
        referenceImagesCount: ctx.referenceImages?.length || 0,
      },
    };
  }

  /**
   * Conversational Video Editing (Creates v2, v3... with context preservation)
   */
  async editVideo(ctx: VideoEditContext): Promise<{
    media: StoredMedia;
    interactionId?: string;
    model: string;
    interpretation: string;
    parameters: Record<string, unknown>;
  }> {
    const ai = getGenAI();

    // Accumulated Context Engine
    const visual = ctx.project.visual_bible;
    const targetSceneText = ctx.targetSceneNumber
      ? `Specific Scene Targeted: Scene ${ctx.targetSceneNumber} of ${ctx.scenes.length}.`
      : 'Review all scenes and apply localized modification where appropriate.';

    const editPrompt = `CONVERSATIONAL VIDEO REVISION REQUEST:
User Directive: "${ctx.instruction}"
${targetSceneText}

STRICT CONTINUITY PRESERVATION MANDATE:
- Maintain all hero product designs, character models, color palette, and audio-visual tone established in the Visual Bible.
- Keep all other scenes untouched and unaffected.
- Apply the requested change (e.g. lighting, camera angle, motion, or pacing) specifically to the intended scene without altering the global narrative structure.

Now generate the revised video cut representing the updated creative cut.`;

    const videoDuration = ctx.project.duration <= 5 ? '5s' : '10s';

    const interactionOptions: any = {
      model: config.models.videoGenerator,
      input: editPrompt,
      background: false,
      store: true,
      stream: false,
      response_format: {
        type: 'video',
        duration: videoDuration,
      },
    };

    // Chain previous interaction if available
    if (ctx.currentVersion.interaction_id) {
      interactionOptions.previous_interaction_id = ctx.currentVersion.interaction_id;
    }

    const interaction = await ai.interactions.create(interactionOptions, {
      timeout: config.timeouts.video,
    });

    const videoPart = interaction.output_video;
    let base64Video = videoPart?.data;
    const mimeType = videoPart?.mime_type || 'video/mp4';

    if (!base64Video && (videoPart as any)?.uri) {
      const res = await fetch((videoPart as any).uri);
      const arrayBuffer = await res.arrayBuffer();
      base64Video = Buffer.from(arrayBuffer).toString('base64');
    }

    if (!base64Video) {
      for (const step of (interaction.steps as any[]) || []) {
        if (step.type === 'model_output') {
          const v = step.content?.find((c: any) => c.type === 'video');
          if (v && (v as any).data) {
            base64Video = (v as any).data;
            break;
          }
        }
      }
    }

    if (!base64Video) {
      throw new Error(
        `Gemini Omni Flash processed the video edit (Interaction ID: ${interaction.id}), but did not return video data.`
      );
    }

    const media = await storage.saveBase64(base64Video, 'videos', 'mp4', mimeType);

    const interpretation = `Updated scene execution according to directive: "${ctx.instruction}", preserving hero product aesthetics and timeline pacing.`;

    return {
      media,
      interactionId: interaction.id,
      model: config.models.videoGenerator,
      interpretation,
      parameters: {
        parent_version_id: ctx.currentVersion.id,
        instruction: ctx.instruction,
        target_scene: ctx.targetSceneNumber || null,
      },
    };
  }
}

export const geminiOmniVideoProvider = new GeminiOmniVideoProvider();
