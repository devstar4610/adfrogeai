/**
 * AdForge AI - Storyboard Workspace Component
 * Visualizes individual scene cards, allows generation via Nano Banana 2 Lite,
 * alternative generation, prompt inspection, and scene locking.
 */
import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Unlock,
  RefreshCw,
  Camera,
  Sun,
  Eye,
  Edit2,
  Check,
  AlertCircle,
  Clock,
  Layers,
  Zap,
} from 'lucide-react';
import { Scene, Project, CreativePlan } from '../types/creative';

interface StoryboardWorkspaceProps {
  project: Project;
  scenes: Scene[];
  onGeneratePlan: () => Promise<void>;
  onGenerateAllScenes: () => Promise<void>;
  onGenerateScene: (sceneId: string, alternativePrompt?: string) => Promise<void>;
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => Promise<void>;
  loading: boolean;
}

export const StoryboardWorkspace: React.FC<StoryboardWorkspaceProps> = ({
  project,
  scenes,
  onGeneratePlan,
  onGenerateAllScenes,
  onGenerateScene,
  onUpdateScene,
  loading,
}) => {
  const [selectedSceneForAlternative, setSelectedSceneForAlternative] = useState<Scene | null>(null);
  const [alternativePrompt, setAlternativePrompt] = useState('');
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);
  const [inspectingPromptScene, setInspectingPromptScene] = useState<Scene | null>(null);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);

  const plan = project.plan;
  const lockedCount = scenes.filter((s) => s.is_locked).length;

  const handleSingleGenerate = async (scene: Scene) => {
    try {
      setGeneratingSceneId(scene.id);
      await onGenerateScene(scene.id);
    } finally {
      setGeneratingSceneId(null);
    }
  };

  const handleAlternativeSubmit = async () => {
    if (!selectedSceneForAlternative) return;
    try {
      setGeneratingSceneId(selectedSceneForAlternative.id);
      await onGenerateScene(selectedSceneForAlternative.id, alternativePrompt);
      setSelectedSceneForAlternative(null);
      setAlternativePrompt('');
    } finally {
      setGeneratingSceneId(null);
    }
  };

  const handleToggleLock = async (scene: Scene) => {
    await onUpdateScene(scene.id, { is_locked: !scene.is_locked });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-[#12141c] border border-[#232734] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Storyboard Studio & Visual Asset Deck
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Rapid visual grounding powered by <span className="text-blue-400 font-semibold">Nano Banana 2 Lite</span> (`gemini-3.1-flash-lite-image`).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!plan ? (
            <button
              onClick={onGeneratePlan}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/30 transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Creative Plan & Storyboard</span>
            </button>
          ) : (
            <>
              <button
                onClick={onGeneratePlan}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#171922] hover:bg-[#1f222e] text-slate-300 hover:text-white border border-[#2b3040] rounded-lg text-xs font-medium transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Re-Plan Brief</span>
              </button>

              <button
                onClick={onGenerateAllScenes}
                disabled={loading || scenes.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/30 transition disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate All Unlocked Frames</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Plan Details Card if present */}
      {plan && (
        <div className="bg-[#10121a] border border-[#232734] rounded-xl p-4 text-xs text-slate-300 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <span className="text-slate-500 block font-medium">Commercial Concept</span>
            <span className="text-white font-semibold line-clamp-2 mt-0.5">{plan.concept}</span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Tone & Pace</span>
            <span className="text-white font-semibold mt-0.5">{plan.tone}</span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Visual Style</span>
            <span className="text-white font-semibold mt-0.5">{plan.visual_style}</span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Continuity Anchors</span>
            <span className="text-blue-400 font-semibold mt-0.5">
              {project.visual_bible.products.length} Products, {lockedCount} Locked Scenes
            </span>
          </div>
        </div>
      )}

      {/* Scenes Grid */}
      {scenes.length === 0 ? (
        <div className="bg-[#12141c] border border-dashed border-[#2b3040] rounded-2xl p-12 text-center">
          <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">Storyboard Uninitialized</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Click "Generate Creative Plan" to convert your campaign brief into a sequential 5-shot commercial storyboard.
          </p>
          <button
            onClick={onGeneratePlan}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            Generate Creative Plan Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {scenes.map((scene) => {
            const isGenerating = scene.status === 'generating' || generatingSceneId === scene.id;

            return (
              <div
                key={scene.id}
                className={`bg-[#12141c] border rounded-xl overflow-hidden flex flex-col justify-between transition ${
                  scene.is_locked ? 'border-amber-500/40' : 'border-[#232734] hover:border-blue-500/40'
                }`}
              >
                {/* Scene Header */}
                <div className="p-3.5 border-b border-[#1c202b] flex items-center justify-between bg-[#0e1017]">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                      {scene.scene_number}
                    </span>
                    <h4 className="text-xs font-bold text-white truncate max-w-[140px]">
                      {scene.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                      {scene.duration}s
                    </span>

                    <button
                      onClick={() => handleToggleLock(scene)}
                      className={`p-1.5 rounded transition ${
                        scene.is_locked
                          ? 'text-amber-400 hover:bg-amber-400/10'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-[#1a1d27]'
                      }`}
                      title={scene.is_locked ? 'Scene is locked' : 'Lock scene against regeneration'}
                    >
                      {scene.is_locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Visual Preview Container */}
                <div className="relative aspect-video bg-[#090a0f] flex items-center justify-center overflow-hidden border-b border-[#1c202b]">
                  {scene.image_url ? (
                    <img
                      src={scene.image_url}
                      alt={`Scene ${scene.scene_number}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <Camera className="w-7 h-7 text-slate-700 mx-auto mb-1.5" />
                      <span className="text-[11px] text-slate-500 block">Frame not rendered</span>
                    </div>
                  )}

                  {/* Loading overlay */}
                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white">
                      <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                      <span className="text-xs font-semibold text-blue-300">Nano Banana Rendering...</span>
                    </div>
                  )}

                  {/* Energy Badge */}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs border border-white/10 text-[10px] font-medium text-slate-300 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-blue-400" />
                    <span>{scene.energy_level.toUpperCase()}</span>
                  </div>
                </div>

                {/* Details & Directives */}
                <div className="p-3.5 space-y-2.5 text-xs flex-1">
                  <p className="text-slate-300 text-[11px] line-clamp-3 leading-relaxed">
                    {scene.description}
                  </p>

                  <div className="space-y-1 pt-1 border-t border-[#1c202b] text-[10px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Camera className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{scene.camera}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Sun className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{scene.lighting}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-2.5 bg-[#0e1017] border-t border-[#1c202b] flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    {scene.prompt_used && (
                      <button
                        onClick={() => setInspectingPromptScene(scene)}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#1a1d27]"
                        title="Inspect Prompt Used"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingScene(scene)}
                      className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#1a1d27]"
                      title="Edit Scene Directives"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedSceneForAlternative(scene);
                        setAlternativePrompt('');
                      }}
                      disabled={isGenerating}
                      className="px-2 py-1 rounded bg-[#171922] hover:bg-[#202330] text-slate-300 text-[11px] font-medium border border-[#2b3040]"
                    >
                      Alternative
                    </button>

                    <button
                      onClick={() => handleSingleGenerate(scene)}
                      disabled={isGenerating || scene.is_locked}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                        scene.image_url
                          ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      } disabled:opacity-40`}
                    >
                      <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                      <span>{scene.image_url ? 'Regen' : 'Render'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alternative Generation Modal */}
      {selectedSceneForAlternative && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141c] border border-[#232734] w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">
              Generate Scene {selectedSceneForAlternative.scene_number} Alternative
            </h3>
            <p className="text-xs text-slate-400">
              Provide a targeted director revision while preserving the Visual Bible anchors.
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Make scene darker with low-angle ground camera movement, highlighting the metallic blue finish."
              value={alternativePrompt}
              onChange={(e) => setAlternativePrompt(e.target.value)}
              className="w-full p-3 bg-[#090a0f] border border-[#232734] rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setSelectedSceneForAlternative(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAlternativeSubmit}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
              >
                Generate Alternative Frame
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Inspector Modal */}
      {inspectingPromptScene && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141c] border border-[#232734] w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                Continuity Prompt - Scene {inspectingPromptScene.scene_number}
              </h3>
              <button
                onClick={() => setInspectingPromptScene(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>
            <pre className="p-4 bg-[#090a0f] border border-[#232734] rounded-lg text-[11px] text-slate-300 font-mono overflow-y-auto max-h-80 whitespace-pre-wrap leading-relaxed">
              {inspectingPromptScene.prompt_used}
            </pre>
          </div>
        </div>
      )}

      {/* Scene Metadata Edit Modal */}
      {editingScene && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141c] border border-[#232734] w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Edit Scene {editingScene.scene_number}</h3>

            <div>
              <label className="text-xs font-semibold text-slate-300">Title</label>
              <input
                type="text"
                value={editingScene.title}
                onChange={(e) => setEditingScene({ ...editingScene, title: e.target.value })}
                className="w-full mt-1 p-2 bg-[#090a0f] border border-[#232734] rounded text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Action Narrative</label>
              <textarea
                rows={3}
                value={editingScene.description}
                onChange={(e) => setEditingScene({ ...editingScene, description: e.target.value })}
                className="w-full mt-1 p-2 bg-[#090a0f] border border-[#232734] rounded text-xs text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Camera Direction</label>
                <input
                  type="text"
                  value={editingScene.camera}
                  onChange={(e) => setEditingScene({ ...editingScene, camera: e.target.value })}
                  className="w-full mt-1 p-2 bg-[#090a0f] border border-[#232734] rounded text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Lighting</label>
                <input
                  type="text"
                  value={editingScene.lighting}
                  onChange={(e) => setEditingScene({ ...editingScene, lighting: e.target.value })}
                  className="w-full mt-1 p-2 bg-[#090a0f] border border-[#232734] rounded text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button onClick={() => setEditingScene(null)} className="px-3.5 py-1.5 text-xs text-slate-400">
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onUpdateScene(editingScene.id, {
                    title: editingScene.title,
                    description: editingScene.description,
                    camera: editingScene.camera,
                    lighting: editingScene.lighting,
                  });
                  setEditingScene(null);
                }}
                className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold"
              >
                Save Directives
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
