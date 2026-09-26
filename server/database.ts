/**
 * AdForge AI - Persistent Database Layer
 * Provides robust, non-destructive relational storage for projects, scenes,
 * visual bibles, video iterations, audio tracks, and asynchronous jobs.
 */
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import crypto from 'crypto';
import { config } from './config';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export interface VisualBible {
  characters: Array<{ name: string; description: string; role: string }>;
  products: Array<{ name: string; description: string; visual_features: string; color: string }>;
  locations: Array<{ name: string; description: string; atmosphere: string }>;
  visual_style: string;
  color_palette: string[];
  lighting_style: string;
  camera_language: string;
  environment: string;
}

export interface CreativePlanScene {
  scene_number: number;
  duration: number;
  title: string;
  description: string;
  subject: string;
  camera: string;
  lighting: string;
  transition: string;
  energy_level: 'low' | 'medium' | 'high' | 'climax';
}

export interface CreativePlan {
  concept: string;
  target_audience: string;
  duration: number;
  tone: string;
  visual_style: string;
  color_direction: string;
  camera_language: string;
  music_direction: string;
  scenes: CreativePlanScene[];
}

export interface Scene {
  id: string;
  project_id: string;
  scene_number: number;
  title: string;
  duration: number;
  description: string;
  subject: string;
  camera: string;
  lighting: string;
  transition: string;
  energy_level: 'low' | 'medium' | 'high' | 'climax';
  image_url?: string;
  image_asset_id?: string;
  is_locked: boolean;
  status: 'idle' | 'generating' | 'completed' | 'failed';
  error?: string;
  prompt_used?: string;
  created_at: string;
  updated_at: string;
}

export interface VideoVersion {
  id: string;
  project_id: string;
  version_number: number;
  parent_version_id?: string;
  interaction_id?: string;
  user_instruction?: string;
  video_url: string;
  video_asset_id: string;
  duration: number;
  aspect_ratio: string;
  model: string;
  parameters: Record<string, unknown>;
  created_at: string;
}

export interface VideoEdit {
  id: string;
  project_id: string;
  video_version_id: string;
  instruction: string;
  target_scope: 'scene' | 'global' | 'style' | 'camera';
  target_scene_number?: number;
  ai_interpretation: string;
  timestamp: string;
}

export interface AudioVersion {
  id: string;
  project_id: string;
  version_number: number;
  parent_version_id?: string;
  user_instruction?: string;
  mood: string;
  energy_level: string;
  audio_url: string;
  audio_asset_id: string;
  duration: number;
  model: string;
  parameters: Record<string, unknown>;
  created_at: string;
}

export interface ExportRecord {
  id: string;
  project_id: string;
  video_version_id: string;
  audio_version_id?: string;
  export_url: string;
  thumbnail_url?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  duration: number;
  resolution: string;
  file_size: number;
  created_at: string;
  error?: string;
}

export interface GenerationJob {
  id: string;
  project_id: string;
  type: 'plan' | 'storyboard_image' | 'video' | 'video_edit' | 'audio' | 'export';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress_message: string;
  error_message?: string;
  result_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  brief: string;
  target_audience: string;
  duration: number; // in seconds, e.g. 20
  visual_style: string;
  aspect_ratio: '16:9' | '9:16' | '1:1';
  brand_info?: string;
  plan?: CreativePlan;
  visual_bible: VisualBible;
  current_video_version_id?: string;
  current_audio_version_id?: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseSchema {
  projects: Record<string, Project>;
  scenes: Record<string, Scene>;
  video_versions: Record<string, VideoVersion>;
  video_edits: Record<string, VideoEdit>;
  audio_versions: Record<string, AudioVersion>;
  exports: Record<string, ExportRecord>;
  jobs: Record<string, GenerationJob>;
}

export class Database {
  private dbPath: string;
  private data: DatabaseSchema = {
    projects: {},
    scenes: {},
    video_versions: {},
    video_edits: {},
    audio_versions: {},
    exports: {},
    jobs: {},
  };
  private isLoaded = false;
  private savePromise: Promise<void> | null = null;

  constructor() {
    this.dbPath = path.resolve(process.cwd(), config.dbFile);
  }

  async init(): Promise<void> {
    if (this.isLoaded) return;
    try {
      await mkdir(path.dirname(this.dbPath), { recursive: true });
      if (fs.existsSync(this.dbPath)) {
        const raw = await readFile(this.dbPath, 'utf8');
        this.data = JSON.parse(raw);
        // Ensure all collections exist
        this.data.projects = this.data.projects || {};
        this.data.scenes = this.data.scenes || {};
        this.data.video_versions = this.data.video_versions || {};
        this.data.video_edits = this.data.video_edits || {};
        this.data.audio_versions = this.data.audio_versions || {};
        this.data.exports = this.data.exports || {};
        this.data.jobs = this.data.jobs || {};
      } else {
        await this.persist();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('[DB] Failed to load database, initializing clean:', err);
      await this.persist();
      this.isLoaded = true;
    }
  }

  private async persist(): Promise<void> {
    if (this.savePromise) {
      return this.savePromise;
    }
    this.savePromise = (async () => {
      try {
        await mkdir(path.dirname(this.dbPath), { recursive: true });
        const tempPath = `${this.dbPath}.tmp`;
        await writeFile(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
        fs.renameSync(tempPath, this.dbPath);
      } finally {
        this.savePromise = null;
      }
    })();
    return this.savePromise;
  }

  // --- Project Operations ---
  async getProject(id: string): Promise<Project | null> {
    await this.init();
    return this.data.projects[id] || null;
  }

  async listProjects(): Promise<Project[]> {
    await this.init();
    return Object.values(this.data.projects).sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  async saveProject(project: Project): Promise<Project> {
    await this.init();
    project.updated_at = new Date().toISOString();
    this.data.projects[project.id] = project;
    await this.persist();
    return project;
  }

  async deleteProject(id: string): Promise<boolean> {
    await this.init();
    if (!this.data.projects[id]) return false;
    delete this.data.projects[id];
    // Cascade remove related items
    for (const [k, v] of Object.entries(this.data.scenes)) {
      if (v.project_id === id) delete this.data.scenes[k];
    }
    for (const [k, v] of Object.entries(this.data.video_versions)) {
      if (v.project_id === id) delete this.data.video_versions[k];
    }
    for (const [k, v] of Object.entries(this.data.video_edits)) {
      if (v.project_id === id) delete this.data.video_edits[k];
    }
    for (const [k, v] of Object.entries(this.data.audio_versions)) {
      if (v.project_id === id) delete this.data.audio_versions[k];
    }
    for (const [k, v] of Object.entries(this.data.exports)) {
      if (v.project_id === id) delete this.data.exports[k];
    }
    await this.persist();
    return true;
  }

  // --- Scene Operations ---
  async getScenesByProject(projectId: string): Promise<Scene[]> {
    await this.init();
    return Object.values(this.data.scenes)
      .filter((s) => s.project_id === projectId)
      .sort((a, b) => a.scene_number - b.scene_number);
  }

  async getScene(id: string): Promise<Scene | null> {
    await this.init();
    return this.data.scenes[id] || null;
  }

  async saveScene(scene: Scene): Promise<Scene> {
    await this.init();
    scene.updated_at = new Date().toISOString();
    this.data.scenes[scene.id] = scene;
    await this.persist();
    return scene;
  }

  async setScenesForProject(projectId: string, scenes: Scene[]): Promise<Scene[]> {
    await this.init();
    // remove existing scenes for project
    for (const [k, v] of Object.entries(this.data.scenes)) {
      if (v.project_id === projectId) delete this.data.scenes[k];
    }
    for (const s of scenes) {
      this.data.scenes[s.id] = s;
    }
    await this.persist();
    return scenes;
  }

  // --- Video Versions & Edits ---
  async getVideoVersions(projectId: string): Promise<VideoVersion[]> {
    await this.init();
    return Object.values(this.data.video_versions)
      .filter((v) => v.project_id === projectId)
      .sort((a, b) => a.version_number - b.version_number);
  }

  async getVideoVersion(id: string): Promise<VideoVersion | null> {
    await this.init();
    return this.data.video_versions[id] || null;
  }

  async saveVideoVersion(version: VideoVersion): Promise<VideoVersion> {
    await this.init();
    this.data.video_versions[version.id] = version;
    await this.persist();
    return version;
  }

  async saveVideoEdit(edit: VideoEdit): Promise<VideoEdit> {
    await this.init();
    this.data.video_edits[edit.id] = edit;
    await this.persist();
    return edit;
  }

  async getVideoEdits(projectId: string): Promise<VideoEdit[]> {
    await this.init();
    return Object.values(this.data.video_edits)
      .filter((e) => e.project_id === projectId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // --- Audio Versions ---
  async getAudioVersions(projectId: string): Promise<AudioVersion[]> {
    await this.init();
    return Object.values(this.data.audio_versions)
      .filter((a) => a.project_id === projectId)
      .sort((a, b) => a.version_number - b.version_number);
  }

  async saveAudioVersion(version: AudioVersion): Promise<AudioVersion> {
    await this.init();
    this.data.audio_versions[version.id] = version;
    await this.persist();
    return version;
  }

  // --- Exports ---
  async getExports(projectId: string): Promise<ExportRecord[]> {
    await this.init();
    return Object.values(this.data.exports)
      .filter((e) => e.project_id === projectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getExport(id: string): Promise<ExportRecord | null> {
    await this.init();
    return this.data.exports[id] || null;
  }

  async saveExport(record: ExportRecord): Promise<ExportRecord> {
    await this.init();
    this.data.exports[record.id] = record;
    await this.persist();
    return record;
  }

  // --- Jobs ---
  async getJob(id: string): Promise<GenerationJob | null> {
    await this.init();
    return this.data.jobs[id] || null;
  }

  async saveJob(job: GenerationJob): Promise<GenerationJob> {
    await this.init();
    job.updated_at = new Date().toISOString();
    this.data.jobs[job.id] = job;
    await this.persist();
    return job;
  }
}

export const db = new Database();
