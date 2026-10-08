import React, { useState } from 'react';
import { X, Key, ShieldCheck, AlertCircle, ExternalLink, Trash2, CheckCircle2 } from 'lucide-react';
import { validateGitHubToken } from '../utils/github';

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onSaveToken: (token: string, user?: { login: string; avatarUrl: string }) => void;
  onClearToken: () => void;
  tokenUser?: { login: string; avatarUrl: string } | null;
}

export const TokenModal: React.FC<TokenModalProps> = ({
  isOpen,
  onClose,
  token,
  onSaveToken,
  onClearToken,
  tokenUser,
}) => {
  const [inputVal, setInputVal] = useState(token);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    if (!inputVal.trim()) {
      setError('Please enter a GitHub personal access token.');
      return;
    }

    setTesting(true);
    setError(null);
    setSuccess(null);

    try {
      const user = await validateGitHubToken(inputVal.trim());
      setSuccess(`Token verified! Authenticated as @${user.login}.`);
      onSaveToken(inputVal.trim(), user);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with GitHub.');
    } finally {
      setTesting(false);
    }
  };

  const handleClear = () => {
    setInputVal('');
    setError(null);
    setSuccess(null);
    onClearToken();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2 text-white font-semibold">
            <Key className="w-5 h-5 text-indigo-400" />
            <span>GitHub Authentication & Token</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            By default, GitHub limits anonymous API requests to <strong className="text-white">60 requests/hour</strong>. Connecting a Personal Access Token increases your limit to <strong className="text-emerald-400">5,000 requests/hour</strong> and allows you to generate changelogs for <strong className="text-white">private repositories</strong>.
          </p>

          {/* Current user badge if authenticated */}
          {tokenUser && (
            <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={tokenUser.avatarUrl}
                  alt={tokenUser.login}
                  className="w-8 h-8 rounded-full ring-2 ring-emerald-500/50"
                />
                <div>
                  <div className="text-xs text-emerald-400 font-medium">Currently Connected</div>
                  <div className="text-sm font-bold text-white">@{tokenUser.login}</div>
                </div>
              </div>
              <button
                onClick={handleClear}
                className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/40 px-2.5 py-1.5 rounded-lg border border-rose-800/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          )}

          {/* Input field */}
          <div className="space-y-2">
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
              Personal Access Token (Classic or Fine-grained)
            </label>
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_xxxx"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Status feedback */}
          {error && (
            <div className="p-3 bg-rose-950/30 border border-rose-800/50 rounded-xl flex items-start space-x-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-xl flex items-start space-x-2 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Privacy note */}
          <div className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Your token is stored only in your browser’s localStorage. It is never logged or sent to any server other than GitHub’s official API.
            </span>
          </div>

          {/* Helpful Link */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=GitLog%20Pulse"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <span>Generate a GitHub Token on GitHub.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-500">Requires `repo` scope for private repos</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleTestAndSave}
            disabled={testing || !inputVal.trim()}
            className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-1.5"
          >
            {testing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Validating...</span>
              </>
            ) : (
              <span>Save & Verify Token</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
