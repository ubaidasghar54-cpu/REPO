import { CATEGORIES } from './categorizer';
import { CategoryId, ChangelogConfig, ParsedCommit } from '../types';

/**
 * Generates formatted Markdown from categorized commits and settings
 */
export function generateMarkdown({
  commits,
  config,
  executiveSummary,
}: {
  commits: ParsedCommit[];
  config: ChangelogConfig;
  executiveSummary?: string;
}): string {
  const activeCommits = commits.filter((c) => c.isIncluded);
  const repoTitle = `${config.repoOwner}/${config.repoName}`;
  const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const lines: string[] = [];

  // Title
  lines.push(`# 🚀 ${repoTitle} Changelog`);
  lines.push(`> *Weekly release notes for ${nowStr} • ${activeCommits.length} commits shipped*`);
  lines.push('');

  // Executive summary if available
  if (executiveSummary && executiveSummary.trim()) {
    lines.push('### 💡 Executive Summary');
    lines.push(executiveSummary.trim());
    lines.push('');
  }

  // Group by category
  for (const cat of CATEGORIES) {
    const catCommits = activeCommits.filter((c) => c.category === cat.id);
    if (catCommits.length === 0) continue;

    lines.push(`### ${cat.emoji} ${cat.name}`);
    lines.push('');

    for (const commit of catCommits) {
      let bullet = `- **${commit.cleanTitle}**`;

      if (commit.prNumber && config.includePrLinks && commit.prUrl) {
        bullet += ` ([#${commit.prNumber}](${commit.prUrl}))`;
      }

      if (config.includeCommitHash) {
        bullet += ` [\`${commit.shortSha}\`](${commit.htmlUrl})`;
      }

      if (config.includeAuthor) {
        const authorDisplay = commit.authorLogin ? `@${commit.authorLogin}` : commit.authorName;
        bullet += ` by ${authorDisplay}`;
      }

      lines.push(bullet);
    }

    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push(`*Generated with [GitLog Pulse](https://github.com/${repoTitle})*`);

  return lines.join('\n');
}

/**
 * Generates an email-ready HTML template with inline styles.
 * Compatible with Gmail, Apple Mail, Outlook, and web clients.
 */
export function generateEmailHtml({
  commits,
  config,
  executiveSummary,
}: {
  commits: ParsedCommit[];
  config: ChangelogConfig;
  executiveSummary?: string;
}): string {
  const activeCommits = commits.filter((c) => c.isIncluded);
  const repoTitle = `${config.repoOwner}/${config.repoName}`;
  const dateFormatted = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate unique contributors
  const contributors = Array.from(new Set(activeCommits.map((c) => c.authorLogin || c.authorName)));

  // Generate category HTML sections
  const categorySections = CATEGORIES.map((cat) => {
    const catCommits = activeCommits.filter((c) => c.category === cat.id);
    if (catCommits.length === 0) return '';

    const itemsHtml = catCommits
      .map((commit) => {
        let metaHtml = '';
        if (commit.prNumber && config.includePrLinks && commit.prUrl) {
          metaHtml += ` <a href="${commit.prUrl}" style="color: #2563eb; text-decoration: none; font-size: 13px; font-weight: 500;">#${commit.prNumber}</a>`;
        }
        if (config.includeCommitHash) {
          metaHtml += ` <a href="${commit.htmlUrl}" style="display: inline-block; background-color: #f3f4f6; color: #4b5563; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; padding: 2px 5px; border-radius: 4px; text-decoration: none; margin-left: 4px;">${commit.shortSha}</a>`;
        }
        if (config.includeAuthor) {
          metaHtml += ` <span style="color: #6b7280; font-size: 12px; margin-left: 4px;">by ${commit.authorLogin ? '@' + commit.authorLogin : commit.authorName}</span>`;
        }

        return `
          <li style="margin-bottom: 10px; font-size: 14px; line-height: 1.5; color: #1f2937;">
            <strong style="color: #111827; font-weight: 600;">${commit.cleanTitle}</strong>${metaHtml}
          </li>`;
      })
      .join('');

    return `
      <div style="margin-bottom: 24px;">
        <div style="display: flex; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
          <span style="font-size: 16px; margin-right: 8px;">${cat.emoji}</span>
          <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #111827; letter-spacing: -0.01em;">${cat.name}</h3>
          <span style="margin-left: 8px; font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 9999px; background-color: ${cat.badgeBg}; color: ${cat.badgeText};">${catCommits.length}</span>
        </div>
        <ul style="margin: 0 0 16px 0; padding-left: 20px;">
          ${itemsHtml}
        </ul>
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.emailSubject || `🚀 ${repoTitle} Changelog Update`}</title>
</head>
<body style="margin: 0; padding: 20px 10px; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Preheader preview text for email client inbox -->
  <div style="display: none; max-height: 0px; overflow: hidden;">
    ${config.emailPreheader || `Here are the latest updates and ${activeCommits.length} commits shipped in ${repoTitle} for ${dateFormatted}.`}
  </div>

  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 32px; color: #ffffff;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td>
              <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #38bdf8; margin-bottom: 12px;">
                Weekly Changelog
              </div>
              <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                ${repoTitle}
              </h1>
              <p style="margin: 0; font-size: 14px; color: #94a3b8; font-weight: 400;">
                Updates shipped for the week ending <strong style="color: #e2e8f0;">${dateFormatted}</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Quick Stats Bar -->
    <tr>
      <td style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px 32px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="font-size: 13px; color: #475569;">
              <strong style="color: #0f172a; font-weight: 700;">${activeCommits.length}</strong> Commits &bull; 
              <strong style="color: #0f172a; font-weight: 700;">${contributors.length}</strong> Contributor${contributors.length !== 1 ? 's' : ''} &bull; 
              Branch <span style="font-family: monospace; font-size: 12px; background: #e2e8f0; padding: 1px 6px; border-radius: 4px;">${config.branch || 'main'}</span>
            </td>
            <td align="right">
              <a href="https://github.com/${repoTitle}" style="font-size: 12px; color: #2563eb; text-decoration: none; font-weight: 600;">View on GitHub &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 28px 32px;">
        ${
          executiveSummary && executiveSummary.trim()
            ? `
          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 16px; margin-bottom: 28px;">
            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #1d4ed8; margin-bottom: 4px;">
              Executive Summary
            </div>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e3a8a;">
              ${executiveSummary.trim().replace(/\n/g, '<br>')}
            </p>
          </div>
          `
            : ''
        }

        ${categorySections || '<p style="color: #6b7280; font-style: italic;">No commits selected for this changelog release.</p>'}

        <!-- CTA Button -->
        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
          <a href="https://github.com/${repoTitle}/commits" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            Browse All Commits on GitHub
          </a>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 32px; text-align: center; font-size: 12px; color: #6b7280;">
        <p style="margin: 0 0 6px 0;">Generated with <strong>GitLog Pulse</strong> &bull; Automated GitHub Release Updates</p>
        <p style="margin: 0; color: #9ca3af;">You received this email because you subscribed to weekly project releases.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
