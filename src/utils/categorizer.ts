import { CategoryDefinition, CategoryId, GitHubCommit, ParsedCommit } from '../types';

export const CATEGORIES: CategoryDefinition[] = [
  {
    id: 'features',
    name: 'Features',
    emoji: '✨',
    color: '#10b981', // emerald-500
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    badgeText: '#059669',
    badgeBorder: 'rgba(16, 185, 129, 0.3)',
    keywords: ['feat', 'feature', 'add', 'added', 'adding', 'support', 'introduce', 'implement', 'new', 'create'],
  },
  {
    id: 'bugfixes',
    name: 'Bugfixes',
    emoji: '🐛',
    color: '#ef4444', // red-500
    badgeBg: 'rgba(239, 68, 68, 0.12)',
    badgeText: '#dc2626',
    badgeBorder: 'rgba(239, 68, 68, 0.3)',
    keywords: ['fix', 'bug', 'bugfix', 'hotfix', 'patch', 'resolve', 'resolved', 'close', 'closed', 'crash', 'error', 'issue', 'repair'],
  },
  {
    id: 'improvements',
    name: 'Improvements',
    emoji: '⚡',
    color: '#3b82f6', // blue-500
    badgeBg: 'rgba(59, 130, 246, 0.12)',
    badgeText: '#2563eb',
    badgeBorder: 'rgba(59, 130, 246, 0.3)',
    keywords: ['perf', 'performance', 'refactor', 'improve', 'improved', 'enhancement', 'enhance', 'speed', 'optimize', 'optimized', 'rework', 'upgrade', 'update', 'modernize'],
  },
  {
    id: 'maintenance',
    name: 'Maintenance',
    emoji: '🛠',
    color: '#8b5cf6', // purple-500
    badgeBg: 'rgba(139, 92, 246, 0.12)',
    badgeText: '#7c3aed',
    badgeBorder: 'rgba(139, 92, 246, 0.3)',
    keywords: ['chore', 'ci', 'build', 'test', 'tests', 'deps', 'dependency', 'dependencies', 'bump', 'docker', 'workflow', 'lint', 'cleanup'],
  },
  {
    id: 'docs',
    name: 'Documentation',
    emoji: '📝',
    color: '#f59e0b', // amber-500
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    badgeText: '#d97706',
    badgeBorder: 'rgba(245, 158, 11, 0.3)',
    keywords: ['docs', 'doc', 'readme', 'documentation', 'guide', 'tutorial', 'comment', 'typo', 'license'],
  },
  {
    id: 'other',
    name: 'Other',
    emoji: '📦',
    color: '#6b7280', // gray-500
    badgeBg: 'rgba(107, 114, 128, 0.12)',
    badgeText: '#4b5563',
    badgeBorder: 'rgba(107, 114, 128, 0.3)',
    keywords: [],
  },
];

/**
 * Categorizes a commit message into one of our predefined categories.
 */
export function categorizeCommitMessage(message: string): CategoryId {
  const firstLine = message.split('\n')[0].trim().toLowerCase();

  // 1. Check Conventional Commits prefix (e.g. `feat:`, `feat(ui):`, `fix!:`)
  const conventionalMatch = firstLine.match(/^([a-z]+)(\([^)]+\))?(!)?:\s*(.+)$/i);
  if (conventionalMatch) {
    const type = conventionalMatch[1].toLowerCase();
    if (['feat', 'feature'].includes(type)) return 'features';
    if (['fix', 'bugfix', 'hotfix'].includes(type)) return 'bugfixes';
    if (['perf', 'refactor', 'improve', 'style'].includes(type)) return 'improvements';
    if (['docs', 'doc'].includes(type)) return 'docs';
    if (['chore', 'ci', 'build', 'test', 'deps', 'revert'].includes(type)) return 'maintenance';
  }

  // 2. Check Merge PR titles like "Merge pull request #123 from user/fix-button"
  if (firstLine.startsWith('merge pull request') || firstLine.startsWith('merge branch')) {
    if (firstLine.includes('fix') || firstLine.includes('bug')) return 'bugfixes';
    if (firstLine.includes('feat')) return 'features';
    if (firstLine.includes('perf') || firstLine.includes('refactor')) return 'improvements';
    return 'maintenance';
  }

  // 3. Keyword heuristic matching on the first line
  for (const cat of CATEGORIES) {
    if (cat.id === 'other') continue;
    for (const kw of cat.keywords) {
      const regex = new RegExp(`(^|\\b|\\W)${kw}(\\b|\\W)`, 'i');
      if (regex.test(firstLine)) {
        return cat.id;
      }
    }
  }

  return 'other';
}

/**
 * Cleans the commit message for customer-facing display.
 * Strips conventional commit noise and capitalizes the first letter.
 */
export function cleanCommitTitle(rawMessage: string): { title: string; prNumber?: string } {
  const firstLine = rawMessage.split('\n')[0].trim();

  // Extract PR Number e.g. (#123) or PR #123
  let prNumber: string | undefined;
  const prMatch = firstLine.match(/\(?#([0-9]+)\)?/);
  if (prMatch) {
    prNumber = prMatch[1];
  }

  // Remove conventional commit prefix: `feat(scope): title` or `fix: title`
  let cleaned = firstLine.replace(/^([a-zA-Z]+)(\([^)]+\))?(!)?:\s*/, '');

  // Remove trailing PR suffix like "(#123)" to avoid redundancy if linkified
  cleaned = cleaned.replace(/\s*\(#([0-9]+)\)\s*$/, '');

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return { title: cleaned || firstLine, prNumber };
}

/**
 * Parses an array of GitHub commits into our typed application state.
 */
export function parseGitHubCommits(commits: GitHubCommit[], repoOwner: string, repoName: string): ParsedCommit[] {
  return commits.map((gh) => {
    const rawMessage = gh.commit.message;
    const category = categorizeCommitMessage(rawMessage);
    const { title, prNumber } = cleanCommitTitle(rawMessage);

    const prUrl = prNumber ? `https://github.com/${repoOwner}/${repoName}/pull/${prNumber}` : undefined;

    return {
      sha: gh.sha,
      shortSha: gh.sha.substring(0, 7),
      rawMessage,
      cleanTitle: title,
      authorName: gh.commit.author.name || 'Anonymous',
      authorLogin: gh.author?.login,
      authorAvatar: gh.author?.avatar_url,
      date: gh.commit.author.date,
      htmlUrl: gh.html_url,
      category,
      prNumber,
      prUrl,
      isIncluded: category !== 'maintenance', // Default exclude internal chore from public release unless user toggles
    };
  });
}
