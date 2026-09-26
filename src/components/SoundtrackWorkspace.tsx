/**
 * AdForge AI - Lyria 3.5 Adaptive Soundtrack Studio Component
 * Controls timeline-aware music generation, dynamic intensity curves,
 * audio versioning (Audio v1, v2), and synchronized audio playback.
 */
import React, { useRef, useState, useEffect } from 'react';
import {
  Music,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
  Sliders,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { AudioVersion, Project, Scene } from '../types/creative';

interface SoundtrackWorkspaceProps {
  project: Project;
  audioVersions: AudioVersion[];
  currentAudioVersionId?: string;
  scenes: Scene[];
  onGenerateSoundtrack: (params: {
    mood?: string;
    energy_level?: 'low' | 'medium' | 'high' | 'ultra';
    user_instruction?: string;
  }) => Promise<void>;
  loading: boolean;
}

export const SoundtrackWorkspace: React.FC<SoundtrackWorkspaceProps> = ({
  project,
  audioVersions,
  currentAudioVersionId,
  scenes,
  onGenerateSoundtrack,
  loading,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Form states
  const [mood, setMood] = useState('Cinematic Futuristic');
  const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high' | 'ultra'>('high');
  const [instruction, setInstruction] = useState('');

  const activeAudio =
    audioVersions.find((a) => a.id === currentAudioVersionId) ||
    audioVersions[audioVersions.length - 1];

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [activeAudio?.id]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    await onGenerateSoundtrack({
      mood,
      energy_level: energyLevel,
      user_instruction: instruction || undefined,
    });
    setInstruction('');
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="bg-[#12141c] border border-[#232734] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Lyria 3.5 Adaptive Soundtrack Studio</h3>
            {activeAudio && (
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
                Score v{activeAudio.version_number}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronizes musical crescendo with scene duration and emotional energy curves.
          </p>
        </div>

        {/* Audio Versions Pills */}
        {audioVersions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Scores:</span>
            {audioVersions.map((a) => {
              const isActive = a.id === activeAudio?.id;
              return (
                <div
                  key={a.id}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'bg-[#171922] text-slate-400 border border-[#252937]'
                  }`}
                >
                  <span>Score v{a.version_number}</span>
                  {isActive && <CheckCircle2 className="w-3 h-3 text-blue-200" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Lyria Score Control Panel */}
        <div className="lg:col-span-5 bg-[#12141c] border border-[#232734] rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <span>Soundtrack Parameters</span>
          </h4>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">Acoustic Mood</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full mt-1.5 p-2 bg-[#090a0f] border border-[#232734] rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Cinematic Futuristic">Cinematic Futuristic (Synth & Orchestra)</option>
                <option value="Energetic Cyberpunk">Energetic Cyberpunk (Fast BPM, Heavy Pulse)</option>
                <option value="Emotional Orchestral">Emotional Orchestral (Strings & Piano)</option>
                <option value="Dramatic Tension">Dramatic Tension (Deep Sub-Bass & Builds)</option>
                <option value="Minimal Modern">Minimal Modern Commercial (Crisp Beats)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-slate-300">Energy Intensity Curve</span>
                <span className="text-blue-400 font-bold uppercase">{energyLevel}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(['low', 'medium', 'high', 'ultra'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setEnergyLevel(lvl)}
                    className={`py-1.5 rounded-lg text-[11px] font-semibold uppercase transition border ${
                      energyLevel === lvl
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-[#090a0f] text-slate-400 border-[#232734] hover:border-slate-600'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Director Audio Revision Note</label>
              <textarea
                rows={3}
                placeholder="e.g. Make the music more energetic during the acceleration scene, and triumphant at product reveal."
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                className="w-full mt-1.5 p-2.5 bg-[#090a0f] border border-[#232734] rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {loading
                  ? 'Generating Lyria Score...'
                  : activeAudio
                  ? 'Generate Revised Audio Cut'
                  : 'Score Soundtrack via Lyria 3.5'}
              </span>
            </button>
          </form>
        </div>

        {/* Right: Audio Player & Waveform Representation */}
        <div className="lg:col-span-7 bg-[#12141c] border border-[#232734] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-blue-400" />
                <h4 className="text-sm font-bold text-white">Active Soundtrack Playback</h4>
              </div>
              {activeAudio && (
                <a
                  href={activeAudio.audio_url}
                  download={`adforge_soundtrack_v${activeAudio.version_number}.wav`}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download WAV</span>
                </a>
              )}
            </div>

            {!activeAudio ? (
              <div className="h-44 flex flex-col items-center justify-center border border-dashed border-[#232734] rounded-xl text-center p-6">
                <Music className="w-8 h-8 text-slate-600 mb-2" />
                <span className="text-xs text-slate-400">
                  No adaptive soundtrack generated yet. Adjust parameters and click "Score Soundtrack".
                </span>
              </div>
            ) : (
              <div className="space-y-5">
                <audio
                  ref={audioRef}
                  src={activeAudio.audio_url}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                />

                {/* Simulated Audio Waveform Bar Visualizer */}
                <div className="h-28 bg-[#090a0f] border border-[#232734] rounded-xl p-4 flex items-end justify-between gap-1 overflow-hidden relative">
                  {/* Waveform bars */}
                  {Array.from({ length: 48 }).map((_, i) => {
                    const height = Math.sin(i * 0.3) * 35 + 45 + ((i % 5) * 6);
                    const progress = (currentTime / (duration || project.duration)) * 48;
                    const isPlayed = i <= progress;

                    return (
                      <div
                        key={i}
                        style={{ height: `${height}%` }}
                        className={`w-full rounded-t-sm transition-colors ${
                          isPlayed ? 'bg-blue-500' : 'bg-slate-700/60'
                        }`}
                      />
                    );
                  })}

                  {/* Playhead bar */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                    style={{
                      left: `${(currentTime / (duration || project.duration)) * 100}%`,
                    }}
                  />
                </div>

                {/* Time & Duration */}
                <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                  <span>{currentTime.toFixed(1)}s</span>
                  <span>{(duration || project.duration).toFixed(1)}s</span>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => handleSeek(0)}
                    className="p-2 rounded-full hover:bg-[#1a1d27] text-slate-400 hover:text-white"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 transition hover:scale-105"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>

                  <button
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.muted = !isMuted;
                        setIsMuted(!isMuted);
                      }
                    }}
                    className="p-2 rounded-full hover:bg-[#1a1d27] text-slate-400 hover:text-white"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {activeAudio?.user_instruction && (
            <div className="mt-4 pt-3 border-t border-[#232734] text-[11px] text-slate-400 flex items-center gap-2">
              <span className="font-semibold text-slate-300">Director Note:</span>
              <span className="italic">"{activeAudio.user_instruction}"</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
