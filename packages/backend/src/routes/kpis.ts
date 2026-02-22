import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const router = Router();

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');

function countLinesInDir(dir: string, extensions: string[]): number {
  let total = 0;
  if (!fs.existsSync(dir)) return 0;
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git' || entry.name === 'build') continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        const content = fs.readFileSync(full, 'utf-8');
        total += content.split('\n').length;
      }
    }
  };
  walk(dir);
  return total;
}

function countRouteDefinitions(): number {
  const routesDir = path.join(ROOT, 'packages', 'backend', 'src', 'routes');
  if (!fs.existsSync(routesDir)) return 0;
  let count = 0;
  const routePattern = /router\.(get|post|put|patch|delete)\s*\(/gi;
  for (const file of fs.readdirSync(routesDir)) {
    if (!file.endsWith('.ts')) continue;
    const content = fs.readFileSync(path.join(routesDir, file), 'utf-8');
    const matches = content.match(routePattern);
    if (matches) count += matches.length;
  }
  const appFile = path.join(ROOT, 'packages', 'backend', 'src', 'app.ts');
  if (fs.existsSync(appFile)) {
    const appContent = fs.readFileSync(appFile, 'utf-8');
    const appMatches = appContent.match(/app\.(get|post|put|patch|delete)\s*\(/gi);
    if (appMatches) count += appMatches.length;
  }
  return count;
}

function countPages(): number {
  const appTsx = path.join(ROOT, 'packages', 'frontend', 'src', 'App.tsx');
  if (!fs.existsSync(appTsx)) return 0;
  const content = fs.readFileSync(appTsx, 'utf-8');
  const routeMatches = content.match(/<Route\s/g);
  return routeMatches ? routeMatches.length : 0;
}

function countGitCommits(): number {
  try {
    const result = execSync('git rev-list --count HEAD', { cwd: ROOT, encoding: 'utf-8', timeout: 5000 });
    return parseInt(result.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

function countSourceFiles(dir: string, extensions: string[]): number {
  let total = 0;
  if (!fs.existsSync(dir)) return 0;
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git' || entry.name === 'build') continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        total++;
      }
    }
  };
  walk(dir);
  return total;
}

function collectFileTimestamps(dir: string, extensions: string[]): number[] {
  const ts: number[] = [];
  if (!fs.existsSync(dir)) return ts;
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (['node_modules', 'dist', '.git', 'build'].includes(entry.name)) continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!extensions.some(ext => entry.name.endsWith(ext))) continue;
      try {
        const stat = fs.statSync(full);
        ts.push(stat.mtimeMs);
      } catch { /* skip */ }
    }
  };
  walk(dir);
  return ts;
}

function calcCodingHours(): { totalHours: number; sessions: { start: string; end: string; durationMin: number }[] } {
  const SESSION_GAP_MIN = 90;
  try {
    const commitLog = execSync(
      'git log --format="%aI" --all',
      { cwd: ROOT, encoding: 'utf-8', timeout: 5000 }
    ).trim();

    const commitTimestamps = commitLog
      ? commitLog.split('\n').map(l => new Date(l.trim()).getTime()).filter(t => !isNaN(t))
      : [];

    const fileTs = [
      ...collectFileTimestamps(path.join(ROOT, 'packages', 'frontend', 'src'), ['.ts', '.tsx', '.js', '.jsx', '.css']),
      ...collectFileTimestamps(path.join(ROOT, 'packages', 'backend', 'src'), ['.ts', '.js']),
      ...collectFileTimestamps(path.join(ROOT, 'packages', 'backend', 'prisma'), ['.prisma']),
    ];

    const allTimestamps = [...commitTimestamps, ...fileTs]
      .filter(t => !isNaN(t))
      .sort((a, b) => a - b);

    if (allTimestamps.length === 0) return { totalHours: 0, sessions: [] };

    const sessions: { start: number; end: number }[] = [];
    let sessionStart = allTimestamps[0];
    let sessionEnd = allTimestamps[0];

    for (let i = 1; i < allTimestamps.length; i++) {
      const gap = (allTimestamps[i] - sessionEnd) / (1000 * 60);
      if (gap <= SESSION_GAP_MIN) {
        sessionEnd = allTimestamps[i];
      } else {
        sessions.push({ start: sessionStart, end: sessionEnd });
        sessionStart = allTimestamps[i];
        sessionEnd = allTimestamps[i];
      }
    }
    sessions.push({ start: sessionStart, end: sessionEnd });

    const PRE_SESSION_MIN = 30;
    const POST_SESSION_MIN = 15;
    let totalMin = 0;
    const result = sessions.map(s => {
      const span = (s.end - s.start) / (1000 * 60);
      const dur = Math.max(45, span + PRE_SESSION_MIN + POST_SESSION_MIN);
      totalMin += dur;
      return {
        start: new Date(s.start).toISOString(),
        end: new Date(s.end).toISOString(),
        durationMin: Math.round(dur),
      };
    });

    return { totalHours: Math.round(totalMin / 60 * 10) / 10, sessions: result };
  } catch {
    return { totalHours: 0, sessions: [] };
  }
}

router.get('/', (_req: Request, res: Response) => {
  try {
    const codeExts = ['.ts', '.tsx', '.js', '.jsx', '.css', '.json', '.prisma'];
    const frontendDir = path.join(ROOT, 'packages', 'frontend', 'src');
    const backendDir = path.join(ROOT, 'packages', 'backend', 'src');
    const sharedDir = path.join(ROOT, 'packages', 'shared', 'src');

    const frontendLines = countLinesInDir(frontendDir, codeExts);
    const backendLines = countLinesInDir(backendDir, codeExts);
    const sharedLines = countLinesInDir(sharedDir, codeExts);
    const prismaLines = countLinesInDir(path.join(ROOT, 'packages', 'backend', 'prisma'), ['.prisma']);
    const totalLines = frontendLines + backendLines + sharedLines + prismaLines;

    const pages = countPages();
    const endpoints = countRouteDefinitions();
    const commits = countGitCommits();
    const sourceFiles = countSourceFiles(ROOT, ['.ts', '.tsx', '.js', '.jsx']);
    const coding = calcCodingHours();

    res.json({
      linesOfCode: totalLines,
      frontendLines,
      backendLines,
      sharedLines,
      pages,
      endpoints,
      commits,
      sourceFiles,
      codingHours: coding.totalHours,
      codingSessions: coding.sessions,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
