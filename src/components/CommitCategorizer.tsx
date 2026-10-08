import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Search,
  Edit2,
  Check,
  ExternalLink,
  ChevronDown,
  GitCommit,
  User,
  Filter,
} from 'lucide-react';
import { CategoryId, ParsedCommit } from '../types';
import { CATEGORIES } from '../utils/categorizer';

interface CommitCategorizerProps {
  commits: ParsedCommit[];
  onToggleCommit: (sha: string) => void;
  onUpdateCommitTitle: (sha: string, newTitle: string) => void;
  onChangeCategory: (sha: string, newCategory: CategoryId) => void;
  onToggleCategoryGroup: (categoryId: CategoryId, included: boolean) => void;
  onSelectAll: (included: boolean) => void;
}

export const CommitCategorizer: React.FC<CommitCategorizerProps> = ({
  commits,
  onToggleCommit,
  onUpdateCommitTitle,
  onChangeCategory,
  onToggleCategoryGroup,
  onSelectAll,
}) => {
  const [selectedTab, setSelectedTab] = useState<CategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSha, setEditingSha] = useState<string | null>(null);
  const [editTitleDraft, setEditTitleDraft] = useState('');

  const includedCount = commits.filter((c) => c.isIncluded).length;

  // Filter commits by tab and search
  const filteredCommits = commits.filter((c) => {
    if (selectedTab !== 'all' && c.category !== selectedTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inTitle = c.cleanTitle.toLowerCase().includes(q);
      const inRaw = c.rawMessage.toLowerCase().includes(q);
      const inAuthor = c.authorName.toLowerCase().includes(q) || (c.authorLogin?.toLowerCase().includes(q) ?? false);
      const inSha = c.shortSha.toLowerCase().includes(q);
      return inTitle || inRaw || inAuthor || inSha;
    }
    return true;
  });

  const startEditing = (commit: ParsedCommit) => {
    setEditingSha(commit.sha);
    setEditTitleDraft(commit.cleanTitle);
  };

  const saveEdit = (sha: string) => {
    if (editTitleDraft.trim()) {
      onUpdateCommitTitle(sha, editTitleDraft.trim());
    }
    setEditingSha(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Category Header Tabs */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Categorized Commits</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {includedCount} of {commits.length} included
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Review and classify commits into clean changelog sections before publishing.
            </p>
          </div>

          {/* Bulk Selection Actions */}
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => onSelectAll(true)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={() => onSelectAll(false)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Category Pills bar */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              selectedTab === 'all'
                ? 'bg-slate-100 text-slate-900 shadow-sm'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>All Commits</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {commits.length}
            </span>
          </button>

          {CATEGORIES.map((cat) => {
            const count = commits.filter((c) => c.category === cat.id).length;
            const isTabActive = selectedTab === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedTab(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 border ${
                  isTabActive
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
                <span
                  className="px-1.5 py-0.2 rounded-full text-[10px]"
                  style={{
                    backgroundColor: isTabActive ? 'rgba(255,255,255,0.2)' : cat.badgeBg,
                    color: isTabActive ? '#ffffff' : cat.badgeText,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search bar inside categorizer */}
        <div className="relative pt-1">
          <div className="absolute inset-y-0 left-0 pl-3 pt-1 flex items-center pointer-events-none text-slate-500">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            placeholder="Search commits by message, author, or SHA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Commits List Body */}
      <div className="divide-y divide-slate-800/60 max-h-[520px] overflow-y-auto">
        {filteredCommits.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Filter className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-medium">No commits match your current filter.</p>
            <p className="text-xs text-slate-500">Try changing the category tab or clearing the search query.</p>
          </div>
        ) : (
          filteredCommits.map((commit) => {
            const currentCat = CATEGORIES.find((c) => c.id === commit.category) || CATEGORIES[0];
            const isEditing = editingSha === commit.sha;

            return (
              <div
                key={commit.sha}
                className={`p-3.5 sm:p-4 transition-colors flex items-start gap-3 ${
                  commit.isIncluded ? 'hover:bg-slate-850/50' : 'bg-slate-950/40 opacity-60'
                }`}
              >
                {/* Include/Exclude Toggle Checkbox */}
                <button
                  type="button"
                  onClick={() => onToggleCommit(commit.sha)}
                  className="mt-0.5 text-indigo-400 hover:text-indigo-300 transition-colors shrink-0"
                  title={commit.isIncluded ? 'Click to exclude from changelog' : 'Click to include in changelog'}
                >
                  {commit.isIncluded ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </button>

                {/* Commit Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Title or Edit Input */}
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editTitleDraft}
                        onChange={(e) => setEditTitleDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(commit.sha)}
                        autoFocus
                        className="flex-1 px-2.5 py-1 bg-slate-950 border border-indigo-500 rounded text-xs text-white focus:outline-none"
                      />
                      <button
                        onClick={() => saveEdit(commit.sha)}
                        className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-500"
                        title="Save"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <span className="text-xs sm:text-sm font-semibold text-slate-200 break-words">
                        {commit.cleanTitle}
                      </span>
                      <button
                        onClick={() => startEditing(commit)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-indigo-400 transition-opacity"
                        title="Edit title"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Metadata Row: SHA, Author, Date, PR link */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    {/* Commit Hash badge */}
                    <a
                      href={commit.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-indigo-300 hover:border-indigo-800"
                    >
                      <GitCommit className="w-3 h-3" />
                      <span>{commit.shortSha}</span>
                    </a>

                    {/* PR Link if present */}
                    {commit.prNumber && commit.prUrl && (
                      <a
                        href={commit.prUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-sky-400 hover:underline font-medium"
                      >
                        <span>#{commit.prNumber}</span>
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </a>
                    )}

                    {/* Author */}
                    <span className="flex items-center space-x-1">
                      {commit.authorAvatar ? (
                        <img
                          src={commit.authorAvatar}
                          alt={commit.authorName}
                          className="w-3.5 h-3.5 rounded-full"
                        />
                      ) : (
                        <User className="w-3 h-3 text-slate-500" />
                      )}
                      <span className="text-slate-300">
                        {commit.authorLogin ? `@${commit.authorLogin}` : commit.authorName}
                      </span>
                    </span>

                    {/* Date */}
                    <span>&bull;</span>
                    <span className="text-slate-500">
                      {new Date(commit.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Category Reassignment Selector */}
                <div className="shrink-0 relative">
                  <select
                    value={commit.category}
                    onChange={(e) => onChangeCategory(commit.sha, e.target.value as CategoryId)}
                    className="text-xs font-semibold px-2 py-1 rounded-lg border appearance-none pr-6 cursor-pointer focus:outline-none"
                    style={{
                      backgroundColor: currentCat.badgeBg,
                      color: currentCat.badgeText,
                      borderColor: currentCat.badgeBorder,
                    }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                        {c.emoji} {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: currentCat.badgeText }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
