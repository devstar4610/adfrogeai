/**
 * AdForge AI - Multimodal Timeline Workspace Component
 * Visualizes the 20s commercial cue sheet: Video shot sequence, scene durations,
 * camera transitions, dynamic audio energy curve, and soundtrack alignment.
 */
import React from 'react';
import { Scene, Project, VideoVersion, AudioVersion } from '../types/creative';
import { Film, Music, Zap, Clock, Camera } from 'lucide-react';

interface TimelineWorkspaceProps {
  project: Project;
  scenes: Scene[];
  currentVideoVersion?: VideoVersion;
  currentAudioVersion?: AudioVersion;
}

export const TimelineWorkspace: React.FC<TimelineWorkspaceProps> = ({
  project,
  scenes,
  currentVideoVersion,
  currentAudioVersion,
}) => {
  const totalDuration = project.duration || 20;

  // Compute timing for each scene
  let accumulated = 0;
  const timedScenes = scenes.map((s) => {
    const start = accumulated;
    accumulated += s.duration;
    return {
      ...s,
      start,
      end: accumulated,
      widthPercent: (s.duration / totalDuration) * 100,
    };
  });

  return (
    <div className="bg-[#12141c] border border-[#232734] rounded-2xl p-5 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Commercial Production Timeline ({totalDuration}s)
          </h3>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-500" />
            <span>Video Track {currentVideoVersion ? `(v${currentVideoVersion.version_number})` : ''}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-indigo-500" />
            <span>Audio Track {currentAudioVersion ? `(v${currentAudioVersion.version_number})` : ''}</span>
          </span>
        </div>
      </div>

      {/* Time Ruler */}
      <div className="relative h-6 border-b border-[#232734] text-[10px] text-slate-500 font-mono flex justify-between px-1">
        {Array.from({ length: Math.floor(totalDuration / 4) + 1 }).map((_, i) => {
          const sec = i * 4;
          return (
            <span key={i} className="flex flex-col items-center">
              <span>{sec}s</span>
              <span className="w-px h-1.5 bg-[#232734]" />
            </span>
          );
        })}
      </div>

      {/* Video Shots Track */}
      <div className="space-y-1">
        <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
          <Film className="w-3.5 h-3.5 text-blue-400" />
          <span>Video Shots (Sequential Storyboard)</span>
        </div>

        <div className="h-20 bg-[#090a0f] border border-[#232734] rounded-xl flex overflow-hidden p-1 gap-1">
          {timedScenes.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-600">
              Generate Creative Plan to establish scene timeline
            </div>
          ) : (
            timedScenes.map((scene) => (
              <div
                key={scene.id}
                style={{ width: `${scene.widthPercent}%` }}
                className="h-full rounded-lg bg-[#161924] border border-[#272c3d] p-2 flex flex-col justify-between overflow-hidden relative group hover:border-blue-500/50 transition cursor-pointer"
              >
                {/* Background image preview if available */}
                {scene.image_url && (
                  <img
                    src={scene.image_url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-40 transition"
                  />
                )}

                <div className="relative z-10 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-white truncate">
                    S{scene.scene_number}: {scene.title}
                  </span>
                  <span className="text-[10px] font-mono text-blue-300 bg-blue-900/60 px-1 rounded">
                    {scene.duration}s
                  </span>
                </div>

                <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate">{scene.camera}</span>
                  <span className="capitalize text-slate-500">{scene.energy_level}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Audio Energy Curve Track */}
      <div className="space-y-1">
        <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
          <Music className="w-3.5 h-3.5 text-indigo-400" />
          <span>Adaptive Soundtrack Energy Curve</span>
        </div>

        <div className="h-14 bg-[#090a0f] border border-[#232734] rounded-xl flex overflow-hidden p-1 gap-1">
          {timedScenes.map((scene) => {
            const energyHeights: Record<string, string> = {
              low: 'h-1/3 bg-indigo-600/30 border-indigo-500/40',
              medium: 'h-1/2 bg-indigo-600/50 border-indigo-500/60',
              high: 'h-3/4 bg-blue-600/70 border-blue-400',
              climax: 'h-full bg-cyan-500 border-cyan-300 shadow-md shadow-cyan-500/30',
            };

            return (
              <div
                key={scene.id}
                style={{ width: `${scene.widthPercent}%` }}
                className="h-full rounded-lg bg-[#141620] border border-[#202533] p-1.5 flex flex-col justify-end"
              >
                <div
                  className={`w-full rounded transition-all border ${
                    energyHeights[scene.energy_level] || 'h-1/2 bg-indigo-600/40'
                  }`}
                />
                <span className="text-[9px] uppercase font-mono text-slate-400 text-center mt-1 truncate">
                  {scene.energy_level}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
