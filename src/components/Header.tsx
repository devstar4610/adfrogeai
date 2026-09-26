/**
 * AdForge AI - Studio Header Component
 * Displays branding, project switcher, multimodal pipeline stage progression,
 * active versions, and primary export action.
 */
import React from 'react';
import {
  Film,
  Sparkles,
  Layers,
  Video,
  Music,
  Download,
  FolderOpen,
  BookOpen,
  CheckCircle2,
  Clock,
  Home,
  ChevronRight,
} from 'lucide-react';
import { Project, VideoVersion, AudioVersion } from '../types/creative';

interface HeaderProps {
  project: Project | null;
  onBackToProjects: () => void;
  onOpenVisualBible: () => void;
  onOpenExportModal: () => void;
  currentVideoVersion?: VideoVersion;
  currentAudioVersion?: AudioVersion;
  scenesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  onBackToProjects,
  onOpenVisualBible,
  onOpenExportModal,
  currentVideoVersion,
  currentAudioVersion,
  scenesCount,
}) => {
  // Determine pipeline stage completion
  const hasPlan = !!project?.plan;
  const hasStoryboard = scenesCount > 0;
  const hasVideo = !!currentVideoVersion;
  const hasAudio = !!currentAudioVersion;

  return (
    <header className="h-16 border-b border-[#232734] bg-[#0d0f15] px-5 flex items-center justify-between z-30 sticky top-0">
      {/* Brand & Project Switcher */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBackToProjects}
          className="flex items-center gap-2.5 text-left group hover:opacity-90 transition cursor-pointer"
          title="Return to Home Dashboard"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base group-hover:text-blue-300 transition-colors">
                AdForge
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Studio
              </span>
            </div>
          </div>
        </button>

        {project ? (
          <>
            <div className="h-5 w-[1px] bg-[#232734]" />
            <button
              onClick={onBackToProjects}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-[#161822] hover:bg-[#1f222e] border border-[#252937] transition font-medium cursor-pointer"
              title="Return to Home / Projects Dashboard"
            >
              <Home className="w-3.5 h-3.5 text-blue-400" />
              <span>Home</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-200 max-w-[220px] truncate">
                {project.title}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {project.duration}s
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="h-5 w-[1px] bg-[#232734]" />
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5 bg-[#12141c] px-2.5 py-1 rounded-md border border-[#232734]">
              <Home className="w-3.5 h-3.5 text-blue-400" />
              <span>Home Dashboard</span>
            </span>
          </>
        )}
      </div>

      {/* Multimodal Pipeline Tracker */}
      {project && (
        <div className="hidden lg:flex items-center gap-1.5 bg-[#12141c] px-3 py-1.5 rounded-full border border-[#232734]">
          <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Brief</span>
          </div>
          <span className="text-slate-600 text-xs">→</span>

          <div
            className={`flex items-center gap-1.5 text-xs font-medium ${
              hasPlan ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            {hasPlan ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
            <span>Plan & Bible</span>
          </div>
          <span className="text-slate-600 text-xs">→</span>

          <div
            className={`flex items-center gap-1.5 text-xs font-medium ${
              hasStoryboard ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Storyboard</span>
          </div>
          <span className="text-slate-600 text-xs">→</span>

          <div
            className={`flex items-center gap-1.5 text-xs font-medium ${
              hasVideo ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Omni Video {currentVideoVersion ? `(v${currentVideoVersion.version_number})` : ''}</span>
          </div>
          <span className="text-slate-600 text-xs">→</span>

          <div
            className={`flex items-center gap-1.5 text-xs font-medium ${
              hasAudio ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Lyria Soundtrack {currentAudioVersion ? `(v${currentAudioVersion.version_number})` : ''}</span>
          </div>
        </div>
      )}

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {project && (
          <>
            <button
              onClick={onOpenVisualBible}
              className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg bg-[#171922] border border-[#2b3040] hover:bg-[#202330] transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Visual Bible</span>
            </button>

            <button
              onClick={onOpenExportModal}
              disabled={!hasVideo}
              className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition ${
                hasVideo
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                  : 'bg-[#1a1d27] text-slate-500 border border-[#232734] cursor-not-allowed'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Compose Final Creative</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
