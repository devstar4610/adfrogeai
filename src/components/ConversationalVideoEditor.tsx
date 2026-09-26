/**
 * AdForge AI - Conversational Video Editor Component
 * Chat-based AI video editing engine maintaining multi-turn context via the
 * Gemini Interactions API (previous_interaction_id) and strict Visual Bible preservation.
 */
import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  Layers,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { VideoEdit, VideoVersion, Scene } from '../types/creative';

interface ConversationalVideoEditorProps {
  videoEdits: VideoEdit[];
  currentVersion?: VideoVersion;
  scenes: Scene[];
  onApplyEdit: (instruction: string, targetSceneNumber?: number) => Promise<void>;
  loading: boolean;
}

export const ConversationalVideoEditor: React.FC<ConversationalVideoEditorProps> = ({
  videoEdits,
  currentVersion,
  scenes,
  onApplyEdit,
  loading,
}) => {
  const [instruction, setInstruction] = useState('');
  const [targetSceneNumber, setTargetSceneNumber] = useState<number | undefined>(undefined);

  const presets = [
    'Make scene 2 darker and give the camera a low-angle movement while keeping the motorcycle design unchanged.',
    'Increase neon-cyan lighting reflections on wet pavement during the acceleration scene.',
    'Make the final brand reveal in scene 5 slower and more cinematic.',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || loading) return;

    const text = instruction.trim();
    setInstruction('');
    await onApplyEdit(text, targetSceneNumber);
  };

  return (
    <div className="bg-[#12141c] border border-[#232734] rounded-2xl flex flex-col h-[520px] shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[#232734] bg-[#0e1017] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <span>Conversational AI Video Editor</span>
              {currentVersion && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Editing Cut v{currentVersion.version_number}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactions API with accumulated context memory & non-destructive revision.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3 h-3" />
          <span>Visual Bible Protected</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Initial Bot Welcome */}
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-600/30">
            <Bot className="w-4 h-4" />
          </div>
          <div className="bg-[#171922] border border-[#252937] p-3 rounded-2xl rounded-tl-none max-w-[85%] text-xs text-slate-300 space-y-1.5">
            <p className="font-semibold text-white">Director AI Assistant:</p>
            <p className="leading-relaxed">
              I have loaded your complete Creative Plan and Visual Bible. You can request any natural language revision (e.g. lighting adjustments, camera maneuvers, pacing shifts).
            </p>
            <p className="text-[11px] text-blue-300">
              Every revision will synthesize a new Video Version while strictly preserving unchanged scenes and hero product continuity.
            </p>
          </div>
        </div>

        {/* History of Edits */}
        {videoEdits.map((edit, idx) => (
          <React.Fragment key={edit.id || idx}>
            {/* User message */}
            <div className="flex items-start gap-3 justify-end">
              <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none max-w-[80%] text-xs shadow-md shadow-blue-600/20 space-y-1">
                <p className="font-medium">{edit.instruction}</p>
                {edit.target_scene_number && (
                  <span className="inline-block text-[10px] bg-blue-700/60 px-2 py-0.5 rounded font-mono">
                    Target: Scene {edit.target_scene_number}
                  </span>
                )}
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                <User className="w-4 h-4" />
              </div>
            </div>

            {/* AI Response message */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#171922] border border-[#252937] p-3 rounded-2xl rounded-tl-none max-w-[85%] text-xs text-slate-300 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Cut Generated</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Success
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {edit.ai_interpretation}
                </p>
              </div>
            </div>
          </React.Fragment>
        ))}

        {loading && (
          <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
            <Sparkles className="w-4 h-4 animate-spin text-blue-400" />
            <span>Gemini Omni Flash is synthesizing the revised cut...</span>
          </div>
        )}
      </div>

      {/* Preset Suggestions */}
      <div className="px-4 py-2 border-t border-[#232734] bg-[#0e1017] flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] text-slate-500 font-semibold uppercase shrink-0">Suggestions:</span>
        {presets.map((preset, i) => (
          <button
            key={i}
            onClick={() => setInstruction(preset)}
            className="text-[11px] text-slate-300 hover:text-white bg-[#171922] hover:bg-[#1f222e] border border-[#252937] px-2.5 py-1 rounded-full whitespace-nowrap transition shrink-0"
          >
            {preset.slice(0, 48)}...
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="p-3 bg-[#12141c] border-t border-[#232734] flex items-center gap-2">
        {/* Optional Target Scene Selector */}
        <select
          value={targetSceneNumber || ''}
          onChange={(e) => setTargetSceneNumber(e.target.value ? Number(e.target.value) : undefined)}
          className="bg-[#090a0f] border border-[#232734] rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Scenes</option>
          {scenes.map((s) => (
            <option key={s.id} value={s.scene_number}>
              Scene {s.scene_number}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="e.g. Make scene 2 darker and give camera a low-angle movement..."
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          disabled={loading}
          className="flex-1 bg-[#090a0f] border border-[#232734] rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
        />

        <button
          type="submit"
          disabled={!instruction.trim() || loading}
          className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-md shadow-blue-600/30 transition disabled:opacity-40"
          title="Apply Revision"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
