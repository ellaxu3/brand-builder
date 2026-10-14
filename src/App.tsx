import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  Newspaper,
  Image as ImageIcon,
  Monitor,
  RefreshCw,
  Sliders,
  Check,
  AlertCircle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  ChevronRight,
  Paintbrush,
  Maximize2,
  Lock,
  Compass,
  CheckCircle,
  Info
} from 'lucide-react';

interface BrandGuide {
  brandColors: string[];
  brandDescription: string;
  typographyNotes: string;
  billboardPrompt: string;
  newspaperPrompt: string;
  socialPrompt: string;
}

const PRESETS = [
  {
    name: "Aura Vaporizer",
    description: "An elegant glass-domed waterless aromatherapy diffuser emitting soft pastel vapor plumes, crafted in pristine white matte ceramic with a sleek wood grain base.",
    slogan: "BREATHE IN THE LIGHT",
    typographyStyle: "Sleek Modern Sans",
    vibe: "Clean Minimalist"
  },
  {
    name: "Aether Obsidian",
    description: "A solid titanium mechanical watch with a deep obsidian face, dark polished mesh bracelet, and fine glowing-amber accent hands, minimalist geometry.",
    slogan: "BEYOND THE MOMENT",
    typographyStyle: "Bold Futura Display",
    vibe: "Futuristic Metallic"
  },
  {
    name: "Solaris Tea Kettle",
    description: "A curved gooseneck electric water kettle finished in textured deep forest green with solid polished brass fittings and a warm carved oak handle.",
    slogan: "CRAFTED IN SUNLIGHT",
    typographyStyle: "Elegant Editorial Serif",
    vibe: "Warm Organic"
  }
];

export default function App() {
  // Config & API State
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [apiChecked, setApiChecked] = useState<boolean>(false);

  // Form Inputs
  const [productName, setProductName] = useState<string>('');
  const [productDescription, setProductDescription] = useState<string>('');
  const [slogan, setSlogan] = useState<string>('');
  const [typographyStyle, setTypographyStyle] = useState<string>('Sleek Modern Sans');
  const [vibe, setVibe] = useState<string>('Clean Minimalist');
  const [modelName, setModelName] = useState<'lite' | 'high-quality'>('lite');

  // App Flow / Visual States
  const [isPlanning, setIsPlanning] = useState<boolean>(false);
  const [brandGuide, setBrandGuide] = useState<BrandGuide | null>(null);
  const [activeTab, setActiveTab] = useState<'guide' | 'billboard' | 'newspaper' | 'social'>('guide');

  // Image Generation States
  const [images, setImages] = useState<Record<string, string>>({});
  const [generatingShots, setGeneratingShots] = useState<Record<string, boolean>>({});
  const [isGeneratingAll, setIsGeneratingAll] = useState<boolean>(false);

  // Status logs for loaders
  const [statusLogs, setStatusLogs] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Check backend configuration on mount
  useEffect(() => {
    fetch('/api/config-check')
      .then(res => res.json())
      .then(data => {
        setHasApiKey(data.hasApiKey);
        setApiChecked(true);
      })
      .catch(() => {
        setHasApiKey(false);
        setApiChecked(true);
      });
  }, []);

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setProductName(preset.name);
    setProductDescription(preset.description);
    setSlogan(preset.slogan);
    setTypographyStyle(preset.typographyStyle);
    setVibe(preset.vibe);
  };

  // Helper to change loading statuses for realism and comfort
  const startLoadingLogs = (mediumId: string, messages: string[]) => {
    let index = 0;
    setStatusLogs(prev => ({ ...prev, [mediumId]: messages[0] }));
    const interval = setInterval(() => {
      index++;
      if (index < messages.length) {
        setStatusLogs(prev => ({ ...prev, [mediumId]: messages[index] }));
      } else {
        clearInterval(interval);
      }
    }, 4000);
    return interval;
  };

  // Generate the core brand guide/blueprint
  const handlePlanBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !productDescription) {
      setError('Please provide both a product name and description.');
      return;
    }

    setIsPlanning(true);
    setError(null);
    setBrandGuide(null);
    setImages({});

    try {
      const response = await fetch('/api/plan-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          productDescription,
          slogan,
          typographyStyle,
          vibe
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate Brand Guide.');
      }

      setBrandGuide(data);
      setActiveTab('guide');
    } catch (err: any) {
      setError(err.message || 'An error occurred during brand strategy generation.');
    } finally {
      setIsPlanning(false);
    }
  };

  // Generate a single medium shot
  const handleGenerateShot = async (mediumId: 'billboard' | 'newspaper' | 'social', customPrompt?: string) => {
    if (!brandGuide) return;

    setGeneratingShots(prev => ({ ...prev, [mediumId]: true }));
    setError(null);

    const logs = {
      billboard: [
        'Scaling horizon bounds...',
        'Assembling canvas dimensions (16:9)...',
        'Applying slate metallic structural elements...',
        'Embedding slogan: "' + slogan + '" in ' + typographyStyle + ' format...',
        'Finishing lighting adjustments...'
      ],
      newspaper: [
        'Structuring newspaper layout (3:4)...',
        'Creating realistic ink-press paper matrices...',
        'Formatting surrounding broadsheet news grids...',
        'Integrating headline: "' + slogan + '"...',
        'Adjusting monochrome ink contrast levels...'
      ],
      social: [
        'Setting up lifestyle studio light panels (1:1)...',
        'Positioning geometric props and shadows...',
        'Positioning consistent product render...',
        'Applying typographic lower-third style for "' + slogan + '"...',
        'Rendering atmospheric focus bokeh...'
      ]
    }[mediumId];

    const interval = startLoadingLogs(mediumId, logs);

    let promptToUse = '';
    let aspectToUse = '1:1';
    if (mediumId === 'billboard') {
      promptToUse = customPrompt || brandGuide.billboardPrompt;
      aspectToUse = '16:9';
    } else if (mediumId === 'newspaper') {
      promptToUse = customPrompt || brandGuide.newspaperPrompt;
      aspectToUse = '3:4';
    } else {
      promptToUse = customPrompt || brandGuide.socialPrompt;
      aspectToUse = '1:1';
    }

    try {
      const response = await fetch('/api/generate-shot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          aspectRatio: aspectToUse,
          modelName
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Failed to generate ${mediumId} shot.`);
      }

      setImages(prev => ({ ...prev, [mediumId]: data.imageUrl }));
    } catch (err: any) {
      setError(`[${mediumId.toUpperCase()}] ${err.message || 'Image generation failed.'}`);
    } finally {
      clearInterval(interval);
      setGeneratingShots(prev => ({ ...prev, [mediumId]: false }));
    }
  };

  // Generate all mediums in parallel
  const handleGenerateAll = async () => {
    if (!brandGuide) return;
    setIsGeneratingAll(true);
    setError(null);

    try {
      await Promise.all([
        handleGenerateShot('billboard'),
        handleGenerateShot('newspaper'),
        handleGenerateShot('social')
      ]);
    } catch (err: any) {
      setError(err.message || 'One or more generations failed.');
    } finally {
      setIsGeneratingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white overflow-x-hidden" id="brand-builder-root">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Header Bar */}
      <header className="relative border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md z-10" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-amber-500 to-yellow-500 p-2.5 rounded-xl text-zinc-950 shadow-md shadow-amber-500/10" id="brand-logo-container">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent" id="app-title">
                Brand Builder App
              </h1>
              <p className="text-xs text-zinc-400 font-medium tracking-wide">MULTIMEDIUM CONSISTENCY LAB</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {apiChecked && !hasApiKey && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-lg text-amber-300 text-xs font-medium" id="key-warning">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Configure GEMINI_API_KEY in Secrets for paid model flows</span>
              </div>
            )}
            <div className="text-[10px] uppercase tracking-wider bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-md font-mono text-zinc-400" id="model-badge">
              MODEL: NANO-BANANA
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10" id="main-content">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-950/40 border border-red-500/30 p-4 rounded-xl flex items-start gap-3 text-red-200 animate-in fade-in slide-in-from-top-2" id="global-error">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold">Generation Error:</span> {error}
              <p className="text-xs text-red-400 mt-1">If using Nano-Banana, confirm you have selected your API Key in the Secrets Panel.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="workspace-grid">
          {/* Left Column: Creator inputs */}
          <section className="lg:col-span-5 space-y-6" id="input-section">
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-xl" id="creator-panel">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-500" />
                  <h2 className="text-base font-semibold text-zinc-200">Product Blueprint</h2>
                </div>
                <div className="text-[10px] uppercase bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-bold font-mono">
                  No People Policy
                </div>
              </div>

              {/* Presets */}
              <div className="mb-6" id="presets-container">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Quick-Start Brand Ideas
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/80 text-left px-3 py-2 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-700 group"
                      id={`preset-btn-${idx}`}
                    >
                      <p className="text-xs font-semibold text-zinc-300 truncate group-hover:text-amber-400 transition-colors">
                        {preset.name}
                      </p>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                        {preset.vibe}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Blueprint Form */}
              <form onSubmit={handlePlanBrand} className="space-y-4" id="blueprint-form">
                <div>
                  <label htmlFor="product-name" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Product Name
                  </label>
                  <input
                    id="product-name"
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Aether Flask"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="product-desc" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Visual Product Description
                    </label>
                    <span className="text-[10px] text-zinc-500">Meticulous detail gets best results</span>
                  </div>
                  <textarea
                    id="product-desc"
                    required
                    rows={4}
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Describe the shape, material textures, colors, and design lines of the product. Remember: No people will be generated."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="slogan-input" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Custom Slogan / Text
                    </label>
                    <span className="text-[10px] text-amber-500 font-medium">Rendered consistently</span>
                  </div>
                  <input
                    id="slogan-input"
                    type="text"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    placeholder="e.g. DESIGNED FOR HORIZONS"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="typo-select" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Typography Style
                    </label>
                    <select
                      id="typo-select"
                      value={typographyStyle}
                      onChange={(e) => setTypographyStyle(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="Sleek Modern Sans">Sleek Modern Sans</option>
                      <option value="Elegant Editorial Serif">Elegant Editorial Serif</option>
                      <option value="Bold Futura Display">Bold Futura Display</option>
                      <option value="Playful Retro Script">Playful Retro Script</option>
                      <option value="Minimalist Tech Monospace">Minimalist Tech Mono</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="vibe-select" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Brand Vibe / Mood
                    </label>
                    <select
                      id="vibe-select"
                      value={vibe}
                      onChange={(e) => setVibe(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="Clean Minimalist">Clean Minimalist</option>
                      <option value="Futuristic Metallic">Futuristic Metallic</option>
                      <option value="Warm Organic">Warm Organic</option>
                      <option value="Heritage Editorial">Heritage Editorial</option>
                      <option value="Cyberpunk Neon">Cyberpunk Neon</option>
                    </select>
                  </div>
                </div>

                {/* Model Selector detailing Nano-Banana */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Nano-Banana Image Model Engine
                  </label>
                  <div className="grid grid-cols-2 gap-3" id="model-selector">
                    <button
                      type="button"
                      onClick={() => setModelName('lite')}
                      className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                        modelName === 'lite'
                          ? 'bg-amber-500/10 border-amber-500/80 text-amber-300'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                      }`}
                      id="model-select-lite"
                    >
                      <span className="text-xs font-bold">Nano-Banana Lite</span>
                      <span className="text-[10px] text-zinc-500 mt-1">Faster, standard resolution</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModelName('high-quality')}
                      className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                        modelName === 'high-quality'
                          ? 'bg-amber-500/10 border-amber-500/80 text-amber-300'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                      }`}
                      id="model-select-hq"
                    >
                      <span className="text-xs font-bold">Nano-Banana 2</span>
                      <span className="text-[10px] text-zinc-500 mt-1">Stunning 1K resolution</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4" id="submit-container">
                  <button
                    type="submit"
                    disabled={isPlanning}
                    className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15 hover:shadow-amber-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none text-sm"
                    id="plan-brand-submit"
                  >
                    {isPlanning ? (
                      <>
                        <RefreshCw className="w-4 h-5 animate-spin" />
                        <span>Structuring Identity Blueprint...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 fill-zinc-950" />
                        <span>Establish Brand Strategy</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Instruction Panel */}
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5 text-zinc-400 text-xs leading-relaxed space-y-3" id="info-panel">
              <div className="flex items-center gap-2 text-zinc-300 font-semibold mb-1">
                <Info className="w-4 h-4 text-amber-500 shrink-0" />
                <h3>How Product Consistency is Maintained</h3>
              </div>
              <p>
                Our AI engine synthesizes your description into a master **Brand Visual Identity Guide**.
                This creates highly structured prompts detailing identical colors, materials, shapes, and textures.
              </p>
              <p>
                The master blueprint directs the **Nano-Banana** model to align the product precisely in each layout, while integrating your custom slogan cleanly in matching typographic formats without generating any people.
              </p>
            </div>
          </section>

          {/* Right Column: Interactive Sandbox & Presentation */}
          <section className="lg:col-span-7 space-y-6" id="sandbox-section">
            {!brandGuide ? (
              /* Pre-generation Empty State */
              <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[500px]" id="empty-workspace-state">
                <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 mb-6 text-zinc-500" id="empty-logo-box">
                  <Compass className="w-10 h-10 animate-pulse text-zinc-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-200">Consistency Showroom Ready</h3>
                <p className="text-sm text-zinc-500 max-w-md mx-auto mt-2">
                  Input your product details on the left, add an optional custom slogan, and click Establish Brand Strategy to configure consistent prompts for Billboard, Newspaper, and Social post ads.
                </p>
                <div className="mt-8 flex gap-3 text-zinc-400 text-xs items-center bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-xl" id="empty-reminders">
                  <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> No People Policy</span>
                  <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
                  <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Nano-Banana Engine</span>
                </div>
              </div>
            ) : (
              /* Core Design Room Panel */
              <div className="space-y-6" id="design-room-panel">
                {/* Tab Navigation & Execution Controls */}
                <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md" id="tab-controls-container">
                  <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800/60 overflow-x-auto shrink-0" id="showroom-tabs">
                    <button
                      onClick={() => setActiveTab('guide')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === 'guide'
                          ? 'bg-zinc-800 text-white shadow-sm shadow-black/20'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      id="tab-guide"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>1. Brand Identity Guide</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('billboard')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all relative whitespace-nowrap ${
                        activeTab === 'billboard'
                          ? 'bg-zinc-800 text-white shadow-sm shadow-black/20'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      id="tab-billboard"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>2. Billboard (16:9)</span>
                      {images.billboard && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('newspaper')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all relative whitespace-nowrap ${
                        activeTab === 'newspaper'
                          ? 'bg-zinc-800 text-white shadow-sm shadow-black/20'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      id="tab-newspaper"
                    >
                      <Newspaper className="w-3.5 h-3.5" />
                      <span>3. Newspaper Ad (3:4)</span>
                      {images.newspaper && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('social')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all relative whitespace-nowrap ${
                        activeTab === 'social'
                          ? 'bg-zinc-800 text-white shadow-sm shadow-black/20'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      id="tab-social"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>4. Social Post (1:1)</span>
                      {images.social && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      )}
                    </button>
                  </div>

                  {/* Generate All Button */}
                  <button
                    onClick={handleGenerateAll}
                    disabled={isGeneratingAll || Object.values(generatingShots).some(Boolean)}
                    className="bg-zinc-100 hover:bg-white text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-white/5 disabled:opacity-40 transition-all self-start md:self-auto"
                    id="generate-all-btn"
                  >
                    {isGeneratingAll ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Rendering Campaign...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate All Shots</span>
                      </>
                    )}
                  </button>
                </div>

                {/* TAB 1: Brand Strategy & Identity Guide */}
                {activeTab === 'guide' && (
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 space-y-6 animate-in fade-in" id="guide-room-view">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-5">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-100">Consistent Brand Identity blueprint</h3>
                        <p className="text-xs text-zinc-400 mt-1">Generated by Gemini-3.5-Flash to ensure flawless cross-medium coordination.</p>
                      </div>
                      <div className="flex items-center gap-2" id="palette-display">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mr-1">Brand Swatches:</span>
                        <div className="flex gap-1.5">
                          {brandGuide.brandColors.map((color, i) => (
                            <div
                              key={i}
                              title={color}
                              style={{ backgroundColor: color.startsWith('#') ? color : '#52525b' }}
                              className="w-5 h-5 rounded-full border border-zinc-700/80 shadow-inner flex items-center justify-center text-[8px] font-bold text-zinc-950"
                            >
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Vibe and Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="guide-details-grid">
                      <div className="space-y-4">
                        <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-4">
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Paintbrush className="w-3.5 h-3.5 text-amber-500" />
                            <span>Visual Strategy Narrative</span>
                          </h4>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            {brandGuide.brandDescription}
                          </p>
                        </div>

                        <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-4">
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                            <span>Typography & Slogan Rules</span>
                          </h4>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            {brandGuide.typographyNotes}
                          </p>
                          <div className="mt-3 bg-zinc-900 p-2.5 rounded border border-zinc-800 font-mono text-xs flex justify-between items-center">
                            <span className="text-zinc-500 uppercase text-[10px]">Active Slogan:</span>
                            <span className="text-amber-400 font-bold tracking-tight">"{slogan || 'No Slogan Configured'}"</span>
                          </div>
                        </div>
                      </div>

                      {/* Prompts Overview */}
                      <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                            Target Media Specifications
                          </h4>
                          <div className="space-y-3.5">
                            <div className="flex items-start gap-3">
                              <div className="bg-zinc-900 border border-zinc-800 p-1.5 rounded-lg text-zinc-300 mt-0.5">
                                <Monitor className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <h5 className="text-xs font-semibold text-zinc-200">1. Horizontal Billboard (16:9)</h5>
                                <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{brandGuide.billboardPrompt}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="bg-zinc-900 border border-zinc-800 p-1.5 rounded-lg text-zinc-300 mt-0.5">
                                <Newspaper className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <h5 className="text-xs font-semibold text-zinc-200">2. Editorial Newspaper (3:4)</h5>
                                <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{brandGuide.newspaperPrompt}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="bg-zinc-900 border border-zinc-800 p-1.5 rounded-lg text-zinc-300 mt-0.5">
                                <ImageIcon className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <h5 className="text-xs font-semibold text-zinc-200">3. High-End Studio Social (1:1)</h5>
                                <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{brandGuide.socialPrompt}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-900 mt-4">
                          <button
                            onClick={() => {
                              setActiveTab('billboard');
                            }}
                            className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-200 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors"
                          >
                            <span>Open Media Render Chambers</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Miniature Campaign Layout */}
                    <div className="border-t border-zinc-800/80 pt-6">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
                        Current Campaign Previews
                      </h4>
                      <div className="grid grid-cols-3 gap-4" id="miniature-previews">
                        {/* Billboard Mini */}
                        <div
                          onClick={() => setActiveTab('billboard')}
                          className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-3 cursor-pointer hover:border-zinc-700 transition-all text-center space-y-2 group"
                        >
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">1. Billboard</span>
                          <div className="aspect-[16/9] bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-800/50 overflow-hidden relative">
                            {images.billboard ? (
                              <img src={images.billboard} alt="Billboard consistent preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                            ) : (
                              <Monitor className="w-4 h-4 text-zinc-700" />
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 block font-medium group-hover:text-amber-400 transition-colors">
                            {images.billboard ? 'Rendered ✓' : 'Ready to Render'}
                          </span>
                        </div>

                        {/* Newspaper Mini */}
                        <div
                          onClick={() => setActiveTab('newspaper')}
                          className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-3 cursor-pointer hover:border-zinc-700 transition-all text-center space-y-2 group"
                        >
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">2. Newspaper Ad</span>
                          <div className="aspect-[3/4] max-w-[80px] mx-auto bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-800/50 overflow-hidden relative">
                            {images.newspaper ? (
                              <img src={images.newspaper} alt="Newspaper consistent preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                            ) : (
                              <Newspaper className="w-4 h-4 text-zinc-700" />
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 block font-medium group-hover:text-amber-400 transition-colors">
                            {images.newspaper ? 'Rendered ✓' : 'Ready to Render'}
                          </span>
                        </div>

                        {/* Social Mini */}
                        <div
                          onClick={() => setActiveTab('social')}
                          className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-3 cursor-pointer hover:border-zinc-700 transition-all text-center space-y-2 group"
                        >
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">3. Social Post</span>
                          <div className="aspect-square max-w-[90px] mx-auto bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-800/50 overflow-hidden relative">
                            {images.social ? (
                              <img src={images.social} alt="Social consistent preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-zinc-700" />
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 block font-medium group-hover:text-amber-400 transition-colors">
                            {images.social ? 'Rendered ✓' : 'Ready to Render'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Billboard Medium Rendering */}
                {activeTab === 'billboard' && (
                  <div className="space-y-4 animate-in fade-in" id="billboard-room-view">
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6" id="billboard-container">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-4 mb-4">
                        <div>
                          <h3 className="text-base font-bold text-zinc-100">Medium: Outdoor Horizontal Billboard</h3>
                          <p className="text-xs text-zinc-400">Generates on a widescreen landscape frame (16:9). No human models generated.</p>
                        </div>
                        <button
                          onClick={() => handleGenerateShot('billboard')}
                          disabled={generatingShots.billboard || isGeneratingAll}
                          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/10 disabled:opacity-50 transition-colors"
                        >
                          {generatingShots.billboard ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Generating Shot...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>{images.billboard ? 'Regenerate Billboard' : 'Generate Billboard'}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Real Mockup Frame */}
                      <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-4" id="billboard-mockup-wrapper">
                        {generatingShots.billboard ? (
                          <div className="aspect-[16/9] w-full bg-zinc-900 rounded-xl flex flex-col items-center justify-center p-6 text-center animate-pulse border border-zinc-800/50">
                            <Monitor className="w-8 h-8 text-amber-500 animate-spin mb-4" />
                            <p className="text-sm font-semibold text-zinc-200">{statusLogs.billboard || 'Setting up canvas parameters...'}</p>
                            <p className="text-xs text-zinc-500 max-w-sm mt-1.5">This takes a moment. Using model: {modelName === 'high-quality' ? 'Nano-Banana 2' : 'Nano-Banana Lite'}.</p>
                          </div>
                        ) : images.billboard ? (
                          <div className="space-y-4">
                            {/* Realistic Outdoor Billboard frame */}
                            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 shadow-2xl relative">
                              {/* Spotlight lamps */}
                              <div className="absolute -top-3 left-1/4 transform -translate-x-1/2 flex gap-4">
                                <div className="w-1.5 h-3 bg-zinc-700 rounded-t" />
                                <div className="w-1.5 h-3 bg-zinc-700 rounded-t" />
                              </div>
                              <div className="absolute -top-3 right-1/4 transform translate-x-1/2 flex gap-4">
                                <div className="w-1.5 h-3 bg-zinc-700 rounded-t" />
                                <div className="w-1.5 h-3 bg-zinc-700 rounded-t" />
                              </div>

                              <div className="aspect-[16/9] w-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
                                <img
                                  src={images.billboard}
                                  alt="Brand consistent billboard"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            </div>
                            {/* Steel billboard pillar mock */}
                            <div className="w-8 h-12 bg-gradient-to-r from-zinc-800 to-zinc-900 mx-auto border-x border-zinc-700 shadow-md" />
                            <div className="w-24 h-2 bg-zinc-800 mx-auto rounded-t" />
                          </div>
                        ) : (
                          <div className="aspect-[16/9] w-full bg-zinc-900/40 rounded-xl flex flex-col items-center justify-center p-6 text-center border border-dashed border-zinc-800">
                            <Monitor className="w-10 h-10 text-zinc-600 mb-3" />
                            <h4 className="text-sm font-semibold text-zinc-300">Billboard Ready for Casting</h4>
                            <p className="text-xs text-zinc-500 max-w-xs mt-1">Generate using consistent prompts aligned to your brand colors and text slogan.</p>
                          </div>
                        )}
                      </div>

                      {/* Display the active prompt so user is aware */}
                      <div className="mt-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 space-y-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Image Prompt Directed to Model:</span>
                        <p className="text-xs text-zinc-300 leading-relaxed font-mono select-all p-3 bg-zinc-950 rounded border border-zinc-900">{brandGuide.billboardPrompt}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Newspaper Medium Rendering */}
                {activeTab === 'newspaper' && (
                  <div className="space-y-4 animate-in fade-in" id="newspaper-room-view">
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6" id="newspaper-container">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-4 mb-4">
                        <div>
                          <h3 className="text-base font-bold text-zinc-100">Medium: Vintage Newspaper Print Ad</h3>
                          <p className="text-xs text-zinc-400">Monochrome, ink-press textures, and layouts arranged in vertical format (3:4).</p>
                        </div>
                        <button
                          onClick={() => handleGenerateShot('newspaper')}
                          disabled={generatingShots.newspaper || isGeneratingAll}
                          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/10 disabled:opacity-50 transition-colors"
                        >
                          {generatingShots.newspaper ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Generating Shot...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>{images.newspaper ? 'Regenerate Newspaper' : 'Generate Newspaper'}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Newspaper Real Mockup Frame */}
                      <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-4 flex justify-center" id="newspaper-mockup-wrapper">
                        {generatingShots.newspaper ? (
                          <div className="aspect-[3/4] w-full max-w-[400px] bg-zinc-900 rounded-xl flex flex-col items-center justify-center p-6 text-center animate-pulse border border-zinc-800/50">
                            <Newspaper className="w-8 h-8 text-amber-500 animate-spin mb-4" />
                            <p className="text-sm font-semibold text-zinc-200">{statusLogs.newspaper || 'Formatting newsprint cells...'}</p>
                            <p className="text-xs text-zinc-500 max-w-sm mt-1.5">This takes a moment. Using model: {modelName === 'high-quality' ? 'Nano-Banana 2' : 'Nano-Banana Lite'}.</p>
                          </div>
                        ) : images.newspaper ? (
                          /* Detailed BroadSheet Layout wrapper */
                          <div className="bg-[#1c1917] p-5 rounded-2xl border border-zinc-800 max-w-[450px] w-full shadow-2xl space-y-4">
                            <div className="flex items-center justify-between border-b-2 border-zinc-700 pb-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                              <span>ESTD. 1928</span>
                              <span className="font-bold">THE BRAND RECORD</span>
                              <span>JULY 7, 2026</span>
                            </div>

                            <div className="aspect-[3/4] w-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 shadow-inner">
                              <img
                                src={images.newspaper}
                                alt="Brand consistent newspaper advertisement"
                                className="w-full h-full object-cover filter grayscale contrast-125"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            {/* Faux Article Columns */}
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800 text-[9px] text-zinc-500 leading-relaxed font-serif">
                              <div>
                                <p className="font-bold uppercase mb-1 text-zinc-400">DESIGN CONSISTENCY CRUCIAL</p>
                                <p>This brand experiment showcases immaculate, consistent aesthetics utilizing the advanced Nano-Banana image generation matrices. Spanning high-impact billboards, monochrome newsprint ads, and square lifestyle posts, the main core product shape and custom text slogan stay consistently integrated. Strictly human-free layouts preserve structural lines perfectly.</p>
                              </div>
                              <div>
                                <p className="font-bold uppercase mb-1 text-zinc-400">UNSURPASSED INTEGRITY</p>
                                <p>By relying on a unified Brand Blueprints strategy and prompt pipelines, we enforce typography matching. Slogans emerge precisely embedded on matte finishes, textured borders, or illuminated backdrops, securing maximum visual authority for modern brand launches.</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-[3/4] w-full max-w-[400px] bg-zinc-900/40 rounded-xl flex flex-col items-center justify-center p-6 text-center border border-dashed border-zinc-800">
                            <Newspaper className="w-10 h-10 text-zinc-600 mb-3" />
                            <h4 className="text-sm font-semibold text-zinc-300">Newspaper Ad Frame Ready</h4>
                            <p className="text-xs text-zinc-500 max-w-xs mt-1">Generate using consistent monochrome broadsheet guidelines designed specifically for vintage ink-press layout.</p>
                          </div>
                        )}
                      </div>

                      {/* Display the active prompt so user is aware */}
                      <div className="mt-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 space-y-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Image Prompt Directed to Model:</span>
                        <p className="text-xs text-zinc-300 leading-relaxed font-mono select-all p-3 bg-zinc-950 rounded border border-zinc-900">{brandGuide.newspaperPrompt}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: Social Post Medium Rendering */}
                {activeTab === 'social' && (
                  <div className="space-y-4 animate-in fade-in" id="social-room-view">
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6" id="social-container">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-4 mb-4">
                        <div>
                          <h3 className="text-base font-bold text-zinc-100">Medium: High-End Lifestyle Social Post</h3>
                          <p className="text-xs text-zinc-400">Produces pristine, square lifestyle or studio photos (1:1). Perfect for Instagram or Pinterest.</p>
                        </div>
                        <button
                          onClick={() => handleGenerateShot('social')}
                          disabled={generatingShots.social || isGeneratingAll}
                          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/10 disabled:opacity-50 transition-colors"
                        >
                          {generatingShots.social ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Generating Shot...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>{images.social ? 'Regenerate Social Post' : 'Generate Social Post'}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Social Real Mockup Frame */}
                      <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-4 flex justify-center" id="social-mockup-wrapper">
                        {generatingShots.social ? (
                          <div className="aspect-square w-full max-w-[400px] bg-zinc-900 rounded-xl flex flex-col items-center justify-center p-6 text-center animate-pulse border border-zinc-800/50">
                            <ImageIcon className="w-8 h-8 text-amber-500 animate-spin mb-4" />
                            <p className="text-sm font-semibold text-zinc-200">{statusLogs.social || 'Positioning props & studio lights...'}</p>
                            <p className="text-xs text-zinc-500 max-w-sm mt-1.5">This takes a moment. Using model: {modelName === 'high-quality' ? 'Nano-Banana 2' : 'Nano-Banana Lite'}.</p>
                          </div>
                        ) : images.social ? (
                          /* Detailed Instagram smartphone mockup */
                          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-[400px] w-full shadow-2xl overflow-hidden" id="phone-container">
                            {/* Profile Header */}
                            <div className="flex items-center justify-between p-3.5 border-b border-zinc-800/60 bg-zinc-900">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center font-bold text-[11px] text-zinc-950 shadow">
                                  {productName.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-zinc-200 block leading-tight">{productName.toLowerCase().replace(/\s+/g, '')}</span>
                                  <span className="text-[10px] text-zinc-500">Sponsored</span>
                                </div>
                              </div>
                              <span className="text-zinc-500 font-bold text-sm tracking-widest">···</span>
                            </div>

                            {/* Actual 1:1 Image */}
                            <div className="aspect-square w-full bg-zinc-950 overflow-hidden relative">
                              <img
                                src={images.social}
                                alt="Brand consistent social media advertisement"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            {/* Action Buttons */}
                            <div className="p-3.5 space-y-2.5 bg-zinc-900">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3.5 text-zinc-400">
                                  <span className="hover:text-red-400 cursor-pointer">♥</span>
                                  <span className="hover:text-zinc-200 cursor-pointer">💬</span>
                                  <span className="hover:text-zinc-200 cursor-pointer">✈</span>
                                </div>
                                <span className="text-zinc-500 text-xs">🔖</span>
                              </div>

                              <div className="text-xs space-y-1">
                                <p className="font-bold text-zinc-300">2,419 likes</p>
                                <p className="leading-relaxed">
                                  <span className="font-bold text-zinc-200 mr-1.5">{productName.toLowerCase().replace(/\s+/g, '')}</span>
                                  Introducing the new, meticulously consistent {productName}. Inspired by our master visual guide, here it is in a {vibe.toLowerCase()} setting. Styled consistently across the globe. No human interference.
                                </p>
                                <p className="text-amber-500 font-semibold font-mono tracking-wide mt-1.5">{slogan}</p>
                              </div>

                              <div className="text-[10px] text-zinc-500 uppercase tracking-wide pt-1">
                                2 HOURS AGO
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-square w-full max-w-[400px] bg-zinc-900/40 rounded-xl flex flex-col items-center justify-center p-6 text-center border border-dashed border-zinc-800">
                            <ImageIcon className="w-10 h-10 text-zinc-600 mb-3" />
                            <h4 className="text-sm font-semibold text-zinc-300">Social Post Frame Ready</h4>
                            <p className="text-xs text-zinc-500 max-w-xs mt-1">Generate using consistent high-contrast portrait framing customized specifically for clean digital lifestyle presentation.</p>
                          </div>
                        )}
                      </div>

                      {/* Display the active prompt so user is aware */}
                      <div className="mt-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 space-y-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Image Prompt Directed to Model:</span>
                        <p className="text-xs text-zinc-300 leading-relaxed font-mono select-all p-3 bg-zinc-950 rounded border border-zinc-900">{brandGuide.socialPrompt}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="relative border-t border-zinc-900 bg-zinc-950 mt-16 z-10" id="main-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-zinc-500 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Brand Builder Playground
          </p>
          <p className="text-xs max-w-xl mx-auto leading-relaxed">
            Consistently imagining real products across different physical mediums using custom-made vector prompts and the high-end <strong>Nano-Banana Model Suite</strong>. strictly human-free layouts are enforced to preserve premium geometric lines.
          </p>
          <div className="text-[10px] font-mono text-zinc-600 pt-2 flex items-center justify-center gap-4">
            <span>PLATFORM: COGNITIVE RUNTIME</span>
            <span>•</span>
            <span>PORT: 3000 (HTTPS)</span>
            <span>•</span>
            <span>STABILITY: ACTIVE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
