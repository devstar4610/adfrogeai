/**
 * AdForge AI - Visual Bible Modal Component
 * Displays and allows editing of persistent visual anchors (hero products, characters,
 * key locations, lighting language, and color palette) for cross-modal continuity.
 */
import React, { useState } from 'react';
import { X, BookOpen, Sparkles, Plus, Trash2, Check } from 'lucide-react';
import { VisualBible } from '../types/creative';

interface VisualBibleModalProps {
  visualBible: VisualBible;
  onSave: (updated: VisualBible) => Promise<void>;
  onClose: () => void;
}

export const VisualBibleModal: React.FC<VisualBibleModalProps> = ({
  visualBible,
  onSave,
  onClose,
}) => {
  const [bible, setBible] = useState<VisualBible>(JSON.parse(JSON.stringify(visualBible)));
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'characters' | 'locations' | 'style'>('products');

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(bible);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#12141c] border border-[#232734] w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232734]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Project Visual Bible</h2>
              <p className="text-xs text-slate-400">
                Persistent continuity anchors passed to Nano Banana 2 Lite and Gemini Omni Flash.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a1d27]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#232734] px-6 bg-[#0e1017]">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'products'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Hero Products ({bible.products.length})
          </button>
          <button
            onClick={() => setActiveTab('characters')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'characters'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Characters ({bible.characters.length})
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'locations'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Locations ({bible.locations.length})
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'style'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Style & Cinematography
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium">Hero Product Definitions</span>
                <button
                  type="button"
                  onClick={() =>
                    setBible({
                      ...bible,
                      products: [
                        ...bible.products,
                        { name: 'New Product', description: '', visual_features: '', color: '' },
                      ],
                    })
                  }
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              </div>

              {bible.products.map((p, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#0a0b0f] border border-[#232734] space-y-3">
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={p.name}
                      onChange={(e) => {
                        const next = [...bible.products];
                        next[idx].name = e.target.value;
                        setBible({ ...bible, products: next });
                      }}
                      className="bg-transparent font-bold text-sm text-white focus:outline-none border-b border-transparent focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = bible.products.filter((_, i) => i !== idx);
                        setBible({ ...bible, products: next });
                      }}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium">Color</label>
                      <input
                        type="text"
                        value={p.color}
                        onChange={(e) => {
                          const next = [...bible.products];
                          next[idx].color = e.target.value;
                          setBible({ ...bible, products: next });
                        }}
                        className="w-full mt-1 px-3 py-1.5 bg-[#12141c] border border-[#232734] rounded text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium">Visual Features</label>
                      <input
                        type="text"
                        value={p.visual_features}
                        onChange={(e) => {
                          const next = [...bible.products];
                          next[idx].visual_features = e.target.value;
                          setBible({ ...bible, products: next });
                        }}
                        className="w-full mt-1 px-3 py-1.5 bg-[#12141c] border border-[#232734] rounded text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-medium">Full Description</label>
                    <textarea
                      rows={2}
                      value={p.description}
                      onChange={(e) => {
                        const next = [...bible.products];
                        next[idx].description = e.target.value;
                        setBible({ ...bible, products: next });
                      }}
                      className="w-full mt-1 px-3 py-1.5 bg-[#12141c] border border-[#232734] rounded text-xs text-slate-200"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'characters' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium">Recurring Characters</span>
                <button
                  type="button"
                  onClick={() =>
                    setBible({
                      ...bible,
                      characters: [...bible.characters, { name: 'Rider', role: 'Protagonist', description: '' }],
                    })
                  }
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Character</span>
                </button>
              </div>

              {bible.characters.map((c, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#0a0b0f] border border-[#232734] space-y-3">
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      placeholder="Character Name"
                      value={c.name}
                      onChange={(e) => {
                        const next = [...bible.characters];
                        next[idx].name = e.target.value;
                        setBible({ ...bible, characters: next });
                      }}
                      className="bg-transparent font-bold text-sm text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = bible.characters.filter((_, i) => i !== idx);
                        setBible({ ...bible, characters: next });
                      }}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Role (e.g. Lead Urban Rider)"
                    value={c.role}
                    onChange={(e) => {
                      const next = [...bible.characters];
                      next[idx].role = e.target.value;
                      setBible({ ...bible, characters: next });
                    }}
                    className="w-full px-3 py-1.5 bg-[#12141c] border border-[#232734] rounded text-xs text-slate-200"
                  />
                  <textarea
                    rows={2}
                    placeholder="Physical appearance, wardrobe, helmet design..."
                    value={c.description}
                    onChange={(e) => {
                      const next = [...bible.characters];
                      next[idx].description = e.target.value;
                      setBible({ ...bible, characters: next });
                    }}
                    className="w-full px-3 py-1.5 bg-[#12141c] border border-[#232734] rounded text-xs text-slate-200"
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'locations' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium">Locations & Environments</span>
                <button
                  type="button"
                  onClick={() =>
                    setBible({
                      ...bible,
                      locations: [
                        ...bible.locations,
                        { name: 'City Skyline', atmosphere: 'Cyberpunk Twilight', description: '' },
                      ],
                    })
                  }
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Location</span>
                </button>
              </div>

              {bible.locations.map((loc, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#0a0b0f] border border-[#232734] space-y-3">
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      placeholder="Location Name"
                      value={loc.name}
                      onChange={(e) => {
                        const next = [...bible.locations];
                        next[idx].name = e.target.value;
                        setBible({ ...bible, locations: next });
                      }}
                      className="bg-transparent font-bold text-sm text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = bible.locations.filter((_, i) => i !== idx);
                        setBible({ ...bible, locations: next });
                      }}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Atmosphere (e.g. Neon Wet Asphalt, Rainy Night)"
                    value={loc.atmosphere}
                    onChange={(e) => {
                      const next = [...bible.locations];
                      next[idx].atmosphere = e.target.value;
                      setBible({ ...bible, locations: next });
                    }}
                    className="w-full px-3 py-1.5 bg-[#12141c] border border-[#232734] rounded text-xs text-slate-200"
                  />
                  <textarea
                    rows={2}
                    placeholder="Environment details..."
                    value={loc.description}
                    onChange={(e) => {
                      const next = [...bible.locations];
                      next[idx].description = e.target.value;
                      setBible({ ...bible, locations: next });
                    }}
                    className="w-full px-3 py-1.5 bg-[#12141c] border border-[#232734] rounded text-xs text-slate-200"
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'style' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Visual Aesthetic</label>
                <input
                  type="text"
                  value={bible.visual_style}
                  onChange={(e) => setBible({ ...bible, visual_style: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2 bg-[#0a0b0f] border border-[#232734] rounded-lg text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Lighting Architecture</label>
                <input
                  type="text"
                  value={bible.lighting_style}
                  onChange={(e) => setBible({ ...bible, lighting_style: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2 bg-[#0a0b0f] border border-[#232734] rounded-lg text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Camera Language</label>
                <input
                  type="text"
                  value={bible.camera_language}
                  onChange={(e) => setBible({ ...bible, camera_language: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2 bg-[#0a0b0f] border border-[#232734] rounded-lg text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Color Palette</label>
                <div className="flex items-center gap-2 mt-2">
                  {bible.color_palette.map((c, i) => (
                    <div key={i} className="flex items-center gap-1 bg-[#0a0b0f] border border-[#232734] px-2.5 py-1.5 rounded">
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-700" style={{ backgroundColor: c }} />
                      <input
                        type="text"
                        value={c}
                        onChange={(e) => {
                          const next = [...bible.color_palette];
                          next[i] = e.target.value;
                          setBible({ ...bible, color_palette: next });
                        }}
                        className="w-20 bg-transparent text-xs text-slate-200 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#232734] bg-[#0e1017] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Visual Bible'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
