import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { builtinTemplatesDir } from '../utils/paths.js';
import { getCacheDirFor, loadConfig } from './config.js';
import type { TemplateConfig, TemplateEntry } from './types.js';

async function loadTemplate(dir: string, source: string): Promise<TemplateEntry | null> {
  const configPath = path.join(dir, 'llscreate.template.json');
  if (!existsSync(configPath)) return null;

  let config: TemplateConfig;
  try {
    const raw = await fs.readFile(configPath, 'utf-8');
    config = JSON.parse(raw) as TemplateConfig;
  } catch {
    return null;
  }

  if (!config.name || !config.description) return null;

  return {
    id: source === 'builtin' ? config.name : `${source}/${config.name}`,
    name: config.name,
    description: config.description,
    category: config.category,
    tags: config.tags,
    dir,
    source,
    config,
  };
}

export async function listBuiltinTemplates(): Promise<TemplateEntry[]> {
  const root = builtinTemplatesDir();
  if (!existsSync(root)) return [];

  const entries = await fs.readdir(root, { withFileTypes: true });
  const templates: TemplateEntry[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(root, entry.name);
    const t = await loadTemplate(dir, 'builtin');
    if (t) templates.push(t);
  }

  return templates;
}

export async function listRemoteTemplates(): Promise<TemplateEntry[]> {
  const config = await loadConfig();
  const result: TemplateEntry[] = [];
  for (const source of config.sources) {
    const cacheDir = await getCacheDirFor(source.alias);
    if (!existsSync(cacheDir)) continue;
    let entries: import('node:fs').Dirent[];
    try {
      entries = await fs.readdir(cacheDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const t = await loadTemplate(path.join(cacheDir, entry.name), source.alias);
      if (t) result.push(t);
    }
  }
  return result;
}

export async function listAllTemplates(): Promise<TemplateEntry[]> {
  const [builtin, remote] = await Promise.all([listBuiltinTemplates(), listRemoteTemplates()]);
  return [...builtin, ...remote];
}

export async function findTemplate(id: string): Promise<TemplateEntry | null> {
  const all = await listAllTemplates();
  if (!id.includes('/')) {
    return all.find((t) => t.id === id || t.name === id) ?? null;
  }
  return all.find((t) => t.id === id) ?? null;
}
