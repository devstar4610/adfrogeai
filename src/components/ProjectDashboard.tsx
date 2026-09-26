/**
 * AdForge AI - Project Dashboard Component
 * Manages project portfolio, new brief creation form with presets,
 * and quick access to multimodal campaigns.
 */
import React, { useState } from 'react';
import {
  Plus,
  Search,
  Sparkles,
  Film,
  Video,
  Music,
  Trash2,
  ArrowRight,
  Clock,
  Layers,
  X,
} from 'lucide-react';
import { Project } from '../types/creative';

interface ProjectDashboardProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onCreateProject: (data: {
    title: string;
    brief: string;
    target_audience: string;
    duration: number;
    visual_style: string;
    aspect_ratio: '16:9' | '9:16' | '1:1';
    brand_info?: string;
  }) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  loading: boolean;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  projects,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  loading,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [audience, setAudience] = useState('Young urban Indian riders (ages 21-32)');
  const [duration, setDuration] = useState(20);
  const [visualStyle, setVisualStyle] = useState('Cinematic, Futuristic Neo-Noir');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [brandInfo, setBrandInfo] = useState('VoltX Stealth Edition - Matte obsidian finish, cyan blue LED accents, carbon-fiber frame');

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.brief.toLowerCase().includes(search.toLowerCase())
  );

  const applySampleBrief = () => {
    setTitle('VoltX Electric Motorcycle Campaign');
    setBrief(
      'Create a cinematic 20-second advertisement for a futuristic electric motorcycle targeting young urban Indian riders.'
    );
    setAudience('Young urban Indian riders (ages 21-32), tech-forward commuters');
    setDuration(20);
    setVisualStyle('Cinematic High-Tech Neo-Noir, High Contrast Lighting');
    setAspectRatio('16:9');
    setBrandInfo(
      'VoltX Apex Motorcycle: Matte stealth black body, aerodynamic silhouette, vibrant neon-cyan pulse headlights, ultra-quiet electric acceleration sound.'
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !brief) return;

    try {
      setSubmitting(true);
      await onCreateProject({
        title,
        brief,
        target_audience: audience,
        duration,
        visual_style: visualStyle,
        aspect_ratio: aspectRatio,
        brand_info: brandInfo,
      });
      setIsModalOpen(false);
      // Reset form
      setTitle('');
      setBrief('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#090a0f] text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-[#232734]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Multimodal Creative Pipeline
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Creative Production Studio
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
              Transform a single creative brief into an integrated commercial production: Storyboard frames via{' '}
              <span className="text-blue-300 font-medium">Nano Banana 2 Lite</span>, continuous video synthesis & conversational revisions via{' '}
              <span className="text-blue-300 font-medium">Gemini Omni Flash</span>, and adaptive scoring via{' '}
              <span className="text-blue-300 font-medium">Lyria 3.5</span>.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Creative Campaign</span>
          </button>
        </div>

        {/* Search & Stats Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects or briefs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#12141c] border border-[#232734] rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="text-xs text-slate-400">
            Total Projects: <span className="text-slate-200 font-medium">{projects.length}</span>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
            Loading creative projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-[#12141c] border border-[#232734] rounded-2xl p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <Film className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Creative Projects Yet</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              Start by creating your first multimodal campaign brief. You can use our VoltX electric motorcycle demonstration preset.
            </p>
            <button
              onClick={() => {
                applySampleBrief();
                setIsModalOpen(true);
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition shadow-md shadow-blue-600/20"
            >
              Load VoltX Demo Brief
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className="group bg-[#12141c] hover:bg-[#161822] border border-[#232734] hover:border-blue-500/50 rounded-xl p-5 cursor-pointer transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition line-clamp-1">
                      {p.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete project "${p.title}"?`)) {
                          onDeleteProject(p.id);
                        }
                      }}
                      className="text-slate-500 hover:text-red-400 p-1 rounded transition"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {p.brief}
                  </p>

                  {/* Creative Pipeline Asset Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    {p.plan && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {p.plan.scenes?.length || 5} Scenes
                      </span>
                    )}
                    {p.current_video_version_id && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                        <Video className="w-2.5 h-2.5" />
                        <span>Video Cut Ready</span>
                      </span>
                    )}
                    {p.current_audio_version_id && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                        <Music className="w-2.5 h-2.5" />
                        <span>Lyria Score Ready</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1d212c]">
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {p.duration}s
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-500" />
                      {p.aspect_ratio}
                    </span>
                    <span>•</span>
                    <span className="truncate max-w-[130px]">{p.visual_style}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-white bg-blue-600/90 group-hover:bg-blue-600 px-3 py-2 rounded-lg font-semibold transition">
                    <span>Open Studio Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141c] border border-[#232734] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#232734]">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">Create New Creative Campaign</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a1d27]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">
                <span className="text-blue-300">Looking for the benchmark campaign brief?</span>
                <button
                  type="button"
                  onClick={applySampleBrief}
                  className="font-semibold text-blue-400 hover:text-blue-300 underline"
                >
                  Load VoltX Motorcycle Brief
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VoltX Electric Motorcycle Campaign"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090a0f] border border-[#232734] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Creative Brief *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Create a cinematic 20-second advertisement for a futuristic electric motorcycle targeting young urban Indian riders."
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090a0f] border border-[#232734] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#090a0f] border border-[#232734] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Commercial Duration (Seconds)
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-[#090a0f] border border-[#232734] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value={15}>15 Seconds</option>
                    <option value={20}>20 Seconds (Standard)</option>
                    <option value={30}>30 Seconds</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Visual Style / Cinematic Tone
                  </label>
                  <input
                    type="text"
                    value={visualStyle}
                    onChange={(e) => setVisualStyle(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#090a0f] border border-[#232734] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Aspect Ratio
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-[#090a0f] border border-[#232734] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="16:9">16:9 Landscape (Commercial / Cinema)</option>
                    <option value="9:16">9:16 Vertical (Reels / Social)</option>
                    <option value="1:1">1:1 Square</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Hero Product / Brand Details (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Matte obsidian finish, cyan blue LED accents"
                  value={brandInfo}
                  onChange={(e) => setBrandInfo(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#090a0f] border border-[#232734] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#232734]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#1a1d27]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition disabled:opacity-50"
                >
                  {submitting ? 'Creating Project...' : 'Initialize Creative Studio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
