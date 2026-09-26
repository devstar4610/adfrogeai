/**
 * AdForge AI - Storage Service
 * Provides unified media storage abstraction for images, video, audio, and exports.
 */
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import crypto from 'crypto';
import { config } from './config';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

export interface StoredMedia {
  key: string;
  url: string;
  filePath: string;
  size: number;
  mimeType: string;
}

export class StorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), config.storageDir);
    this.ensureDirectoryExists(this.baseDir);
  }

  private async ensureDirectoryExists(dir: string): Promise<void> {
    try {
      await mkdir(dir, { recursive: true });
    } catch {
      // already exists
    }
  }

  /**
   * Save buffer to storage
   */
  async saveBuffer(
    buffer: Buffer,
    subfolder: 'images' | 'videos' | 'audio' | 'exports',
    extension: string,
    mimeType: string
  ): Promise<StoredMedia> {
    const targetDir = path.join(this.baseDir, subfolder);
    await this.ensureDirectoryExists(targetDir);

    const filename = `${crypto.randomUUID()}.${extension.replace(/^\./, '')}`;
    const filePath = path.join(targetDir, filename);

    await writeFile(filePath, buffer);
    const fileStat = await stat(filePath);
    const key = `${subfolder}/${filename}`;

    return {
      key,
      url: `/api/storage/${key}`,
      filePath,
      size: fileStat.size,
      mimeType,
    };
  }

  /**
   * Save base64 string to storage
   */
  async saveBase64(
    base64Data: string,
    subfolder: 'images' | 'videos' | 'audio' | 'exports',
    extension: string,
    mimeType: string
  ): Promise<StoredMedia> {
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    return this.saveBuffer(buffer, subfolder, extension, mimeType);
  }

  /**
   * Get physical file path from key
   */
  getFilePath(key: string): string {
    const safeKey = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
    return path.join(this.baseDir, safeKey);
  }

  /**
   * Read file stream or buffer
   */
  async getBuffer(key: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const filePath = this.getFilePath(key);
    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    const mimeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
    };

    return {
      buffer,
      mimeType: mimeMap[ext] || 'application/octet-stream',
    };
  }
}

export const storage = new StorageService();
