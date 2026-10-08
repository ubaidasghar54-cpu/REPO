import { GitHubCommit, RateLimitInfo } from '../types';

export interface ParsedRepo {
  owner: string;
  repo: string;
  fullName: string;
}

/**
 * Extracts owner and repo name from various GitHub URL formats or shorthand strings.
 */
export function parseGitHubUrl(input: string): ParsedRepo | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Remove trailing slashes and .git
  let clean = trimmed.replace(/\.git\/?$/, '').replace(/\/+$/, '');

  // Handle full URL or protocol-less URL: https://github.com/owner/repo/...
  const urlMatch = clean.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/i);
  if (urlMatch) {
    return {
      owner: urlMatch[1],
      repo: urlMatch[2],
      fullName: `${urlMatch[1]}/${urlMatch[2]}`,
    };
  }

  // Handle shorthand: owner/repo
  const shorthandMatch = clean.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (shorthandMatch) {
    return {
      owner: shorthandMatch[1],
      repo: shorthandMatch[2],
      fullName: `${shorthandMatch[1]}/${shorthandMatch[2]}`,
    };
  }

  return null;
}

/**
 * Fetches commits from GitHub API with fallback.
 */
export async function fetchCommitsFromGitHub({
  owner,
  repo,
  since,
  until,
  token,
}: {
  owner: string;
  repo: string;
  since?: string;
  until?: string;
  token?: string;
}): Promise<{ commits: GitHubCommit[]; rateLimit: RateLimitInfo }> {
  // Strategy 1: Try server proxy first to benefit from backend connection and unified headers
  try {
    const params = new URLSearchParams();
    params.set('owner', owner);
    params.set('repo', repo);
    if (since) params.set('since', since);
    if (until) params.set('until', until);
    params.set('per_page', '100');

    const headers: Record<string, string> = {};
    if (token && token.trim()) {
      headers['x-github-token'] = token.trim();
    }

    const res = await fetch(`/api/github/commits?${params.toString()}`, { headers });
    
    const limitHeader = res.headers.get('x-ratelimit-limit');
    const remHeader = res.headers.get('x-ratelimit-remaining');
    const resetHeader = res.headers.get('x-ratelimit-reset');

    const rateLimit: RateLimitInfo = {
      limit: limitHeader ? parseInt(limitHeader, 10) : 60,
      remaining: remHeader ? parseInt(remHeader, 10) : 60,
      resetDate: resetHeader ? new Date(parseInt(resetHeader, 10) * 1000) : undefined,
    };

    if (res.ok) {
      const data = await res.json();
      return {
        commits: data.commits || [],
        rateLimit: {
          limit: data.rateLimitTotal ? parseInt(data.rateLimitTotal, 10) : rateLimit.limit,
          remaining: data.rateLimitRemaining ? parseInt(data.rateLimitRemaining, 10) : rateLimit.remaining,
          resetDate: rateLimit.resetDate,
        },
      };
    } else {
      const errorJson = await res.json().catch(() => ({}));
      // If it's a 403 rate limit, throw with explicit guidance
      if (res.status === 403 || res.status === 429) {
        throw new Error(
          errorJson.error ||
          'GitHub API rate limit exceeded. Please connect a GitHub Personal Access Token in the top-right corner to get 5,000 requests/hour.'
        );
      }
      if (res.status === 404) {
        throw new Error(
          `Repository "${owner}/${repo}" was not found or is private. If it's private, please add your GitHub token.`
        );
      }
      throw new Error(errorJson.error || `Failed to fetch commits (${res.status})`);
    }
  } catch (err: any) {
    // If backend failed due to network or something, try direct browser fetch
    if (!err.message?.includes('rate limit') && !err.message?.includes('private')) {
      return await directGitHubFetch({ owner, repo, since, until, token });
    }
    throw err;
  }
}

/**
 * Direct browser fetch to api.github.com as client-side fallback
 */
async function directGitHubFetch({
  owner,
  repo,
  since,
  until,
  token,
}: {
  owner: string;
  repo: string;
  since?: string;
  until?: string;
  token?: string;
}): Promise<{ commits: GitHubCommit[]; rateLimit: RateLimitInfo }> {
  const url = new URL(`https://api.github.com/repos/${owner}/${repo}/commits`);
  if (since) url.searchParams.set('since', since);
  if (until) url.searchParams.set('until', until);
  url.searchParams.set('per_page', '100');

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token && token.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  const res = await fetch(url.toString(), { headers });

  const limitHeader = res.headers.get('x-ratelimit-limit');
  const remHeader = res.headers.get('x-ratelimit-remaining');
  const resetHeader = res.headers.get('x-ratelimit-reset');

  const rateLimit: RateLimitInfo = {
    limit: limitHeader ? parseInt(limitHeader, 10) : 60,
    remaining: remHeader ? parseInt(remHeader, 10) : 60,
    resetDate: resetHeader ? new Date(parseInt(resetHeader, 10) * 1000) : undefined,
  };

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    if (res.status === 403) {
      throw new Error(
        'GitHub API rate limit reached (60/hr for unauthenticated calls). Connect your GitHub Token to get 5,000/hr.'
      );
    }
    if (res.status === 404) {
      throw new Error(`Repository "${owner}/${repo}" was not found. Please verify the URL or add a token for private repos.`);
    }
    throw new Error(errorJson.message || `GitHub error: ${res.statusText}`);
  }

  const commits: GitHubCommit[] = await res.json();
  return { commits, rateLimit };
}

/**
 * Validates a GitHub token and retrieves authenticated user login
 */
export async function validateGitHubToken(token: string): Promise<{ login: string; avatarUrl: string }> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) {
    throw new Error('Invalid GitHub token. Please verify the token permissions and try again.');
  }

  const user = await res.json();
  return {
    login: user.login,
    avatarUrl: user.avatar_url,
  };
}
