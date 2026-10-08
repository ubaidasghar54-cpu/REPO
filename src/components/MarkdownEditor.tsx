import React, { useRef } from 'react';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  Code,
  Quote,
  Link,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  FileText,
} from 'lucide-react';
import { ChangelogConfig } from '../types';

interface MarkdownEditorProps {
  markdown: string;
  onChangeMarkdown: (val: string) => void;
  config: ChangelogConfig;
  onUpdateConfig: (partial: Partial<ChangelogConfig>) => void;
  onRegenerate: () => void;
  onOpenAiPolish: () => void;
  isAiGenerating: boolean;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  markdown,
  onChangeMarkdown,
  config,
  onUpdateConfig,
  onRegenerate,
  onOpenAiPolish,
  isAiGenerating,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Helper to wrap selected text with markdown tags
  const applyFormat = (prefix: string, suffix: string = '') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = markdown.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;

    const newText = markdown.substring(0, start) + replacement + markdown.substring(end);
    onChangeMarkdown(newText);

    // restore cursor position
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 4));
    }, 10);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Stats
  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const lineCount = markdown.split('\n').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Top Header Bar */}
      <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Interactive Markdown Editor</h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenAiPolish}
            disabled={isAiGenerating}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 hover:from-violet-500 hover:to-sky-500 text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>{isAiGenerating ? 'AI Refining...' : 'AI Polish & Summarize'}</span>
          </button>

          <button
            onClick={onRegenerate}
            title="Reset to current commit state"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sync from Commits</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Formatting Toolbar */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Style buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => applyFormat('**', '**')}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Bold (**text**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormat('*', '*')}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Italic (*text*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormat('## ')}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormat('### ')}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Heading 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormat('- ')}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormat('`', '`')}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Inline Code"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormat('> ')}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Blockquote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormat('[', '](https://...)')}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Link"
          >
            <Link className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Checkbox Options for Markdown rendering */}
        <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
          <label className="flex items-center space-x-1 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={config.includeAuthor}
              onChange={(e) => onUpdateConfig({ includeAuthor: e.target.checked })}
              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>Authors</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={config.includeCommitHash}
              onChange={(e) => onUpdateConfig({ includeCommitHash: e.target.checked })}
              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>SHA Badges</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={config.includePrLinks}
              onChange={(e) => onUpdateConfig({ includePrLinks: e.target.checked })}
              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>PR Links</span>
          </label>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 relative min-h-[380px]">
        <textarea
          ref={textareaRef}
          value={markdown}
          onChange={(e) => onChangeMarkdown(e.target.value)}
          placeholder="# Changelog..."
          className="w-full h-full p-4 bg-slate-950 text-slate-200 font-mono text-xs sm:text-sm leading-relaxed resize-none focus:outline-none border-none selection:bg-indigo-600/40"
        />
      </div>

      {/* Footer stats */}
      <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <div>
          <span>{lineCount} lines</span> &bull; <span>{wordCount} words</span> &bull;{' '}
          <span>{markdown.length} characters</span>
        </div>
        <div className="text-slate-400">Markdown Live Sync</div>
      </div>
    </div>
  );
};
