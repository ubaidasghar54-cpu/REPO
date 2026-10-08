import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI SDK server-side
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Proxy GitHub commits fetch to avoid browser CORS/rate-limit quirks
app.get('/api/github/commits', async (req, res) => {
  try {
    const { owner, repo, since, until, per_page = '100', page = '1' } = req.query;
    if (!owner || !repo) {
      return res.status(400).json({ error: 'Owner and repo query parameters are required' });
    }

    const token = req.headers['x-github-token'] as string | undefined;

    const url = new URL(`https://api.github.com/repos/${owner}/${repo}/commits`);
    if (since) url.searchParams.set('since', String(since));
    if (until) url.searchParams.set('until', String(until));
    url.searchParams.set('per_page', String(per_page));
    url.searchParams.set('page', String(page));

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'GitLog-Pulse-App',
    };

    if (token && token.trim()) {
      headers.Authorization = `Bearer ${token.trim()}`;
    }

    const ghRes = await fetch(url.toString(), { headers });

    // Forward rate limit headers
    const rateLimit = ghRes.headers.get('x-ratelimit-limit');
    const rateRemaining = ghRes.headers.get('x-ratelimit-remaining');
    const rateReset = ghRes.headers.get('x-ratelimit-reset');

    if (rateLimit) res.setHeader('x-ratelimit-limit', rateLimit);
    if (rateRemaining) res.setHeader('x-ratelimit-remaining', rateRemaining);
    if (rateReset) res.setHeader('x-ratelimit-reset', rateReset);

    if (!ghRes.ok) {
      const errBody = await ghRes.text();
      let parsedMsg = errBody;
      try {
        const json = JSON.parse(errBody);
        parsedMsg = json.message || errBody;
      } catch {
        // use errBody
      }
      return res.status(ghRes.status).json({
        error: parsedMsg,
        rateLimitRemaining: rateRemaining,
      });
    }

    const commitsData = await ghRes.json();
    return res.json({
      commits: commitsData,
      rateLimitRemaining: rateRemaining,
      rateLimitTotal: rateLimit,
    });
  } catch (error: any) {
    console.error('Error fetching GitHub commits:', error);
    return res.status(500).json({ error: error.message || 'Internal server error while fetching GitHub commits' });
  }
});

// AI Changelog Polish & Executive Summary
app.post('/api/ai/polish', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API is not configured on the server. Using smart local heuristics instead.',
      });
    }

    const { repoName, dateRange, rawItems, tone = 'engaging' } = req.body;

    if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({ error: 'rawItems array is required' });
    }

    const prompt = `You are a world-class Developer Relations and Technical Product Manager.
Take the following list of git commit messages for "${repoName || 'Project'}" (covering ${dateRange || 'the last 7 days'}) and transform them into a clean, professional, publication-ready changelog and email newsletter update.

Tone requested: ${tone} (Options: executive, engaging, developer, concise).

Input commits:
${JSON.stringify(rawItems, null, 2)}

Requirements:
1. Executive Summary: 2-3 engaging sentences summarizing what the team shipped this week and the core impact.
2. Suggested Email Subject: catchy, professional subject line (e.g., "🚀 What's New in [Repo]: [Top Feature] & 5 Fixes").
3. Email Preheader: 1 punchy preview line for inbox.
4. Categorized Items: Clean up raw commit messages into customer/developer readable bullets. Remove messy git noise like "wip", "fix typo", merge commits, or duplicate chore bumps unless significant.
Categorize into:
- features: ✨ New Features & Capabilities
- bugfixes: 🐛 Bug Fixes & Stability
- improvements: ⚡ Performance & Polish
- maintenance: 🛠 Internal & Dependencies
For each item, write a crisp, active-voice summary bullet (e.g. "Added instant search with keyboard navigation shortcuts"). Mention original commit SHA or author in parenthesis if relevant.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subjectLine: { type: Type.STRING, description: 'Catchy email subject line' },
            preheader: { type: Type.STRING, description: 'Email inbox preview text' },
            executiveSummary: { type: Type.STRING, description: 'Short 2-3 sentence overview paragraph' },
            features: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Customer-facing features',
            },
            bugfixes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Bug fixes and patches',
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Enhancements and performance improvements',
            },
            maintenance: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Internal tasks or maintenance',
            },
          },
          required: ['subjectLine', 'executiveSummary', 'features', 'bugfixes', 'improvements'],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating AI changelog:', error);
    return res.status(500).json({ error: error.message || 'AI changelog generation failed' });
  }
});

// Vite or Static Serving
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
