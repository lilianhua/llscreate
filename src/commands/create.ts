import path from 'node:path';
import { confirm, input } from '@inquirer/prompts';
import { loadConfig } from '../core/config.js';
import { generate } from '../core/generator.js';
import { colors, log, spinner } from '../core/logger.js';
import { runPrompts } from '../core/prompts.js';
import { findTemplate, listAllTemplates } from '../core/registry.js';
import type { TemplateEntry } from '../core/types.js';
import { ensureDir, isDirectoryEmpty } from '../utils/fs.js';
import { isValidNpmName, isValidPathSegment } from '../utils/validate.js';

export interface CreateArgs {
  /** 位置参数：模板名（必填） */
  template: string;
  /** 位置参数：项目名（可省略，省略时走交互式） */
  name?: string;
  /** --yes / -y */
  yes?: boolean;
  /** --pm */
  pm?: 'npm' | 'pnpm' | 'yarn' | 'bun';
  /** 其他 flag 都作为 prompts 的 override */
  [key: string]: unknown;
}

const RESERVED_KEYS = new Set(['name', 'template', 'yes', 'pm', '--']);

export async function createCommand(args: CreateArgs): Promise<void> {
  const config = await loadConfig();

  // 1. 选模板
  const template = await resolveTemplate(args.template);

  // 2. 项目名
  const projectName = await resolveProjectName(args.name, args.yes === true);
  if (!projectName) return;

  if (!isValidPathSegment(projectName)) {
    log.error(`项目名包含非法字符：${projectName}`);
    process.exit(1);
  }

  // 3. 目标目录与非空检查
  const targetDir = path.resolve(process.cwd(), projectName);
  await ensureTargetDir(targetDir, projectName, args.yes === true);

  // 4. prompts（命令行多余参数作为 override）
  const overrides = extractOverrides(args);
  const answers = await runPrompts(template.config.prompts ?? [], {
    overrides,
    useDefaults: args.yes === true,
  });

  // 5. 变量上下文
  const packageManager = args.pm ?? config.packageManager ?? 'npm';
  const variables = {
    projectName,
    author: config.author ?? answers.authorName ?? 'Anonymous',
    email: config.email,
    license: config.license ?? 'MIT',
    packageManager,
    answers,
  };

  // 6. 生成
  const spin = spinner(`正在生成 ${colors.cyan(projectName)} ...`);
  try {
    await ensureDir(targetDir);
    const { filesWritten } = await generate({
      templateRootDir: template.dir,
      targetDir,
      variables,
      ignore: template.config.ignore,
    });
    spin.succeed(`生成完成：${filesWritten} 个文件`);
  } catch (err) {
    spin.fail('生成失败');
    log.error('生成模板时出错', err);
    process.exit(1);
  }

  // 7. 后续提示
  log.success(`项目 ${colors.cyan(projectName)} 已创建`);
  log.raw(colors.dim(`  位置：${targetDir}`));
  log.raw('');
  log.raw(colors.dim('  接下来：'));
  log.raw(`    cd ${projectName}`);
  const hints = template.config.hints ?? [`${packageManager} install`, `${packageManager} run dev`];
  for (const h of hints) log.raw(`    ${h}`);
}

async function resolveTemplate(templateArg: string): Promise<TemplateEntry> {
  const t = await findTemplate(templateArg);
  if (!t) {
    log.error(`找不到模板：${templateArg}`);
    const all = await listAllTemplates();
    if (all.length > 0) {
      log.raw(colors.dim(`  可用模板：${all.map((x) => x.id).join(', ')}`));
    }
    process.exit(1);
  }
  return t;
}

async function resolveProjectName(
  nameArg: string | undefined,
  yes: boolean,
): Promise<string | null> {
  if (nameArg) {
    if (!isValidNpmName(nameArg)) {
      log.error(`无效的项目名（需符合 npm 包名规范）：${nameArg}`);
      process.exit(1);
    }
    return nameArg;
  }

  if (yes) {
    log.error('--yes 模式需要显式指定项目名作为位置参数');
    process.exit(1);
  }

  const name = await input({
    message: '项目名',
    default: 'my-app',
    validate: (v) => (isValidNpmName(v) ? true : `无效的项目名：${v}`),
  });
  return name;
}

async function ensureTargetDir(
  targetDir: string,
  projectName: string,
  yes: boolean,
): Promise<void> {
  const empty = await isDirectoryEmpty(targetDir);
  if (empty) return;

  if (yes) {
    log.error(`目标目录非空：${targetDir}`);
    process.exit(1);
  }

  const cont = await confirm({
    message: `目录 ${projectName} 非空，继续会覆盖同名文件，是否继续？`,
    default: false,
  });
  if (!cont) {
    log.info('已取消');
    process.exit(0);
  }
}

function extractOverrides(args: CreateArgs): Record<string, unknown> {
  const overrides: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(args)) {
    if (RESERVED_KEYS.has(k)) continue;
    if (v === undefined) continue;
    overrides[k] = v;
  }
  return overrides;
}
