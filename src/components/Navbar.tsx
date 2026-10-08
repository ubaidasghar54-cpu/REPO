import React from 'react';
import { GitCommit, Key, ShieldCheck, ExternalLink, Sparkles } from 'lucide-react';
import { RateLimitInfo } from '../types';

interface NavbarProps {
  onOpenTokenModal: () => void;
  hasToken: boolean;
  tokenUser?: { login: string; avatarUrl: string } | null;
  rateLimit: RateLimitInfo | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenTokenModal,
  hasToken,
  tokenUser,
  rateLimit,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Tagline */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
            <GitCommit className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">GitLog Pulse</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Turn GitHub commits into clean changelogs & email newsletters
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-3">
          {/* Rate limit status pill */}
          {rateLimit && (
            <div
              className={`hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono border ${
                rateLimit.remaining < 10
                  ? 'bg-rose-950/40 border-rose-800/50 text-rose-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
              title={`Rate limit: ${rateLimit.remaining} remaining of ${rateLimit.limit} total`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  rateLimit.remaining < 10 ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
                }`}
              />
              <span>
                API Limit: <strong className="text-white">{rateLimit.remaining}</strong>/{rateLimit.limit}
              </span>
            </div>
          )}

          {/* GitHub Token Button */}
          <button
            onClick={onOpenTokenModal}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              hasToken
                ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {hasToken ? (
              <>
                {tokenUser?.avatarUrl ? (
                  <img
                    src={tokenUser.avatarUrl}
                    alt={tokenUser.login}
                    className="w-4 h-4 rounded-full ring-1 ring-emerald-400"
                  />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                )}
                <span>Token Connected</span>
              </>
            ) : (
              <>
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>Connect GitHub Token</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
