/**
 * AdForge AI - Master Workspace Component
 * Unifies Creative Planning, Storyboarding, Video Generation & Conversational Editing,
 * Adaptive Soundtrack Scoring, and Timeline Composition into one cohesive studio.
 */
import React, { useState } from 'react';
import {
  Layers,
  Video,
  Music,
  MessageSquare,
  Sparkles,
  BookOpen,
  Film,
  Download,
  Info,
  Clock,
  Zap,
} from 'lucide-react';
import { ProjectStateResponse, Scene, VisualBible, ExportRecord } from '../types/creative';
import { StoryboardWorkspace } from './StoryboardWorkspace';
import { VideoPlayerWorkspace } from './VideoPlayerWorkspace';
import { ConversationalVideoEditor } from './ConversationalVideoEditor';
import { SoundtrackWorkspace } from './SoundtrackWorkspace';
import { TimelineWorkspace } from './TimelineWorkspace';

interface WorkspaceProps {
  state: ProjectStateResponse;
  onGeneratePlan: () => Promise<void>;
  onGenerateAllScenes: () => Promise<void>;
  onGenerateScene: (sceneId: string, alternativePrompt?: string) => Promise<void>;
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => Promise<void>;
  onGenerateVideo: () => Promise<void>;
  onEditVideo: (instruction: string, targetSceneNumber?: number) => Promise<void>;
  onSelectVideoVersion: (versionId: string) => Promise<void>;
  onGenerateSoundtrack: (params: {
    mood?: string;
    energy_level?: 'low' | 'medium' | 'high' | 'ultra';
    user_instruction?: string;
  }) => Promise<void>;
  onOpenVisualBible: () => void;
  onOpenExportModal: () => void;
  loading: boolean;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  state,
  onGeneratePlan,
  onGenerateAllScenes,
  onGenerateScene,
  onUpdateScene,
  onGenerateVideo,
  onEditVideo,
  onSelectVideoVersion,
  onGenerateSoundtrack,
  onOpenVisualBible,
  onOpenExportModal,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState<'storyboard' | 'video' | 'editor' | 'audio' | 'overview'>('storyboard');

  const { project, scenes, videoVersions, videoEdits, audioVersions } = state;

  const currentVideoVersion =
    videoVersions.find((v) => v.id === project.current_video_version_id) ||
    videoVersions[videoVersions.length - 1];

  const currentAudioVersion =
    audioVersions.find((a) => a.id === project.current_audio_version_id) ||
    audioVersions[audioVersions.length - 1];

  return (
    <div className="flex-1 flex flex-col bg-[#090a0f] text-slate-100 min-h-[calc(100vh-4rem)]">
      {/* Studio Navigation Sub-Bar */}
      <div className="bg-[#0e1017] border-b border-[#232734] px-6 flex items-center justify-between sticky top-16 z-20">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('storyboard')}
            className={`py-3.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition shrink-0 ${
              activeTab === 'storyboard'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Storyboard ({scenes.length} Frames)</span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`py-3.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition shrink-0 ${
              activeTab === 'video'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>2. Video Synthesis {videoVersions.length > 0 ? `(v${videoVersions.length})` : ''}</span>
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`py-3.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition shrink-0 ${
              activeTab === 'editor'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>3. Conversational Video Editor ({videoEdits.length} Edits)</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`py-3.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition shrink-0 ${
              activeTab === 'audio'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>4. Adaptive Soundtrack {audioVersions.length > 0 ? `(v${audioVersions.length})` : ''}</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition shrink-0 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Creative Brief & Plan</span>
          </button>
        </div>

        {/* Quick status */}
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>All AI APIs Online</span>
          </span>
        </div>
      </div>

      {/* Main Workspace Stage */}
      <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-8">
        {activeTab === 'storyboard' && (
          <StoryboardWorkspace
            project={project}
            scenes={scenes}
            onGeneratePlan={onGeneratePlan}
            onGenerateAllScenes={onGenerateAllScenes}
            onGenerateScene={onGenerateScene}
            onUpdateScene={onUpdateScene}
            loading={loading}
          />
        )}

        {activeTab === 'video' && (
          <VideoPlayerWorkspace
            project={project}
            videoVersions={videoVersions}
            currentVersionId={project.current_video_version_id}
            scenes={scenes}
            onSelectVersion={onSelectVideoVersion}
            onGenerateInitialVideo={onGenerateVideo}
            loading={loading}
          />
        )}

        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <VideoPlayerWorkspace
                project={project}
                videoVersions={videoVersions}
                currentVersionId={project.current_video_version_id}
                scenes={scenes}
                onSelectVersion={onSelectVideoVersion}
                onGenerateInitialVideo={onGenerateVideo}
                loading={loading}
              />
            </div>
            <div className="lg:col-span-5">
              <ConversationalVideoEditor
                videoEdits={videoEdits}
                currentVersion={currentVideoVersion}
                scenes={scenes}
                onApplyEdit={onEditVideo}
                loading={loading}
              />
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <SoundtrackWorkspace
            project={project}
            audioVersions={audioVersions}
            currentAudioVersionId={project.current_audio_version_id}
            scenes={scenes}
            onGenerateSoundtrack={onGenerateSoundtrack}
            loading={loading}
          />
        )}

        {activeTab === 'overview' && (
          <div className="bg-[#12141c] border border-[#232734] rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white mb-2">Creative Brief & Campaign Target</h3>
              <p className="text-sm text-slate-300 leading-relaxed bg-[#090a0f] border border-[#232734] p-4 rounded-xl">
                {project.brief}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-[#090a0f] border border-[#232734] rounded-xl space-y-1">
                <span className="text-slate-500 font-semibold uppercase">Target Audience</span>
                <p className="text-white font-medium">{project.target_audience}</p>
              </div>
              <div className="p-4 bg-[#090a0f] border border-[#232734] rounded-xl space-y-1">
                <span className="text-slate-500 font-semibold uppercase">Commercial Duration</span>
                <p className="text-white font-medium">{project.duration} Seconds</p>
              </div>
              <div className="p-4 bg-[#090a0f] border border-[#232734] rounded-xl space-y-1">
                <span className="text-slate-500 font-semibold uppercase">Visual Aesthetic</span>
                <p className="text-white font-medium">{project.visual_style}</p>
              </div>
            </div>

            {project.plan && (
              <div className="pt-4 border-t border-[#232734] space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Structured Creative Plan Directives
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-[#090a0f] border border-[#232734] rounded-lg">
                    <span className="text-slate-500 block">Color Direction</span>
                    <span className="text-slate-200 mt-1 block">{project.plan.color_direction}</span>
                  </div>
                  <div className="p-3 bg-[#090a0f] border border-[#232734] rounded-lg">
                    <span className="text-slate-500 block">Camera Language</span>
                    <span className="text-slate-200 mt-1 block">{project.plan.camera_language}</span>
                  </div>
                  <div className="p-3 bg-[#090a0f] border border-[#232734] rounded-lg">
                    <span className="text-slate-500 block">Soundtrack Scoring Direction</span>
                    <span className="text-slate-200 mt-1 block">{project.plan.music_direction}</span>
                  </div>
                  <div className="p-3 bg-[#090a0f] border border-[#232734] rounded-lg">
                    <span className="text-slate-500 block">Hero Narrative Tone</span>
                    <span className="text-slate-200 mt-1 block">{project.plan.tone}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Multimodal Timeline (Always available at the base) */}
        <div className="pt-4">
          <TimelineWorkspace
            project={project}
            scenes={scenes}
            currentVideoVersion={currentVideoVersion}
            currentAudioVersion={currentAudioVersion}
          />
        </div>
      </div>
    </div>
  );
};
