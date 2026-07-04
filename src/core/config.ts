import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export interface TemplateSource {
  alias: string;
  url: string;
  addedAt: string;
}

export interface LlscreateConfig {
  author?: string;
  email?: string;
  license?: string;
  packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun';
  sources: TemplateSource[];
}

const DEFAULT_CONFIG: LlscreateConfig = {
  sources: [],
};

function configDir(): string {
  const envDir = process.env.LLSCREATE_CONFIG_DIR;
  if (envDir) return envDir;
  const home = os.homedir();
  return path.join(home, '.llscreate');
}

export function configFilePath(): string {
  return path.join(configDir(), 'config.json');
}

function cacheDir(): string {
  return path.join(configDir(), 'cache');
}

export async function ensureConfigDir(): Promise<void> {
  const dir = configDir();
  if (!existsSync(dir)) {
    await fs.mkdir(dir, { recursive: true });
  }
  const cache = cacheDir();
  if (!existsSync(cache)) {
    await fs.mkdir(cache, { recursive: true });
  }
}

export async function loadConfig(): Promise<LlscreateConfig> {
  const file = configFilePath();
  if (!existsSync(file)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = await fs.readFile(file, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<LlscreateConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      sources: parsed.sources ?? [],
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveConfig(config: LlscreateConfig): Promise<void> {
  await ensureConfigDir();
  const file = configFilePath();
  await fs.writeFile(file, JSON.stringify(config, null, 2), 'utf-8');
}

export async function getCacheDirFor(alias: string): Promise<string> {
  await ensureConfigDir();
  return path.join(cacheDir(), alias);
}

export async function addSource(alias: string, url: string): Promise<LlscreateConfig> {
  const config = await loadConfig();
  const filtered = config.sources.filter((s) => s.alias !== alias);
  filtered.push({ alias, url, addedAt: new Date().toISOString() });
  const next = { ...config, sources: filtered };
  await saveConfig(next);
  return next;
}

export async function removeSource(
  alias: string,
): Promise<{ config: LlscreateConfig; removed: boolean }> {
  const config = await loadConfig();
  const before = config.sources.length;
  const filtered = config.sources.filter((s) => s.alias !== alias);
  const next = { ...config, sources: filtered };
  await saveConfig(next);
  return { config: next, removed: filtered.length < before };
}
