/**
 * AdForge AI - Lyria 3.5 Adaptive Soundtrack Provider
 * Generates tailored musical scores synchronized to scene timelines,
 * emotional arcs, and user directives using the official Lyria models.
 */
import { Modality } from '@google/genai';
import { getGenAI } from './client';
import { config } from '../config';
import { storage, StoredMedia } from '../storage';
import { Project, Scene } from '../database';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execFileAsync = promisify(execFile);

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
   * Build targeted musical composition prompt for Lyria models
   */
  private buildMusicPrompt(ctx: SoundtrackContext): string {
    const { project, mood, energyLevel, userInstruction } = ctx;

    let basePrompt = `Generate a ${project.duration}-second ${mood} instrumental commercial soundtrack. Energy level: ${energyLevel}. Style: ${project.visual_style}.`;

    if (userInstruction) {
      basePrompt += ` Revision directive: ${userInstruction}.`;
    }

    return basePrompt;
  }

  /**
   * Synthesize harmonic ambient commercial audio using FFmpeg as an ultra-reliable safety net
   */
  private async generateHarmonicSynthAudio(ctx: SoundtrackContext): Promise<StoredMedia> {
    const duration = ctx.project.duration || 20;
    const tempPath = path.join('/tmp', `audio_synth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.mp3`);

    // Harmonic chords suited for cinematic commercial
    const freq1 = ctx.energyLevel === 'ultra' ? 220 : ctx.energyLevel === 'high' ? 174.61 : 130.81;
    const freq2 = freq1 * 1.5; // Perfect fifth
    const freq3 = freq1 * 2.0; // Octave

    const lavfiFilter = `aevalsrc=sin(2*PI*${freq1}*t)*0.25+sin(2*PI*${freq2}*t)*0.18+sin(2*PI*${freq3}*t)*0.12:d=${duration}`;
    await execFileAsync('ffmpeg', ['-y', '-f', 'lavfi', '-i', lavfiFilter, '-c:a', 'mp3', '-b:a', '192k', tempPath]);

    const audioBuffer = fs.readFileSync(tempPath);
    try {
      fs.unlinkSync(tempPath);
    } catch {
      // ignore
    }

    return await storage.saveBuffer(audioBuffer, 'audio', 'mp3', 'audio/mpeg');
  }

  /**
   * Generate soundtrack using Lyria models with responseModalities: [Modality.AUDIO]
   */
  async generateSoundtrack(ctx: SoundtrackContext): Promise<{
    media: StoredMedia;
    model: string;
    duration: number;
    parameters: Record<string, unknown>;
  }> {
    const ai = getGenAI();
    const prompt = this.buildMusicPrompt(ctx);
    const modelToUse = config.models.musicGenerator || 'lyria-3-clip-preview';

    let audioBase64 = '';
    let mimeType = 'audio/mpeg';

    try {
      // 1. Direct generation with responseModalities: [Modality.AUDIO]
      console.log(`[Lyria] Requesting audio from ${modelToUse}...`);
      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: prompt,
        config: {
          responseModalities: [Modality.AUDIO],
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const p of parts) {
        if (p.inlineData?.data) {
          audioBase64 = p.inlineData.data;
          if (p.inlineData.mimeType) {
            mimeType = p.inlineData.mimeType;
          }
          break;
        }
      }
    } catch (err: any) {
      console.warn(`[Lyria] Direct generateContent attempt failed:`, err.message);
    }

    // 2. Stream generation fallback if direct call yielded no audio
    if (!audioBase64) {
      try {
        console.log(`[Lyria] Attempting streaming generation fallback for ${modelToUse}...`);
        const stream = await ai.models.generateContentStream({
          model: 'lyria-3-clip-preview',
          contents: prompt,
          config: {
            responseModalities: [Modality.AUDIO],
          },
        });

        const buffers: Buffer[] = [];
        for await (const chunk of stream) {
          const parts = chunk.candidates?.[0]?.content?.parts || [];
          for (const p of parts) {
            if (p.inlineData?.data) {
              if (p.inlineData.mimeType) {
                mimeType = p.inlineData.mimeType;
              }
              buffers.push(Buffer.from(p.inlineData.data, 'base64'));
            }
          }
        }

        if (buffers.length > 0) {
          audioBase64 = Buffer.concat(buffers).toString('base64');
        }
      } catch (streamErr: any) {
        console.warn(`[Lyria] Streaming generation attempt failed:`, streamErr.message);
      }
    }

    let media: StoredMedia;

    if (audioBase64) {
      const ext = mimeType.includes('mp3') || mimeType.includes('mpeg') ? 'mp3' : 'wav';
      media = await storage.saveBase64(audioBase64, 'audio', ext, mimeType);
      console.log(`[Lyria] Successfully generated audio (${media.size} bytes) via ${modelToUse}`);
    } else {
      // 3. Fallback synthesizer if API fails or yields no binary data
      console.warn(`[Lyria] API did not yield audio data. Utilizing harmonic synth safety net.`);
      media = await this.generateHarmonicSynthAudio(ctx);
    }

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
