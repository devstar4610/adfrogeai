/**
 * AdForge AI - Typed Frontend API Client
 * Wraps all backend endpoints with structured error handling.
 */
import {
  Project,
  Scene,
  ProjectStateResponse,
  VideoVersion,
  AudioVersion,
  ExportRecord,
  VideoEdit,
  CreativePlan,
  VisualBible,
} from '../types/creative';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.details || `Request failed with status ${res.status}`);
    }
    return data as T;
  }

  // Health
  async getHealth(): Promise<{ status: string; aiConfigured: boolean }> {
    return this.request('/api/health');
  }

  // Projects
  async listProjects(): Promise<{ projects: Project[] }> {
    return this.request('/api/projects');
  }

  async getProjectState(id: string): Promise<ProjectStateResponse> {
    return this.request(`/api/projects/${id}`);
  }

  async createProject(input: {
    title: string;
    brief: string;
    target_audience?: string;
    duration?: number;
    visual_style?: string;
    aspect_ratio?: string;
    brand_info?: string;
  }): Promise<{ project: Project }> {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<{ project: Project }> {
    return this.request(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Creative Planner
  async generatePlan(projectId: string): Promise<{
    project: Project;
    plan: CreativePlan;
    visual_bible: VisualBible;
    scenes: Scene[];
  }> {
    return this.request(`/api/projects/${projectId}/plan`, {
      method: 'POST',
    });
  }

  // Storyboard & Nano Banana 2 Lite
  async generateSceneImage(
    sceneId: string,
    alternativePrompt?: string
  ): Promise<{ scene: Scene }> {
    return this.request(`/api/scenes/${sceneId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ alternativePrompt }),
    });
  }

  async generateAllScenes(projectId: string): Promise<{ scenes: Scene[] }> {
    return this.request(`/api/projects/${projectId}/storyboard/generate-all`, {
      method: 'POST',
    });
  }

  async updateScene(sceneId: string, updates: Partial<Scene>): Promise<{ scene: Scene }> {
    return this.request(`/api/scenes/${sceneId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Gemini Omni Flash Video
  async generateVideo(projectId: string): Promise<{ videoVersion: VideoVersion }> {
    return this.request(`/api/projects/${projectId}/video/generate`, {
      method: 'POST',
    });
  }

  async editVideo(
    projectId: string,
    instruction: string,
    targetSceneNumber?: number
  ): Promise<{
    videoVersion: VideoVersion;
    videoEdit: VideoEdit;
    message: string;
  }> {
    return this.request(`/api/projects/${projectId}/video/edit`, {
      method: 'POST',
      body: JSON.stringify({ instruction, target_scene_number: targetSceneNumber }),
    });
  }

  async restoreVideoVersion(
    projectId: string,
    versionId: string
  ): Promise<{ project: Project; currentVersion: VideoVersion }> {
    return this.request(`/api/projects/${projectId}/video/restore`, {
      method: 'POST',
      body: JSON.stringify({ version_id: versionId }),
    });
  }

  // Lyria 3.5 Soundtrack
  async generateSoundtrack(
    projectId: string,
    params: {
      mood?: string;
      energy_level?: 'low' | 'medium' | 'high' | 'ultra';
      user_instruction?: string;
    }
  ): Promise<{ audioVersion: AudioVersion }> {
    return this.request(`/api/projects/${projectId}/audio/generate`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Final FFmpeg Composition
  async exportCreative(projectId: string): Promise<{ export: ExportRecord }> {
    return this.request(`/api/projects/${projectId}/export`, {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
