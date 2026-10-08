import React, { useState } from 'react';
import {
  Mail,
  Smartphone,
  Monitor,
  Code,
  Copy,
  Check,
  Download,
  Send,
  ExternalLink,
  Eye,
  FileDown,
  Sparkles,
} from 'lucide-react';
import { ChangelogConfig } from '../types';

interface EmailPreviewProps {
  htmlContent: string;
  markdownContent: string;
  config: ChangelogConfig;
  onUpdateConfig: (partial: Partial<ChangelogConfig>) => void;
  onTriggerAiSubject: () => void;
}

export const EmailPreview: React.FC<EmailPreviewProps> = ({
  htmlContent,
  markdownContent,
  config,
  onUpdateConfig,
  onTriggerAiSubject,
}) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile' | 'code'>('desktop');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setCopyFeedback(msg);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  /**
   * Copies formatted rich HTML directly to clipboard.
   * Enables 1-click Cmd+V into Gmail, Apple Mail, Outlook composer!
   */
  const handleCopyRichEmail = async () => {
    try {
      if (typeof window.ClipboardItem !== 'undefined') {
        const blobHtml = new Blob([htmlContent], { type: 'text/html' });
        const blobText = new Blob([markdownContent], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobText,
          }),
        ]);
        showToast('Formatted Email copied! Paste directly into Gmail/Outlook');
      } else {
        await navigator.clipboard.writeText(htmlContent);
        showToast('HTML code copied to clipboard');
      }
    } catch {
      await navigator.clipboard.writeText(htmlContent);
      showToast('HTML code copied to clipboard');
    }
  };

  const handleCopyRawHtml = async () => {
    await navigator.clipboard.writeText(htmlContent);
    showToast('Raw HTML code copied to clipboard');
  };

  const handleCopyMarkdown = async () => {
    await navigator.clipboard.writeText(markdownContent);
    showToast('Markdown copied to clipboard');
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.repoName || 'changelog'}-email-update.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded email.html');
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CHANGELOG-${config.repoName || 'release'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded CHANGELOG.md');
  };

  const handleOpenMailto = () => {
    const subject = encodeURIComponent(config.emailSubject || `Changelog: ${config.repoName}`);
    // Mailto body: using clean plain text summary
    const body = encodeURIComponent(markdownContent);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Top Header & View Controls */}
      <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Mail className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Email-Ready Newsletter Preview</h2>
        </div>

        {/* View Switcher: Desktop vs Mobile vs Code */}
        <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setViewMode('desktop')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === 'desktop' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop Mail</span>
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === 'mobile' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Mail</span>
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === 'code' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>HTML Code</span>
          </button>
        </div>
      </div>

      {/* Email Subject Line & Preheader Bar */}
      <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 shrink-0 w-16">Subject:</span>
          <input
            type="text"
            value={config.emailSubject}
            onChange={(e) => onUpdateConfig({ emailSubject: e.target.value })}
            placeholder="🚀 Weekly Changelog Update..."
            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={onTriggerAiSubject}
            title="Generate AI subject line"
            className="p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/60 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 shrink-0 w-16">Preheader:</span>
          <input
            type="text"
            value={config.emailPreheader}
            onChange={(e) => onUpdateConfig({ emailPreheader: e.target.value })}
            placeholder="Inbox preview text snippet..."
            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto bg-slate-950 p-4 sm:p-6 flex items-start justify-center min-h-[460px]">
        {/* Toast Notification */}
        {copyFeedback && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-xs shadow-2xl animate-fade-in flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>{copyFeedback}</span>
          </div>
        )}

        {viewMode === 'desktop' && (
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-fade-in">
            {/* Desktop Email Client Chrome */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="font-semibold text-slate-800 ml-2">
                  To: <span className="font-normal text-slate-600">subscribers@yourproduct.com</span>
                </span>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">Gmail / Apple Mail Ready</span>
            </div>

            {/* Email Iframe container */}
            <div className="p-2 sm:p-4 bg-slate-50">
              <iframe
                title="Email Desktop Preview"
                srcDoc={htmlContent}
                className="w-full h-[520px] rounded border border-slate-200 bg-white"
              />
            </div>
          </div>
        )}

        {viewMode === 'mobile' && (
          <div className="w-[375px] bg-slate-800 p-3 rounded-[36px] shadow-2xl border-4 border-slate-700 animate-fade-in">
            {/* Phone Speaker/Camera notch */}
            <div className="w-28 h-4 bg-slate-900 rounded-full mx-auto mb-2" />

            <div className="bg-white rounded-[24px] overflow-hidden text-slate-900 shadow-inner">
              <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 text-[11px] text-slate-600">
                <span className="font-bold text-slate-800">Inbox</span> &bull; {config.emailSubject}
              </div>
              <iframe
                title="Email Mobile Preview"
                srcDoc={htmlContent}
                className="w-full h-[480px] bg-white"
              />
            </div>
          </div>
        )}

        {viewMode === 'code' && (
          <div className="w-full h-full max-h-[520px] bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-auto">
            <pre className="whitespace-pre-wrap leading-relaxed">{htmlContent}</pre>
          </div>
        )}
      </div>

      {/* Export & Action Footer */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* 1-Click Rich Text Copy for Gmail */}
          <button
            onClick={handleCopyRichEmail}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            title="Copies formatted email with colors and styles so you can paste directly into Gmail or Outlook"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Formatted Email (Rich Text)</span>
          </button>

          <button
            onClick={handleCopyRawHtml}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Copy Raw HTML</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Markdown</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenMailto}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Open default email client"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Mail Client</span>
          </button>

          <button
            onClick={handleDownloadHtml}
            className="p-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Download .html file"
          >
            <FileDown className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="p-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Download CHANGELOG.md file"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
