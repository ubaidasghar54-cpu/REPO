export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer?: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
}

export type CategoryId = 'features' | 'bugfixes' | 'improvements' | 'maintenance' | 'docs' | 'other';

export interface CategoryDefinition {
  id: CategoryId;
  name: string;
  emoji: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  keywords: string[];
}

export interface ParsedCommit {
  sha: string;
  shortSha: string;
  rawMessage: string;
  cleanTitle: string;
  description?: string;
  authorName: string;
  authorLogin?: string;
  authorAvatar?: string;
  date: string;
  htmlUrl: string;
  category: CategoryId;
  prNumber?: string;
  prUrl?: string;
  isIncluded: boolean;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetDate?: Date;
}

export interface ChangelogConfig {
  repoOwner: string;
  repoName: string;
  dateRange: '7d' | '14d' | '30d' | 'custom';
  sinceDate: string;
  untilDate: string;
  branch: string;
  includeAuthor: boolean;
  includeCommitHash: boolean;
  includePrLinks: boolean;
  emailSubject: string;
  emailPreheader: string;
  executiveSummary: string;
}
