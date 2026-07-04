import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { renderFilename, renderString, type RenderContext } from './render.js';

export interface GenerateOptions {
  /** 模板根目录（包含 template/ 子目录和 llscreate.template.json） */
  templateRootDir: string;
  /** 目标目录（项目根） */
  targetDir: string;
  /** 渲染上下文：projectName/author/license 等 + answers */
  variables: RenderContext;
  /** 模板自定义的 ignore 列表 */
  ignore?: string[];
}

export interface GenerateResult {
  filesWritten: number;
}

const DEFAULT_IGNORE = ['.git', 'node_modules', 'dist', '.DS_Store', 'llscreate.template.json'];

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.mdx',
  '.txt',
  '.vue',
  '.svelte',
  '.astro',
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.html',
  '.htm',
  '.yml',
  '.yaml',
  '.toml',
  '.ini',
  '.env',
  '.gitignore',
  '.npmignore',
  '.editorconfig',
  '.py',
  '.java',
  '.kt',
  '.go',
  '.rs',
  '.rb',
  '.php',
  '.sh',
  '.bash',
  '.zsh',
  '.xml',
  '.svg',
]);

const TEXT_DOTFILES = new Set([
  '.gitignore',
  '.npmignore',
  '.npmrc',
  '.editorconfig',
  '.env',
  '.env.local',
  '.env.example',
  '.babelrc',
  '.eslintrc',
  '.prettierrc',
  '.dockerignore',
]);

export async function generate(opts: GenerateOptions): Promise<GenerateResult> {
  const templateContentDir = path.join(opts.templateRootDir, 'template');
  if (!existsSync(templateContentDir)) {
    throw new Error(`模板缺少 template/ 目录：${templateContentDir}`);
  }

  const ignore = new Set([...DEFAULT_IGNORE, ...(opts.ignore ?? [])]);
  let count = 0;

  await walkAndCopy({
    src: templateContentDir,
    dest: opts.targetDir,
    ctx: opts.variables,
    ignore,
    onFile: () => {
      count++;
    },
  });

  return { filesWritten: count };
}

interface WalkArgs {
  src: string;
  dest: string;
  ctx: RenderContext;
  ignore: Set<string>;
  onFile: () => void;
}

async function walkAndCopy(args: WalkArgs): Promise<void> {
  const entries = await fs.readdir(args.src, { withFileTypes: true });
  for (const entry of entries) {
    if (args.ignore.has(entry.name)) continue;
    // 跳过 macOS AppleDouble 副产品（tar 在 HFS+/APFS 上会带）
    if (entry.name.startsWith('._')) continue;

    const srcPath = path.join(args.src, entry.name);
    const destName = renderFilename(entry.name, args.ctx);
    const destPath = path.join(args.dest, destName);

    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true });
      await walkAndCopy({ ...args, src: srcPath, dest: destPath });
    } else if (entry.isFile()) {
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      if (isTextFile(entry.name)) {
        const content = await fs.readFile(srcPath, 'utf-8');
        const rendered = renderString(content, args.ctx);
        await fs.writeFile(destPath, rendered, 'utf-8');
      } else {
        await fs.copyFile(srcPath, destPath);
      }
      args.onFile();
    }
  }
}

function isTextFile(filename: string): boolean {
  const base = path.basename(filename);
  if (TEXT_DOTFILES.has(base)) return true;
  const ext = path.extname(filename).toLowerCase();
  if (ext && TEXT_EXTENSIONS.has(ext)) return true;
  // 无扩展名且不是已知 dotfile：保守按二进制处理（如 LICENSE 这种，复制不渲染最安全）
  if (!ext) return false;
  return false;
}
