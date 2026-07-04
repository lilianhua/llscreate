import { downloadTemplate } from 'giget';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { getCacheDirFor } from './config.js';

/**
 * 拉取（或刷新）一个远程模板仓库到 ~/.llscreate/cache/<alias>/。
 * 已存在的缓存会被清空再下载，保证内容跟远端一致。
 */
export async function fetchSource(alias: string, url: string): Promise<string> {
  const cacheDir = await getCacheDirFor(alias);
  if (existsSync(cacheDir)) {
    await fs.rm(cacheDir, { recursive: true, force: true });
  }
  await downloadTemplate(url, { dir: cacheDir, force: true, forceClean: true });
  return cacheDir;
}

/**
 * 删除某个 source 的本地缓存。不存在时静默。
 */
export async function removeSourceCache(alias: string): Promise<void> {
  const cacheDir = await getCacheDirFor(alias);
  if (existsSync(cacheDir)) {
    await fs.rm(cacheDir, { recursive: true, force: true });
  }
}

/**
 * 返回某个 source 的缓存目录绝对路径；如果从未拉取过则返回 null。
 */
export async function getSourceCacheDir(alias: string): Promise<string | null> {
  const cacheDir = await getCacheDirFor(alias);
  return existsSync(cacheDir) ? cacheDir : null;
}
