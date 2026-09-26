/**
 * AdForge AI - Shared Creative Studio TypeScript Interfaces
 */

export interface VisualCharacter {
  name: string;
  description: string;
  role: string;
}

export interface VisualProduct {
  name: string;
  description: string;
  visual_features: string;
  color: string;
}

export interface VisualLocation {
  name: string;
  description: string;
  atmosphere: string;
}

export interface VisualBible {
  characters: VisualCharacter[];
  products: VisualProduct[];
  locations: VisualLocation[];
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

export interface Project {
  id: string;
  title: string;
  brief: string;
  target_audience: string;
  duration: number;
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

export interface ProjectStateResponse {
  project: Project;
  scenes: Scene[];
  videoVersions: VideoVersion[];
  videoEdits: VideoEdit[];
  audioVersions: AudioVersion[];
  exports: ExportRecord[];
}
