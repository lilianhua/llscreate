import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { existsSync } from 'node:fs';

/**
 * 解析本包的根目录。
 *
 * 生产模式：tsup 把所有代码 bundle 到 dist/index.js，本文件位于 dist/，包根是上一级。
 * 开发模式（tsx）：本文件位于 src/utils/，包根是上两级。
 *
 * 通过探测 templates/ 目录是否存在来区分两种模式，更稳健。
 */
export function packageRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const prodRoot = path.resolve(here, '..');
  if (existsSync(path.join(prodRoot, 'templates'))) return prodRoot;
  return path.resolve(here, '..', '..');
}

export function builtinTemplatesDir(): string {
  return path.join(packageRoot(), 'templates');
}
