import React, { useState } from 'react';
import { Settings, Upload, X, Sparkles, HelpCircle, Film, Zap, MessageSquare, Image as ImageIcon, Wand2, Download, Globe } from 'lucide-react';
import { useAIArticleGenerator } from '../../hooks/useAIArticleGenerator';

/**
 * AI Article Generator Component
 * UI-only component that uses useAIArticleGenerator hook for logic
 */
const AIArticleGenerator = ({ categories, onPublish }) => {
  // Use custom hook for all logic and state
  const {
    agentForm,
    agentGenerating,
    agentPreview,
    agentError,
    updateFormField,
    updatePreviewContent,
    handleGenerate,
    handlePublish,
    resetForm
  } = useAIArticleGenerator(onPublish);

  // Tooltip state
  const [showHelp, setShowHelp] = useState(false);

  // Check dataSource setting
  const [dataSource, setDataSource] = useState(() => {
    return localStorage.getItem('cine-chatter-data-source') || 'admin-only';
  });

  // Download YouTube script function
  const handleDownloadScript = () => {
    if (!agentPreview) return;

    const scriptContent = `${agentPreview.title}\n\n${agentPreview.content}`;
    const blob = new Blob([scriptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${agentPreview.movieName || 'youtube-script'}-script.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 -m-6 p-8">
      {/* Data Source Warning Banner */}
      {dataSource === 'sheets-only' && (
        <div className="max-w-5xl mx-auto mb-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 dark:text-yellow-400 text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-bold text-yellow-900 dark:text-yellow-200 mb-1">Articles Won't Be Visible!</h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
                  Your Data Source is set to <strong>"Sheets Only"</strong>. AI-generated articles will be saved but won't appear on your site.
                </p>
                <button
                  onClick={() => {
                    localStorage.setItem('cine-chatter-data-source', 'admin-only');
                    setDataSource('admin-only');
                    alert('✅ Data Source changed to "Admin Only".\n\nYour AI articles will now be visible!\n\nRefreshing page...');
                    window.location.reload();
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Fix Now - Switch to "Admin Only"
                </button>
                <span className="text-xs text-yellow-700 dark:text-yellow-400 ml-3">
                  or go to Dashboard → Integration Settings
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI Article Generator
            </h1>
            <div className="relative">
              <HelpCircle
                className="w-6 h-6 text-blue-600 dark:text-blue-400 cursor-help hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                onMouseEnter={() => setShowHelp(true)}
                onMouseLeave={() => setShowHelp(false)}
              />
              {showHelp && (
                <div className="absolute left-0 top-10 z-50 w-[550px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-blue-200 dark:border-blue-600 p-6 backdrop-blur-sm">
                  {/* How It Works */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2">
                      <Wand2 className="w-5 h-5" />
                      How It Works
                    </h3>
                    <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">1</span>
                        <span>Enter the movie name you want to write about</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">2</span>
                        <span>Choose between Review or Story Synopsis</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">3</span>
                        <span>Select the appropriate category</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">4</span>
                        <span>Add a poster image URL (optional)</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">5</span>
                        <span>AI searches the web and generates a professional article</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">6</span>
                        <span>Review and publish to your site</span>
                      </li>
                    </ol>
                  </div>

                  {/* What You Get */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      What You Get
                    </h3>
                    <ul className="space-y-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-0.5 text-lg">✓</span>
                        <span><strong>Reviews:</strong> 800-1000 word professional movie reviews with analysis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-0.5 text-lg">✓</span>
                        <span><strong>Story Synopsis:</strong> 600-800 word engaging plot summaries</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-0.5 text-lg">✓</span>
                        <span>Web-researched with real facts and data</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-0.5 text-lg">✓</span>
                        <span>SEO-optimized for search engines</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-0.5 text-lg">✓</span>
                        <span>Professional entertainment journalism style</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Create professional movie reviews, story synopses, and YouTube scripts in seconds using advanced AI
          </p>
        </div>
      </div>

      {!agentPreview ? (
        /* Generation Form */
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Film className="w-6 h-6" />
                Article Configuration
              </h2>
              <p className="text-purple-100 text-sm mt-1">
                Fill in the details below to generate your article
              </p>
            </div>

            <div className="p-8 space-y-6">
              {/* Movie Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  <Film className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Movie Name *
                </label>
                <input
                  type="text"
                  value={agentForm.movieName}
                  onChange={(e) => updateFormField('movieName', e.target.value)}
                  placeholder="e.g., Inception, RRR, Dune Part Two"
                  className="w-full px-5 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 transition-all text-lg"
                />
              </div>

              {/* Content Type */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Content Type *
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => updateFormField('scriptType', 'review')}
                    className={`group relative px-6 py-4 rounded-xl border-2 font-semibold transition-all ${
                      agentForm.scriptType === 'review'
                        ? 'border-purple-600 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 shadow-lg scale-105'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-400 hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Zap className={`w-6 h-6 ${agentForm.scriptType === 'review' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
                      <span>Review</span>
                    </div>
                    {agentForm.scriptType === 'review' && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => updateFormField('scriptType', 'story')}
                    className={`group relative px-6 py-4 rounded-xl border-2 font-semibold transition-all ${
                      agentForm.scriptType === 'story'
                        ? 'border-purple-600 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 shadow-lg scale-105'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-400 hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <MessageSquare className={`w-6 h-6 ${agentForm.scriptType === 'story' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
                      <span>Story Synopsis</span>
                    </div>
                    {agentForm.scriptType === 'story' && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => updateFormField('scriptType', 'youtube')}
                    className={`group relative px-6 py-4 rounded-xl border-2 font-semibold transition-all ${
                      agentForm.scriptType === 'youtube'
                        ? 'border-purple-600 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 shadow-lg scale-105'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-400 hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Film className={`w-6 h-6 ${agentForm.scriptType === 'youtube' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
                      <span>YouTube Script</span>
                    </div>
                    {agentForm.scriptType === 'youtube' && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  📺 YouTube Script includes visual cues [VISUAL CUE], timing markers, and copyright-safe guidelines
                </p>
              </div>

              {/* Row: Category + AI Quality */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    <Film className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Category *
                  </label>
                  <select
                    value={agentForm.category}
                    onChange={(e) => updateFormField('category', e.target.value)}
                    className="w-full px-5 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* AI Quality */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    AI Quality *
                  </label>
                  <select
                    value={agentForm.model}
                    onChange={(e) => updateFormField('model', e.target.value)}
                    className="w-full px-5 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                  >
                    <optgroup label="🤖 ChatGPT + Google Search">
                      <option value="gpt-4o">💬 ChatGPT 4o + Google Search</option>
                      <option value="gpt-4o-mini">💬 ChatGPT 4o-mini + Google Search (Fast)</option>
                    </optgroup>
                    <optgroup label="🔍 Claude + Google Search (Recommended)">
                      <option value="hybrid-sonnet">🌟 Claude Sonnet 4.5 + Google Search (Best)</option>
                      <option value="hybrid-haiku">⚡ Claude Haiku 3.5 + Google Search (Fast)</option>
                    </optgroup>
                    <optgroup label="📚 Claude Only (No Search)">
                      <option value="sonnet">🌟 Claude Sonnet 4.5 - High Quality</option>
                      <option value="haiku">⚡ Claude Haiku 3.5 - Fast Draft</option>
                    </optgroup>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    💡 Models with "Search" use Google Search for real-time data • Claude-only uses training data (up to Jan 2025)
                  </p>
                </div>
              </div>

              {/* Platform Selection */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  <Film className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Streaming Platform *
                </label>
                <select
                  value={agentForm.platform}
                  onChange={(e) => updateFormField('platform', e.target.value)}
                  className="w-full px-5 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                >
                  <option value="auto-detect">🔍 Auto-Detect (Recommended)</option>
                  <option value="netflix">𝗡 Netflix</option>
                  <option value="amazon-prime">𝗣 Amazon Prime Video</option>
                  <option value="disney-plus">✨ Disney+</option>
                  <option value="hulu">🟢 Hulu</option>
                  <option value="apple-tv">🍎 Apple TV+</option>
                  <option value="hbo-max">🎭 Max (HBO Max)</option>
                  <option value="paramount-plus">⛰️ Paramount+</option>
                  <option value="peacock">🦚 Peacock</option>
                  <option value="youtube-premium">▶️ YouTube Premium</option>
                  <option value="theatrical">🎥 Theatrical Release</option>
                  <option value="other">📱 Other Platform</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  💡 Auto-detect will search all platforms. Select specific platform for better accuracy.
                </p>
              </div>

              {/* Row: Image URL + Article Length */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image URL */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Image URL <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    value={agentForm.imageUrl}
                    onChange={(e) => updateFormField('imageUrl', e.target.value)}
                    placeholder="https://example.com/poster.jpg"
                    className="w-full px-5 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                  />
                </div>

                {/* Article Length */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Article Length (Words) *
                  </label>
                  <input
                    type="number"
                    value={agentForm.articleLength}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 500 : parseInt(e.target.value);
                      if (!isNaN(value)) {
                        updateFormField('articleLength', Math.min(Math.max(value, 100), 1000));
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || parseInt(e.target.value) < 100) {
                        updateFormField('articleLength', 500);
                      }
                    }}
                    min="100"
                    max="1000"
                    step="50"
                    className="w-full px-5 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    placeholder="500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Target word count (100-1000 words)
                  </p>
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Language *
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => updateFormField('language', 'english')}
                    className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                      agentForm.language === 'english'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                    }`}
                  >
                    <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">🇺🇸 English</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">American English</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateFormField('language', 'hindi')}
                    className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                      agentForm.language === 'hindi'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                    }`}
                  >
                    <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">🇮🇳 हिंदी</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pure Hindi (Devanagari)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateFormField('language', 'hinglish')}
                    className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                      agentForm.language === 'hinglish'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                    }`}
                  >
                    <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">🇮🇳 Hinglish</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hindi in Roman script</div>
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  💡 Choose the language for your generated content
                </p>
              </div>

              {/* Custom Instructions */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Custom Instructions <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                </label>
                <textarea
                  value={agentForm.customInstructions}
                  onChange={(e) => updateFormField('customInstructions', e.target.value)}
                  rows={4}
                  placeholder="Add specific requirements or instructions...&#10;Examples: Focus on cinematography, casual tone, compare to director's previous work, etc."
                  className="w-full px-5 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 resize-y transition-all"
                />
              </div>

              {/* Error Display */}
              {agentError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
                  <div className="flex items-start gap-3">
                    <span className="text-red-600 dark:text-red-400 text-xl mt-0.5">⚠️</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Generation Failed</p>
                      <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-line">{agentError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={agentGenerating || !agentForm.movieName.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-lg"
              >
                {agentGenerating ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating Article...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-6 h-6" />
                    Generate Article with AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Preview Mode */
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Success Banner */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">
                  ✓ Article Generated Successfully!
                </p>
                <p className="text-green-100 text-sm mt-1">
                  Review and edit the content below. All fields are editable before publishing.
                </p>
              </div>
            </div>
          </div>

          {/* Preview Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Image Section */}
            {agentPreview.image && !agentPreview.image.includes('via.placeholder.com') && (
              <div className="relative h-80 overflow-hidden">
                <img
                  src={agentPreview.image}
                  alt={agentPreview.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 right-4">
                  <input
                    type="url"
                    value={agentPreview.image}
                    onChange={(e) => updatePreviewContent('image', e.target.value)}
                    placeholder="Update image URL"
                    className="px-4 py-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white shadow-lg"
                  />
                </div>
              </div>
            )}

            <div className="p-8 space-y-6">
              {/* Category Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-4 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-md">
                  {agentPreview.scriptType === 'review' ? '⭐ REVIEW' : agentPreview.scriptType === 'story' ? '📖 STORY' : '📺 YOUTUBE SCRIPT'}
                </span>
                <select
                  value={agentPreview.category}
                  onChange={(e) => updatePreviewContent('category', e.target.value)}
                  className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-full border-none cursor-pointer shadow-md"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <span className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-md">
                  ✨ AI GENERATED
                </span>
              </div>

              {/* Image URL Input (if no image) */}
              {(!agentPreview.image || agentPreview.image.includes('via.placeholder.com')) && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <ImageIcon className="w-4 h-4" />
                    Article Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={agentPreview.image}
                    onChange={(e) => updatePreviewContent('image', e.target.value)}
                    className="w-full px-5 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    placeholder="https://example.com/movie-poster.jpg"
                  />
                </div>
              )}

              {/* Title */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  <Film className="w-3.5 h-3.5" />
                  ARTICLE TITLE
                </label>
                <input
                  type="text"
                  value={agentPreview.title}
                  onChange={(e) => updatePreviewContent('title', e.target.value)}
                  className="w-full text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600 focus:border-purple-500 dark:focus:border-purple-500 rounded-xl px-4 py-3 transition-all"
                  placeholder="Article title..."
                />
              </div>

              {/* Content */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  ARTICLE CONTENT
                </label>
                <textarea
                  value={agentPreview.content}
                  onChange={(e) => updatePreviewContent('content', e.target.value)}
                  rows={22}
                  className="w-full text-base leading-relaxed text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-500 rounded-xl px-5 py-4 transition-all resize-y"
                  placeholder="Article content..."
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    💡 Tip: You can edit the content directly in the text area above
                  </p>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {agentPreview.content.split(/\s+/).filter(word => word.length > 0).length} words
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {agentPreview.scriptType === 'youtube' && (
              <button
                onClick={handleDownloadScript}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-lg"
              >
                <Download className="w-6 h-6" />
                Download Script
              </button>
            )}
            <button
              onClick={handlePublish}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-lg"
            >
              <Upload className="w-6 h-6" />
              Publish {agentPreview.scriptType === 'youtube' ? 'Script' : 'Article'}
            </button>
            <button
              onClick={resetForm}
              className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-lg"
            >
              <X className="w-6 h-6" />
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIArticleGenerator;
