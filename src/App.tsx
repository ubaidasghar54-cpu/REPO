import React, { useState, useEffect, useMemo } from 'react';
import {
  GitBranch,
  Layers,
  FileCode,
  Mail,
  AlertCircle,
  Sparkles,
  Info,
  Clock,
  Users,
  GitCommit,
  CheckCircle2,
  Columns,
  Maximize2,
} from 'lucide-react';

import { Navbar } from './components/Navbar';
import { TokenModal } from './components/TokenModal';
import { RepoSelector } from './components/RepoSelector';
import { CommitCategorizer } from './components/CommitCategorizer';
import { MarkdownEditor } from './components/MarkdownEditor';
import { EmailPreview } from './components/EmailPreview';
import { AiPolishModal } from './components/AiPolishModal';

import { CategoryId, ChangelogConfig, ParsedCommit, RateLimitInfo } from './types';
import { parseGitHubUrl, fetchCommitsFromGitHub, validateGitHubToken } from './utils/github';
import { parseGitHubCommits } from './utils/categorizer';
import { generateMarkdown, generateEmailHtml } from './utils/markdownGenerator';

export default function App() {
  // Authentication & Settings
  const [token, setToken] = useState<string>(() => localStorage.getItem('gitlog_github_token') || '');
  const [tokenUser, setTokenUser] = useState<{ login: string; avatarUrl: string } | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);

  // Repo & Dates Selection
  const [repoInput, setRepoInput] = useState('facebook/react');
  const [dateRange, setDateRange] = useState<'7d' | '14d' | '30d' | 'custom'>('7d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [branch, setBranch] = useState('');

  // Commits & Status
  const [commits, setCommits] = useState<ParsedCommit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  // View state: 'split' or single tab ('categorize' | 'editor' | 'preview')
  const [activeTab, setActiveTab] = useState<'categorize' | 'editor' | 'preview'>('categorize');
  const [layoutMode, setLayoutMode] = useState<'tabs' | 'split'>('split');

  // AI Polish modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Changelog Config
  const [config, setConfig] = useState<ChangelogConfig>({
    repoOwner: 'facebook',
    repoName: 'react',
    dateRange: '7d',
    sinceDate: '',
    untilDate: '',
    branch: '',
    includeAuthor: true,
    includeCommitHash: true,
    includePrLinks: true,
    emailSubject: "🚀 React Weekly: What's New & Updates",
    emailPreheader: "Here's what shipped this week across React's core team and community.",
    executiveSummary: '',
  });

  // Markdown Draft
  const [markdown, setMarkdown] = useState('');

  // Validate stored token on mount
  useEffect(() => {
    if (token) {
      validateGitHubToken(token)
        .then((user) => setTokenUser(user))
        .catch(() => {
          // Token might have expired
          setTokenUser(null);
        });
    }
  }, [token]);

  // Initial Fetch on load for quick preview
  useEffect(() => {
    handleFetchCommits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute since date string
  const getSinceIsoString = () => {
    const now = new Date();
    if (dateRange === '7d') {
      const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d.toISOString();
    }
    if (dateRange === '14d') {
      const d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      return d.toISOString();
    }
    if (dateRange === '30d') {
      const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return d.toISOString();
    }
    if (dateRange === 'custom' && customStartDate) {
      return new Date(customStartDate).toISOString();
    }
    // Default 7 days
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  };

  const getUntilIsoString = () => {
    if (dateRange === 'custom' && customEndDate) {
      return new Date(customEndDate).toISOString();
    }
    return undefined;
  };

  // Main Commit Fetcher
  const handleFetchCommits = async () => {
    const parsed = parseGitHubUrl(repoInput);
    if (!parsed) {
      setError('Please enter a valid GitHub repository name or URL (e.g. facebook/react).');
      return;
    }

    setLoading(true);
    setError(null);

    const sinceIso = getSinceIsoString();
    const untilIso = getUntilIsoString();

    try {
      const { commits: rawCommits, rateLimit: rl } = await fetchCommitsFromGitHub({
        owner: parsed.owner,
        repo: parsed.repo,
        since: sinceIso,
        until: untilIso,
        token: token || undefined,
      });

      setRateLimit(rl);

      const parsedCommits = parseGitHubCommits(rawCommits, parsed.owner, parsed.repo);
      setCommits(parsedCommits);
      setHasFetchedOnce(true);

      const newSubject = `🚀 ${parsed.repo} Changelog: What's New & Updates`;
      const newPreheader = `Here are the latest updates and ${parsedCommits.length} commits shipped in ${parsed.fullName}.`;

      setConfig((prev) => ({
        ...prev,
        repoOwner: parsed.owner,
        repoName: parsed.repo,
        branch: branch || 'main',
        emailSubject: newSubject,
        emailPreheader: newPreheader,
      }));

      // Generate initial Markdown
      const initialMd = generateMarkdown({
        commits: parsedCommits,
        config: {
          ...config,
          repoOwner: parsed.owner,
          repoName: parsed.repo,
          emailSubject: newSubject,
        },
        executiveSummary: '',
      });
      setMarkdown(initialMd);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch commits from GitHub.');
    } finally {
      setLoading(false);
    }
  };

  // Re-generate markdown when commits or config change
  const syncMarkdownFromCommits = () => {
    const freshMd = generateMarkdown({
      commits,
      config,
      executiveSummary: config.executiveSummary,
    });
    setMarkdown(freshMd);
  };

  // Toggle single commit inclusion
  const handleToggleCommit = (sha: string) => {
    const updated = commits.map((c) => (c.sha === sha ? { ...c, isIncluded: !c.isIncluded } : c));
    setCommits(updated);
    const freshMd = generateMarkdown({
      commits: updated,
      config,
      executiveSummary: config.executiveSummary,
    });
    setMarkdown(freshMd);
  };

  // Inline edit commit title
  const handleUpdateCommitTitle = (sha: string, newTitle: string) => {
    const updated = commits.map((c) => (c.sha === sha ? { ...c, cleanTitle: newTitle } : c));
    setCommits(updated);
    const freshMd = generateMarkdown({
      commits: updated,
      config,
      executiveSummary: config.executiveSummary,
    });
    setMarkdown(freshMd);
  };

  // Change category of a commit
  const handleChangeCategory = (sha: string, newCat: CategoryId) => {
    const updated = commits.map((c) => (c.sha === sha ? { ...c, category: newCat } : c));
    setCommits(updated);
    const freshMd = generateMarkdown({
      commits: updated,
      config,
      executiveSummary: config.executiveSummary,
    });
    setMarkdown(freshMd);
  };

  // Bulk category toggle
  const handleToggleCategoryGroup = (categoryId: CategoryId, included: boolean) => {
    const updated = commits.map((c) => (c.category === categoryId ? { ...c, isIncluded: included } : c));
    setCommits(updated);
    const freshMd = generateMarkdown({
      commits: updated,
      config,
      executiveSummary: config.executiveSummary,
    });
    setMarkdown(freshMd);
  };

  // Select / Deselect all
  const handleSelectAll = (included: boolean) => {
    const updated = commits.map((c) => ({ ...c, isIncluded: included }));
    setCommits(updated);
    const freshMd = generateMarkdown({
      commits: updated,
      config,
      executiveSummary: config.executiveSummary,
    });
    setMarkdown(freshMd);
  };

  // Update Config
  const handleUpdateConfig = (partial: Partial<ChangelogConfig>) => {
    const nextConfig = { ...config, ...partial };
    setConfig(nextConfig);
    const freshMd = generateMarkdown({
      commits,
      config: nextConfig,
      executiveSummary: nextConfig.executiveSummary,
    });
    setMarkdown(freshMd);
  };

  // Save Token
  const handleSaveToken = (newToken: string, user?: { login: string; avatarUrl: string }) => {
    setToken(newToken);
    localStorage.setItem('gitlog_github_token', newToken);
    if (user) setTokenUser(user);
  };

  // Clear Token
  const handleClearToken = () => {
    setToken('');
    setTokenUser(null);
    localStorage.removeItem('gitlog_github_token');
  };

  // Apply AI Polish Results
  const handleApplyAiResult = (data: {
    executiveSummary: string;
    subjectLine: string;
    preheader: string;
  }) => {
    const nextConfig = {
      ...config,
      executiveSummary: data.executiveSummary,
      emailSubject: data.subjectLine,
      emailPreheader: data.preheader,
    };
    setConfig(nextConfig);
    const freshMd = generateMarkdown({
      commits,
      config: nextConfig,
      executiveSummary: data.executiveSummary,
    });
    setMarkdown(freshMd);
  };

  // Rendered Email HTML
  const emailHtml = useMemo(() => {
    return generateEmailHtml({
      commits,
      config,
      executiveSummary: config.executiveSummary,
    });
  }, [commits, config]);

  // Derived Stats
  const activeCommitsCount = commits.filter((c) => c.isIncluded).length;
  const uniqueAuthors = useMemo(() => {
    return new Set(commits.map((c) => c.authorLogin || c.authorName)).size;
  }, [commits]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
        hasToken={Boolean(token)}
        tokenUser={tokenUser}
        rateLimit={rateLimit}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Repo Input & Controls Card */}
        <RepoSelector
          repoInput={repoInput}
          onChangeRepoInput={setRepoInput}
          dateRange={dateRange}
          onChangeDateRange={setDateRange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onChangeCustomDates={(start, end) => {
            setCustomStartDate(start);
            setCustomEndDate(end);
          }}
          branch={branch}
          onChangeBranch={setBranch}
          onFetchCommits={handleFetchCommits}
          loading={loading}
        />

        {/* Error Banner with helpful troubleshooting */}
        {error && (
          <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-2xl flex items-start space-x-3 text-rose-200 animate-fade-in shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm flex-1 space-y-1">
              <div className="font-semibold text-rose-300">GitHub API Notice</div>
              <div>{error}</div>
              {!token && (
                <button
                  onClick={() => setIsTokenModalOpen(true)}
                  className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800/80 text-white font-medium text-xs transition-colors"
                >
                  <span>Connect GitHub Token (5,000 req/hr)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stats Strip when commits are loaded */}
        {hasFetchedOnce && !loading && (
          <div className="p-4 bg-slate-900/90 border border-slate-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-md">
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
              <div className="flex items-center space-x-2 text-slate-300">
                <GitCommit className="w-4 h-4 text-indigo-400" />
                <span>
                  <strong className="text-white">{commits.length}</strong> Commits Found
                </span>
                <span className="text-slate-500">({activeCommitsCount} included in release)</span>
              </div>

              <div className="flex items-center space-x-2 text-slate-300">
                <Users className="w-4 h-4 text-sky-400" />
                <span>
                  <strong className="text-white">{uniqueAuthors}</strong> Contributor{uniqueAuthors !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-slate-400">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Range: {dateRange.toUpperCase()}</span>
              </div>
            </div>

            {/* Layout switch: Split studio vs Single Tab */}
            <div className="flex items-center space-x-2">
              <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
                <button
                  onClick={() => setLayoutMode('split')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                    layoutMode === 'split' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Side-by-side workspace"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Split Studio</span>
                </button>
                <button
                  onClick={() => setLayoutMode('tabs')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                    layoutMode === 'tabs' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Focused tabs"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tabs View</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab switcher when in Tabs mode */}
        {layoutMode === 'tabs' && hasFetchedOnce && (
          <div className="flex border-b border-slate-800 space-x-2 pb-1">
            <button
              onClick={() => setActiveTab('categorize')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'categorize'
                  ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>1. Categorize Commits ({commits.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'editor'
                  ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>2. Interactive Markdown</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'preview'
                  ? 'border-emerald-500 text-emerald-400 bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>3. Email-Ready Preview</span>
            </button>
          </div>
        )}

        {/* Main Workspaces */}
        {loading ? (
          <div className="p-16 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <div className="text-slate-300 font-semibold text-base">Fetching and categorizing commits...</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Querying GitHub REST API for commits, parsing conventional commit conventions, and sorting into clean release categories.
            </p>
          </div>
        ) : commits.length === 0 && hasFetchedOnce ? (
          <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
            <GitCommit className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No commits found in this date range</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              There were no commits pushed to the repository in the selected timeframe. Try switching to "14 Days" or "30 Days".
            </p>
            <button
              onClick={() => {
                setDateRange('30d');
                setTimeout(() => handleFetchCommits(), 50);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
            >
              Expand to Last 30 Days
            </button>
          </div>
        ) : layoutMode === 'split' ? (
          /* Split Studio Layout: Categorizer on left, Markdown + Email Preview on right */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Categorizer */}
            <div className="lg:col-span-5 flex flex-col">
              <CommitCategorizer
                commits={commits}
                onToggleCommit={handleToggleCommit}
                onUpdateCommitTitle={handleUpdateCommitTitle}
                onChangeCategory={handleChangeCategory}
                onToggleCategoryGroup={handleToggleCategoryGroup}
                onSelectAll={handleSelectAll}
              />
            </div>

            {/* Right Column: Markdown Editor & Email Preview tabs / switcher */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              {/* Right column view toggle */}
              <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setActiveTab('editor')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'editor'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Markdown Editor</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'preview'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Preview</span>
                  </button>
                </div>

                <button
                  onClick={() => setIsAiModalOpen(true)}
                  className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>AI Polish</span>
                </button>
              </div>

              {/* Active right side view */}
              <div className="flex-1">
                {activeTab === 'preview' ? (
                  <EmailPreview
                    htmlContent={emailHtml}
                    markdownContent={markdown}
                    config={config}
                    onUpdateConfig={handleUpdateConfig}
                    onTriggerAiSubject={() => setIsAiModalOpen(true)}
                  />
                ) : (
                  <MarkdownEditor
                    markdown={markdown}
                    onChangeMarkdown={setMarkdown}
                    config={config}
                    onUpdateConfig={handleUpdateConfig}
                    onRegenerate={syncMarkdownFromCommits}
                    onOpenAiPolish={() => setIsAiModalOpen(true)}
                    isAiGenerating={isAiGenerating}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Single Tab View */
          <div className="w-full">
            {activeTab === 'categorize' && (
              <CommitCategorizer
                commits={commits}
                onToggleCommit={handleToggleCommit}
                onUpdateCommitTitle={handleUpdateCommitTitle}
                onChangeCategory={handleChangeCategory}
                onToggleCategoryGroup={handleToggleCategoryGroup}
                onSelectAll={handleSelectAll}
              />
            )}
            {activeTab === 'editor' && (
              <MarkdownEditor
                markdown={markdown}
                onChangeMarkdown={setMarkdown}
                config={config}
                onUpdateConfig={handleUpdateConfig}
                onRegenerate={syncMarkdownFromCommits}
                onOpenAiPolish={() => setIsAiModalOpen(true)}
                isAiGenerating={isAiGenerating}
              />
            )}
            {activeTab === 'preview' && (
              <EmailPreview
                htmlContent={emailHtml}
                markdownContent={markdown}
                config={config}
                onUpdateConfig={handleUpdateConfig}
                onTriggerAiSubject={() => setIsAiModalOpen(true)}
              />
            )}
          </div>
        )}
      </main>

      {/* GitHub Token Modal */}
      <TokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        token={token}
        onSaveToken={handleSaveToken}
        onClearToken={handleClearToken}
        tokenUser={tokenUser}
      />

      {/* AI Polish Modal */}
      <AiPolishModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        commits={commits}
        repoName={`${config.repoOwner}/${config.repoName}`}
        onApplyAiResult={handleApplyAiResult}
      />
    </div>
  );
}
