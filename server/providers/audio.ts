/**
 * AdForge AI - Lyria 3.5 Adaptive Soundtrack Provider
 * Generates tailored musical scores synchronized to scene timelines,
 * emotional arcs, and user directives using the official Lyria models.
 */
import { getGenAI } from './client';
import { config } from '../config';
import { storage, StoredMedia } from '../storage';
import { Project, Scene } from '../database';

export interface SoundtrackContext {
  project: Project;
  scenes: Scene[];
  mood: string;
  energyLevel: 'low' | 'medium' | 'high' | 'ultra';
  userInstruction?: string;
  parentVersionId?: string;
}

export class LyriaAudioProvider {
  /**
   * Build timeline-aware musical composition prompt
   */
  private buildMusicPrompt(ctx: SoundtrackContext): string {
    const { project, scenes, mood, energyLevel, userInstruction } = ctx;

    const timelineCues = scenes
      .map((s, idx) => {
        const start = scenes.slice(0, idx).reduce((sum, prev) => sum + prev.duration, 0);
        const end = start + s.duration;
        return `[${start}s - ${end}s] Scene ${s.scene_number} ("${s.title}"): Energy=${s.energy_level.toUpperCase()}. Action: ${s.description}`;
      })
      .join('\n');

    return `ADAPTIVE COMMERCIAL SOUNDTRACK SCORING DIRECTIVE:
Campaign: "${project.title}"
Total Duration: ${project.duration} seconds
Target Audience: ${project.target_audience}
Desired Mood: ${mood}
Baseline Energy Level: ${energyLevel}
Visual Style: ${project.visual_style}

SCENE TIMELINE & ENERGY CUES:
${timelineCues}

${userInstruction ? `DIRECTOR SOUNDTRACK REVISION INSTRUCTION:\n"${userInstruction}"\n` : ''}

MUSICAL COMPOSITION REQUIREMENTS:
- Structure a dynamic ${project.duration}-second commercial track that crescendos according to the scene energy cues above.
- Ensure seamless transitions between scenes.
- Premium cinematic fidelity, punchy dynamics, and modern advertising mastering.`;
  }

  /**
   * Generate soundtrack using Lyria models
   */
  async generateSoundtrack(ctx: SoundtrackContext): Promise<{
    media: StoredMedia;
    model: string;
    duration: number;
    parameters: Record<string, unknown>;
  }> {
    const ai = getGenAI();
    const prompt = this.buildMusicPrompt(ctx);

    // Try lyria-3-clip-preview / lyria-3.5
    const modelToUse = config.models.musicGenerator;

    let responseStream;
    try {
      responseStream = await ai.models.generateContentStream({
        model: modelToUse,
        contents: prompt,
      });
    } catch (err: any) {
      console.warn(`[Lyria] Model ${modelToUse} initial attempt failed, trying fallback:`, err.message);
      responseStream = await ai.models.generateContentStream({
        model: 'lyria-3-clip-preview',
        contents: prompt,
      });
    }

    let audioBase64 = '';
    let mimeType = 'audio/wav';

    for await (const chunk of responseStream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;

      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
      }
    }

    if (!audioBase64) {
      throw new Error('Lyria model finished streaming without yielding audio binary data.');
    }

    const ext = mimeType.includes('mp3') || mimeType.includes('mpeg') ? 'mp3' : 'wav';
    const media = await storage.saveBase64(audioBase64, 'audio', ext, mimeType);

    return {
      media,
      model: modelToUse,
      duration: ctx.project.duration,
      parameters: {
        mood: ctx.mood,
        energy_level: ctx.energyLevel,
        user_instruction: ctx.userInstruction || null,
        parent_version_id: ctx.parentVersionId || null,
      },
    };
  }
}

export const lyriaAudioProvider = new LyriaAudioProvider();
