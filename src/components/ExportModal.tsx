/**
 * AdForge AI - Export & Media Composition Modal Component
 * Triggers FFmpeg server-side rendering to mux video and adaptive soundtrack
 * into a broadcast-ready MP4 commercial with instant download and playback.
 */
import React, { useState } from 'react';
import {
  X,
  Download,
  Film,
  Music,
  Sparkles,
  CheckCircle2,
  Play,
  FileVideo,
  Clock,
  Layers,
} from 'lucide-react';
import { Project, VideoVersion, AudioVersion, ExportRecord } from '../types/creative';

interface ExportModalProps {
  project: Project;
  currentVideoVersion?: VideoVersion;
  currentAudioVersion?: AudioVersion;
  exports: ExportRecord[];
  onTriggerExport: () => Promise<ExportRecord>;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  project,
  currentVideoVersion,
  currentAudioVersion,
  exports,
  onTriggerExport,
  onClose,
}) => {
  const [rendering, setRendering] = useState(false);
  const [latestExport, setLatestExport] = useState<ExportRecord | null>(
    exports.length > 0 ? exports[0] : null
  );
  const [error, setError] = useState<string | null>(null);

  const handleCompose = async () => {
    try {
      setRendering(true);
      setError(null);
      const res = await onTriggerExport();
      setLatestExport(res);
    } catch (err: any) {
      setError(err.message || 'Composition failed');
    } finally {
      setRendering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#12141c] border border-[#232734] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232734] bg-[#0e1017]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Final Creative Composition (FFmpeg)</h2>
              <p className="text-xs text-slate-400">
                Multiplexes Omni Flash synthesized video and Lyria soundtrack into broadcast MP4.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a1d27]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Track Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#090a0f] border border-[#232734] rounded-xl p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileVideo className="w-3.5 h-3.5 text-blue-400" />
                <span>Video Track</span>
              </span>
              <span className="text-sm font-bold text-white block">
                {currentVideoVersion ? `Cut v${currentVideoVersion.version_number}` : 'None'}
              </span>
              <span className="text-[11px] text-slate-400 truncate block">
                {currentVideoVersion?.user_instruction || 'Initial synthesis'}
              </span>
            </div>

            <div className="bg-[#090a0f] border border-[#232734] rounded-xl p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-indigo-400" />
                <span>Soundtrack Track</span>
              </span>
              <span className="text-sm font-bold text-white block">
                {currentAudioVersion ? `Score v${currentAudioVersion.version_number}` : 'None (Muted)'}
              </span>
              <span className="text-[11px] text-slate-400 truncate block">
                {currentAudioVersion?.mood || 'No soundtrack'}
              </span>
            </div>
          </div>

          {/* Render Action Button */}
          {!latestExport && !rendering && (
            <div className="text-center py-6 border border-dashed border-[#232734] rounded-xl space-y-3">
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Ready to compose the final commercial with synchronized audio, duration alignment, and standard broadcast H.264 / AAC encoding.
              </p>
              <button
                onClick={handleCompose}
                disabled={!currentVideoVersion}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition disabled:opacity-40 inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Render Final MP4 via FFmpeg</span>
              </button>
            </div>
          )}

          {/* Rendering Progress */}
          {rendering && (
            <div className="p-8 text-center bg-[#090a0f] border border-blue-500/20 rounded-xl space-y-3">
              <Sparkles className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
              <h4 className="text-sm font-bold text-white">Composing Final Advertisement...</h4>
              <p className="text-xs text-slate-400">
                Running FFmpeg multiplexing, audio volume normalization, and keyframe indexing.
              </p>
            </div>
          )}

          {/* Render Result Preview */}
          {latestExport && !rendering && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Final Commercial Rendered Successfully</span>
                </span>
                <span className="text-slate-400 font-mono">
                  {(latestExport.file_size / (1024 * 1024)).toFixed(2)} MB • {latestExport.resolution}
                </span>
              </div>

              {/* Playable Video */}
              <div className="aspect-video bg-black rounded-xl overflow-hidden border border-[#232734] shadow-lg">
                <video
                  src={latestExport.export_url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleCompose}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  Re-render composition
                </button>

                <a
                  href={latestExport.export_url}
                  download={`adforge_${project.title.replace(/\s+/g, '_')}_final.mp4`}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Final Advertisement</span>
                </a>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
