import React, { useState } from 'react';
import { X, Sparkles, Check, RefreshCw, MessageSquare, ArrowRight } from 'lucide-react';
import { ParsedCommit } from '../types';

interface AiPolishModalProps {
  isOpen: boolean;
  onClose: () => void;
  commits: ParsedCommit[];
  repoName: string;
  onApplyAiResult: (data: {
    executiveSummary: string;
    subjectLine: string;
    preheader: string;
  }) => void;
}

export const AiPolishModal: React.FC<AiPolishModalProps> = ({
  isOpen,
  onClose,
  commits,
  repoName,
  onApplyAiResult,
}) => {
  const [tone, setTone] = useState<'engaging' | 'developer' | 'executive' | 'concise'>('engaging');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    executiveSummary: string;
    subjectLine: string;
    preheader: string;
    features?: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    const activeCommits = commits.filter((c) => c.isIncluded);
    const rawItems = activeCommits.map((c) => ({
      title: c.cleanTitle,
      category: c.category,
      author: c.authorName,
      sha: c.shortSha,
    }));

    try {
      const res = await fetch('/api/ai/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoName,
          dateRange: 'the last 7 days',
          rawItems,
          tone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult({
          executiveSummary: data.executiveSummary || '',
          subjectLine: data.subjectLine || `🚀 What's New in ${repoName}`,
          preheader: data.preheader || `Weekly changelog and releases for ${repoName}`,
          features: data.features || [],
        });
      } else {
        // Smart client-side fallback if Gemini key is absent
        const topFeatures = activeCommits.filter((c) => c.category === 'features').map((c) => c.cleanTitle);
        const topFixes = activeCommits.filter((c) => c.category === 'bugfixes').length;
        const total = activeCommits.length;

        const fallbackSummary = `Over the past week, the ${repoName} team shipped ${total} commits across major improvements and fixes. Highlights include ${topFeatures.slice(0, 2).join(' and ') || 'core stability and polish'}, along with ${topFixes} bug fixes to boost overall platform reliability.`;

        const fallbackSubject = `🚀 What's New in ${repoName}: ${topFeatures[0] || 'Weekly Release Notes'}`;
        const fallbackPre = `${total} updates, ${topFixes} fixes, and new improvements ready in this week's release.`;

        setResult({
          executiveSummary: fallbackSummary,
          subjectLine: fallbackSubject,
          preheader: fallbackPre,
        });
      }
    } catch {
      // Local heuristic fallback
      const activeCommits = commits.filter((c) => c.isIncluded);
      const topFeatures = activeCommits.filter((c) => c.category === 'features').map((c) => c.cleanTitle);
      const topFixes = activeCommits.filter((c) => c.category === 'bugfixes').length;
      const total = activeCommits.length;

      const fallbackSummary = `This week, the ${repoName} repository received ${total} updates. Key highlights include ${topFeatures.slice(0, 2).join(' and ') || 'performance enhancements'}, plus ${topFixes} fixes addressing stability and developer workflows.`;

      setResult({
        executiveSummary: fallbackSummary,
        subjectLine: `🚀 ${repoName} Release Update: ${topFeatures[0] || 'Weekly Changelog'}`,
        preheader: `Read the latest updates and ${total} commits shipped in ${repoName}.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApplyAiResult({
        executiveSummary: result.executiveSummary,
        subjectLine: result.subjectLine,
        preheader: result.preheader,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2 text-white font-semibold">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>AI Changelog Polish & Executive Summary</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <p className="text-sm text-slate-300">
            Let Gemini transform messy raw git commits into a captivating, executive-ready changelog intro and email newsletter.
          </p>

          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Newsletter Tone
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'engaging', label: 'Engaging & Vibrant', desc: 'Product updates for users' },
                { id: 'developer', label: 'Engineering Focused', desc: 'Technical & direct' },
                { id: 'executive', label: 'Executive / Brief', desc: 'High-level business impact' },
                { id: 'concise', label: 'Crisp & Minimal', desc: 'Short bullets only' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    tone === t.id
                      ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold text-white mb-0.5">{t.label}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Action to Generate */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              Analyzing <strong className="text-white">{commits.filter((c) => c.isIncluded).length}</strong> included commits
            </span>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/25 flex items-center space-x-2 transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Summary...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate with Gemini</span>
                </>
              )}
            </button>
          </div>

          {/* Result Preview */}
          {result && (
            <div className="p-4 bg-slate-950 border border-indigo-500/30 rounded-xl space-y-3 animate-fade-in">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Generated AI Content</span>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-400 mb-1">Suggested Subject Line:</div>
                <div className="text-xs font-medium text-white bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  {result.subjectLine}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-400 mb-1">Executive Summary:</div>
                <div className="text-xs leading-relaxed text-slate-200 bg-slate-900 p-3 rounded-lg border border-slate-800">
                  {result.executiveSummary}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-400 mb-1">Email Preheader:</div>
                <div className="text-xs text-slate-400 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  {result.preheader}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!result}
            className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center space-x-1.5"
          >
            <span>Apply to Changelog & Email</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
