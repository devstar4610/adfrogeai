/**
 * AdForge AI - Multimodal Creative Production Platform
 * Main application coordinator managing project states, API dispatches,
 * notifications, and modal view controllers.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api/client';
import { Project, ProjectStateResponse, Scene, VisualBible, ExportRecord } from './types/creative';
import { Header } from './components/Header';
import { ProjectDashboard } from './components/ProjectDashboard';
import { Workspace } from './components/Workspace';
import { VisualBibleModal } from './components/VisualBibleModal';
import { ExportModal } from './components/ExportModal';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectState, setProjectState] = useState<ProjectStateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [isVisualBibleOpen, setIsVisualBibleOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.listProjects();
      setProjects(res.projects);

      // Check if URL hash specifies a project
      const hash = window.location.hash;
      const match = hash.match(/^#project=([a-zA-Z0-9-]+)/);
      if (match && match[1]) {
        const found = res.projects.find((p) => p.id === match[1]);
        if (found) {
          setCurrentProjectId(found.id);
        }
      }
      // Note: We deliberately do NOT auto-select a project so the user lands on the Home Page Dashboard!
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectProject = (id: string | null) => {
    setCurrentProjectId(id);
    if (id) {
      window.location.hash = `#project=${id}`;
    } else {
      window.location.hash = '';
    }
  };

  const loadCurrentProjectState = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const res = await api.getProjectState(id);
      setProjectState(res);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to load project creative state');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (currentProjectId) {
      loadCurrentProjectState(currentProjectId);
    } else {
      setProjectState(null);
    }
  }, [currentProjectId, loadCurrentProjectState]);

  // Project Actions
  const handleCreateProject = async (data: {
    title: string;
    brief: string;
    target_audience: string;
    duration: number;
    visual_style: string;
    aspect_ratio: '16:9' | '9:16' | '1:1';
    brand_info?: string;
  }) => {
    try {
      setLoading(true);
      const res = await api.createProject(data);
      setProjects((prev) => [res.project, ...prev]);
      selectProject(res.project.id);
      showNotification('success', `Created project "${res.project.title}"! Now generating plan...`);

      // Auto-trigger Creative Plan generation for instant delight
      const planRes = await api.generatePlan(res.project.id);
      await loadCurrentProjectState(res.project.id);
      showNotification('success', `Creative Plan and Visual Bible established for "${res.project.title}"!`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      setLoading(true);
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (currentProjectId === id) {
        selectProject(null);
      }
      showNotification('success', 'Project removed.');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  // Pipeline Actions
  const handleGeneratePlan = async () => {
    if (!currentProjectId) return;
    try {
      setLoading(true);
      await api.generatePlan(currentProjectId);
      await loadCurrentProjectState(currentProjectId);
      showNotification('success', 'Creative plan and 5 storyboard scenes synthesized.');
    } catch (err: any) {
      showNotification('error', err.message || 'Creative Planner failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAllScenes = async () => {
    if (!currentProjectId) return;
    try {
      setLoading(true);
      await api.generateAllScenes(currentProjectId);
      await loadCurrentProjectState(currentProjectId);
      showNotification('success', 'Nano Banana 2 Lite generated all unlocked storyboard frames.');
    } catch (err: any) {
      showNotification('error', err.message || 'Storyboard frame generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateScene = async (sceneId: string, alternativePrompt?: string) => {
    if (!currentProjectId) return;
    try {
      setLoading(true);
      await api.generateSceneImage(sceneId, alternativePrompt);
      await loadCurrentProjectState(currentProjectId);
      showNotification('success', 'Scene visual frame rendered successfully.');
    } catch (err: any) {
      showNotification('error', err.message || 'Scene image generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateScene = async (sceneId: string, updates: Partial<Scene>) => {
    if (!currentProjectId) return;
    try {
      await api.updateScene(sceneId, updates);
      await loadCurrentProjectState(currentProjectId);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update scene');
    }
  };

  const handleGenerateVideo = async () => {
    if (!currentProjectId) return;
    try {
      setLoading(true);
      showNotification('success', 'Gemini Omni Flash is synthesizing Video v1... (this may take 1-2 minutes)');
      const res = await api.generateVideo(currentProjectId);
      await loadCurrentProjectState(currentProjectId);
      showNotification('success', `Video Cut v${res.videoVersion.version_number} synthesized successfully!`);
    } catch (err: any) {
      showNotification('error', err.message || 'Video generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEditVideo = async (instruction: string, targetSceneNumber?: number) => {
    if (!currentProjectId) return;
    try {
      setLoading(true);
      showNotification('success', `Applying conversational revision: "${instruction.slice(0, 40)}..."`);
      const res = await api.editVideo(currentProjectId, instruction, targetSceneNumber);
      await loadCurrentProjectState(currentProjectId);
      showNotification('success', `Video Cut v${res.videoVersion.version_number} created with continuity preserved!`);
    } catch (err: any) {
      showNotification('error', err.message || 'Conversational video editing failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVideoVersion = async (versionId: string) => {
    if (!currentProjectId) return;
    try {
      await api.restoreVideoVersion(currentProjectId, versionId);
      await loadCurrentProjectState(currentProjectId);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to select version');
    }
  };

  const handleGenerateSoundtrack = async (params: {
    mood?: string;
    energy_level?: 'low' | 'medium' | 'high' | 'ultra';
    user_instruction?: string;
  }) => {
    if (!currentProjectId) return;
    try {
      setLoading(true);
      showNotification('success', 'Lyria 3.5 is scoring an adaptive commercial soundtrack...');
      const res = await api.generateSoundtrack(currentProjectId, params);
      await loadCurrentProjectState(currentProjectId);
      showNotification('success', `Soundtrack Score v${res.audioVersion.version_number} generated!`);
    } catch (err: any) {
      showNotification('error', err.message || 'Soundtrack generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerExport = async (): Promise<ExportRecord> => {
    if (!currentProjectId) throw new Error('No active project');
    const res = await api.exportCreative(currentProjectId);
    await loadCurrentProjectState(currentProjectId);
    showNotification('success', 'Commercial successfully multiplexed via FFmpeg!');
    return res.export;
  };

  const handleSaveVisualBible = async (updated: VisualBible) => {
    if (!currentProjectId) return;
    try {
      await api.updateProject(currentProjectId, { visual_bible: updated });
      await loadCurrentProjectState(currentProjectId);
      showNotification('success', 'Visual Bible updated and synchronized across all generators.');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update Visual Bible');
    }
  };

  const currentVideoVersion = projectState?.videoVersions.find(
    (v) => v.id === projectState.project.current_video_version_id
  );
  const currentAudioVersion = projectState?.audioVersions.find(
    (a) => a.id === projectState.project.current_audio_version_id
  );

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col font-sans">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border transition-all text-xs font-medium max-w-md ${
            notification.type === 'success'
              ? 'bg-[#101e19] text-emerald-300 border-emerald-500/40'
              : 'bg-[#201114] text-rose-300 border-rose-500/40'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="flex-1 leading-relaxed">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Studio Header */}
      <Header
        project={projectState?.project || null}
        onBackToProjects={() => selectProject(null)}
        onOpenVisualBible={() => setIsVisualBibleOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        currentVideoVersion={currentVideoVersion}
        currentAudioVersion={currentAudioVersion}
        scenesCount={projectState?.scenes.length || 0}
      />

      {/* Application Content */}
      <main className="flex-1 flex flex-col">
        {!currentProjectId || !projectState ? (
          <ProjectDashboard
            projects={projects}
            onSelectProject={(id) => selectProject(id)}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
            loading={loading}
          />
        ) : (
          <Workspace
            state={projectState}
            onGeneratePlan={handleGeneratePlan}
            onGenerateAllScenes={handleGenerateAllScenes}
            onGenerateScene={handleGenerateScene}
            onUpdateScene={handleUpdateScene}
            onGenerateVideo={handleGenerateVideo}
            onEditVideo={handleEditVideo}
            onSelectVideoVersion={handleSelectVideoVersion}
            onGenerateSoundtrack={handleGenerateSoundtrack}
            onOpenVisualBible={() => setIsVisualBibleOpen(true)}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            loading={loading}
          />
        )}
      </main>

      {/* Visual Bible Modal */}
      {isVisualBibleOpen && projectState && (
        <VisualBibleModal
          visualBible={projectState.project.visual_bible}
          onSave={handleSaveVisualBible}
          onClose={() => setIsVisualBibleOpen(false)}
        />
      )}

      {/* Final Export Modal */}
      {isExportModalOpen && projectState && (
        <ExportModal
          project={projectState.project}
          currentVideoVersion={currentVideoVersion}
          currentAudioVersion={currentAudioVersion}
          exports={projectState.exports}
          onTriggerExport={handleTriggerExport}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
}
