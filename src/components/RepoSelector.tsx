import React, { useState } from 'react';
import { Search, Calendar, GitBranch, Sparkles, ArrowRight, RefreshCw, X } from 'lucide-react';

interface RepoSelectorProps {
  repoInput: string;
  onChangeRepoInput: (val: string) => void;
  dateRange: '7d' | '14d' | '30d' | 'custom';
  onChangeDateRange: (range: '7d' | '14d' | '30d' | 'custom') => void;
  customStartDate: string;
  customEndDate: string;
  onChangeCustomDates: (start: string, end: string) => void;
  branch: string;
  onChangeBranch: (val: string) => void;
  onFetchCommits: () => void;
  loading: boolean;
}

const POPULAR_REPOS = [
  { name: 'facebook/react', label: 'React' },
  { name: 'vercel/next.js', label: 'Next.js' },
  { name: 'tailwindlabs/tailwindcss', label: 'Tailwind CSS' },
  { name: 'shadcn-ui/ui', label: 'shadcn/ui' },
  { name: 'microsoft/TypeScript', label: 'TypeScript' },
];

export const RepoSelector: React.FC<RepoSelectorProps> = ({
  repoInput,
  onChangeRepoInput,
  dateRange,
  onChangeDateRange,
  customStartDate,
  customEndDate,
  onChangeCustomDates,
  branch,
  onChangeBranch,
  onFetchCommits,
  loading,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoInput.trim() && !loading) {
      onFetchCommits();
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Decorative subtle background gradient */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Top URL Input Bar */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5 text-indigo-400" />
            </div>
            <input
              type="text"
              value={repoInput}
              onChange={(e) => onChangeRepoInput(e.target.value)}
              placeholder="Paste GitHub repo URL or shorthand (e.g. vercel/next.js or https://github.com/facebook/react)"
              className="w-full pl-11 pr-10 py-3.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
            />
            {repoInput && (
              <button
                type="button"
                onClick={() => onChangeRepoInput('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !repoInput.trim()}
            className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2 text-sm sm:text-base shrink-0 active:scale-95"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Fetching Commits...</span>
              </>
            ) : (
              <>
                <span>Fetch Commits</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400 font-medium">Quick Test:</span>
          {POPULAR_REPOS.map((pop) => (
            <button
              key={pop.name}
              type="button"
              onClick={() => {
                onChangeRepoInput(pop.name);
              }}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                repoInput.toLowerCase().includes(pop.name.toLowerCase())
                  ? 'bg-indigo-950 border-indigo-700 text-indigo-300'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {pop.label}
            </button>
          ))}
        </div>

        {/* Controls row: Date range selector & options */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 mr-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Timeframe:</span>
            </span>

            <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => onChangeDateRange('7d')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  dateRange === '7d'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Last 7 Days (Default)
              </button>
              <button
                type="button"
                onClick={() => onChangeDateRange('14d')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  dateRange === '14d'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                14 Days
              </button>
              <button
                type="button"
                onClick={() => onChangeDateRange('30d')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  dateRange === '30d'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => onChangeDateRange('custom')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  dateRange === 'custom'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Custom Range
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-slate-400 hover:text-indigo-400 flex items-center space-x-1"
          >
            <GitBranch className="w-3 h-3" />
            <span>{showAdvanced ? 'Hide Options' : 'Branch & Filters'}</span>
          </button>
        </div>

        {/* Custom Date Pickers if 'custom' is active */}
        {dateRange === 'custom' && (
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-wrap items-center gap-3 animate-fade-in">
            <div className="flex items-center space-x-2">
              <label className="text-xs text-slate-400">Since:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => onChangeCustomDates(e.target.value, customEndDate)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs text-slate-400">Until:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => onChangeCustomDates(customStartDate, e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
          </div>
        )}

        {/* Advanced Options panel */}
        {showAdvanced && (
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-fade-in">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Target Branch / Tag (optional)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. main, canary, v2.0"
                  value={branch}
                  onChange={(e) => onChangeBranch(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>
            </div>
            <div className="flex items-center text-slate-400">
              <span>Leaving branch empty pulls commits from the repository's default branch.</span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
