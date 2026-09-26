/**
 * AdForge AI - FFmpeg Media Composer Service
 * Assembles generated video and Lyria soundtrack into a polished final commercial.
 * Executes safe child_process with argument arrays to prevent shell injection.
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { storage } from '../storage';
import { config } from '../config';

const execFileAsync = promisify(execFile);
const statAsync = promisify(fs.stat);

export interface CompositionRequest {
  videoKey: string;
  audioKey?: string;
  duration?: number;
  outputResolution?: '1080p' | '720p';
}

export interface CompositionResult {
  exportKey: string;
  exportUrl: string;
  thumbnailKey?: string;
  thumbnailUrl?: string;
  duration: number;
  resolution: string;
  fileSize: number;
}

export class MediaComposerService {
  private ffmpegPath = '/usr/bin/ffmpeg';

  async compose(req: CompositionRequest): Promise<CompositionResult> {
    const videoPath = storage.getFilePath(req.videoKey);
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Source video not found on disk at: ${req.videoKey}`);
    }

    const exportsDir = path.join(path.resolve(process.cwd(), config.storageDir), 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const outputFilename = `export_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mp4`;
    const outputPath = path.join(exportsDir, outputFilename);
    const thumbFilename = `thumb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
    const thumbPath = path.join(exportsDir, thumbFilename);

    let audioPath: string | null = null;
    if (req.audioKey) {
      const candidateAudio = storage.getFilePath(req.audioKey);
      if (fs.existsSync(candidateAudio)) {
        audioPath = candidateAudio;
      }
    }

    // Build FFmpeg arguments safely
    const ffmpegArgs: string[] = ['-y'];

    if (audioPath) {
      // Loop video seamlessly if audio/project duration is longer than video
      ffmpegArgs.push('-stream_loop', '-1', '-i', videoPath, '-i', audioPath);
      if (req.duration) {
        ffmpegArgs.push('-t', req.duration.toString());
      }
      ffmpegArgs.push(
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-map',
        '0:v:0',
        '-map',
        '1:a:0',
        outputPath
      );
    } else {
      // Just video normalization
      ffmpegArgs.push('-i', videoPath, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-an', outputPath);
    }

    try {
      console.log(`[FFmpeg] Executing composition: ${this.ffmpegPath} ${ffmpegArgs.join(' ')}`);
      await execFileAsync(this.ffmpegPath, ffmpegArgs, { timeout: config.timeouts.ffmpeg });
    } catch (err: any) {
      console.error('[FFmpeg] Composition failed:', err.message, err.stderr);
      // Fallback: If second audio mapping fails (e.g. format mismatch), copy video
      const fallbackArgs = ['-y', '-i', videoPath, '-c', 'copy', outputPath];
      await execFileAsync(this.ffmpegPath, fallbackArgs);
    }

    // Generate thumbnail at 1s or beginning
    try {
      const thumbArgs = ['-y', '-ss', '00:00:01', '-i', outputPath, '-vframes', '1', '-q:v', '2', thumbPath];
      await execFileAsync(this.ffmpegPath, thumbArgs);
    } catch {
      // fallback thumbnail at 0s
      try {
        const thumbArgs = ['-y', '-ss', '00:00:00', '-i', outputPath, '-vframes', '1', thumbPath];
        await execFileAsync(this.ffmpegPath, thumbArgs);
      } catch {
        // ignore thumb error
      }
    }

    const fileStat = await statAsync(outputPath);
    const exportKey = `exports/${outputFilename}`;
    const thumbnailKey = fs.existsSync(thumbPath) ? `exports/${thumbFilename}` : undefined;

    return {
      exportKey,
      exportUrl: `/api/storage/${exportKey}`,
      thumbnailKey,
      thumbnailUrl: thumbnailKey ? `/api/storage/${thumbnailKey}` : undefined,
      duration: req.duration || 20,
      resolution: req.outputResolution || '1080p',
      fileSize: fileStat.size,
    };
  }
}

export const mediaComposer = new MediaComposerService();
