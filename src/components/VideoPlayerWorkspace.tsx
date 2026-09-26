/**
 * AdForge AI - Video Player & Version Studio Component
 * Plays continuous synthesized commercials from Gemini Omni Flash,
 * displays version lineage (v1, v2, v3), and maps scene markers on playback scrubber.
 */
import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  History,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { VideoVersion, Scene, Project } from '../types/creative';

interface VideoPlayerWorkspaceProps {
  project: Project;
  videoVersions: VideoVersion[];
  currentVersionId?: string;
  scenes: Scene[];
  onSelectVersion: (versionId: string) => Promise<void>;
  onGenerateInitialVideo: () => Promise<void>;
  loading: boolean;
}

export const VideoPlayerWorkspace: React.FC<VideoPlayerWorkspaceProps> = ({
  project,
  videoVersions,
  currentVersionId,
  scenes,
  onSelectVersion,
  onGenerateInitialVideo,
  loading,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Active version
  const activeVersion =
    videoVersions.find((v) => v.id === currentVersionId) ||
    videoVersions[videoVersions.length - 1];

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [activeVersion?.id]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  // Calculate scene time offsets
  let accumulated = 0;
  const sceneMarkers = scenes.map((s) => {
    const start = accumulated;
    accumulated += s.duration;
    return {
      scene_number: s.scene_number,
      title: s.title,
      start,
      end: accumulated,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Bar with Version History */}
      <div className="bg-[#12141c] border border-[#232734] rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Gemini Omni Flash Video Pipeline</h3>
            {activeVersion && (
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
                Version {activeVersion.version_number}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous commercial synthesis anchoring Visual Bible subjects across sequential scenes.
          </p>
        </div>

        {/* Version Switcher */}
        {videoVersions.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-slate-500 font-medium">Revisions:</span>
            {videoVersions.map((v) => {
              const isActive = v.id === activeVersion?.id;
              return (
                <button
                  key={v.id}
                  onClick={() => onSelectVersion(v.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'bg-[#171922] text-slate-400 hover:text-white border border-[#252937]'
                  }`}
                >
                  <span>v{v.version_number}</span>
                  {isActive && <CheckCircle2 className="w-3 h-3 text-blue-200" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Video Stage */}
      {videoVersions.length === 0 ? (
        <div className="bg-[#12141c] border border-[#232734] rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-4">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">No Video Synthesized Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
            Synthesize the initial commercial video (`v1`) using <span className="text-blue-400 font-semibold">Gemini Omni Flash</span> (`gemini-omni-1.1-flash`).
            It will synthesize all approved storyboard frames into a cohesive continuous commercial.
          </p>
          <button
            onClick={onGenerateInitialVideo}
            disabled={loading || scenes.length === 0}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Synthesize Video v1 via Gemini Omni Flash</span>
          </button>
        </div>
      ) : (
        <div className="bg-[#12141c] border border-[#232734] rounded-2xl overflow-hidden shadow-2xl">
          {/* Active Version Lineage Pill */}
          <div className="bg-[#0e1017] px-4 py-2 border-b border-[#232734] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-semibold text-white">Cut v{activeVersion.version_number}:</span>
              <span className="text-slate-400 italic">"{activeVersion.user_instruction}"</span>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={activeVersion.video_url}
                download={`adforge_${project.title.replace(/\s+/g, '_')}_v${activeVersion.version_number}.mp4`}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition"
                title="Download MP4"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download MP4</span>
              </a>
            </div>
          </div>

          {/* Video Player */}
          <div className="relative aspect-video bg-black flex items-center justify-center group">
            <video
              ref={videoRef}
              src={activeVersion.video_url}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              className="w-full h-full object-contain"
            />

            {/* Center Play Overlay */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute w-16 h-16 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white flex items-center justify-center shadow-2xl hover:scale-105 transition"
              >
                <Play className="w-7 h-7 ml-1" />
              </button>
            )}

            {/* Bottom Scrubber & Controls */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 flex flex-col gap-2 opacity-95">
              {/* Scene Timestamp Markers Bar */}
              <div className="flex items-center gap-1 w-full text-[10px] text-slate-400">
                {sceneMarkers.map((marker, idx) => {
                  const widthPercent = ((marker.end - marker.start) / project.duration) * 100;
                  const isCurrent = currentTime >= marker.start && currentTime <= marker.end;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSeek(marker.start)}
                      style={{ width: `${widthPercent}%` }}
                      className={`truncate py-0.5 px-1.5 rounded transition text-left ${
                        isCurrent
                          ? 'bg-blue-500/40 text-blue-200 border border-blue-400/50'
                          : 'bg-white/10 hover:bg-white/20 text-slate-300'
                      }`}
                      title={`Jump to Scene ${marker.scene_number} (${marker.start}s - ${marker.end}s)`}
                    >
                      Scene {marker.scene_number}
                    </button>
                  );
                })}
              </div>

              {/* Progress Slider */}
              <input
                type="range"
                min={0}
                max={duration || project.duration}
                step={0.1}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />

              {/* Action Buttons */}
              <div className="flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-3">
                  <button onClick={togglePlay} className="hover:text-blue-400 transition">
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleSeek(0)} className="hover:text-blue-400 transition">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button onClick={toggleMute} className="hover:text-blue-400 transition">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="font-mono text-[11px] text-slate-300">
                    {currentTime.toFixed(1)}s / {(duration || project.duration).toFixed(1)}s
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={toggleFullscreen} className="hover:text-blue-400 transition">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
