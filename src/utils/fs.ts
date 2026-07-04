import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';

export async function isDirectoryEmpty(dir: string): Promise<boolean> {
  if (!existsSync(dir)) return true;
  const entries = await fs.readdir(dir);
  return entries.length === 0;
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}
