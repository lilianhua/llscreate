import { addSource, loadConfig, removeSource } from '../core/config.js';
import { colors, log, spinner } from '../core/logger.js';
import { fetchSource, removeSourceCache } from '../core/sources.js';

export interface SourcesAddArgs {
  alias: string;
  url: string;
}

export interface SourcesRemoveArgs {
  alias: string;
}

export interface SourcesUpdateArgs {
  alias?: string;
}

export async function sourcesAddCommand(args: SourcesAddArgs): Promise<void> {
  const spin = spinner(`正在拉取 ${colors.cyan(args.alias)} ← ${args.url} ...`);
  try {
    await fetchSource(args.alias, args.url);
  } catch (err) {
    spin.fail('拉取失败');
    log.error(
      `无法拉取远程模板仓库：${args.url}`,
      process.env.LLSCREATE_DEBUG ? err : (err as Error)?.message,
    );
    process.exit(1);
  }
  spin.succeed(`已拉取 ${colors.cyan(args.alias)}`);

  await addSource(args.alias, args.url);
  log.success(`已注册 source：${colors.cyan(args.alias)}`);
  log.raw(colors.dim(`  现在可以使用：llscreate ${args.alias}/<template>`));
}

export async function sourcesRemoveCommand(args: SourcesRemoveArgs): Promise<void> {
  const config = await loadConfig();
  const exists = config.sources.some((s) => s.alias === args.alias);
  if (!exists) {
    log.warn(`没有名为 ${args.alias} 的 source`);
    process.exit(1);
  }

  await removeSourceCache(args.alias);
  const { removed } = await removeSource(args.alias);
  if (removed) {
    log.success(`已注销 source：${colors.cyan(args.alias)}`);
  } else {
    log.warn(`注销 ${args.alias} 时出现异常`);
  }
}

export async function sourcesListCommand(): Promise<void> {
  const config = await loadConfig();
  if (config.sources.length === 0) {
    log.info('当前没有注册任何远程模板仓库');
    log.raw(colors.dim('  添加：llscreate source add <alias> <url>'));
    return;
  }
  log.raw(colors.bold(colors.green('已注册的远程模板仓库：')));
  for (const s of config.sources) {
    log.raw(`  ${colors.cyan(s.alias.padEnd(20))} ${s.url}`);
    log.raw(colors.dim(`${' '.repeat(22)}added: ${s.addedAt}`));
  }
}

export async function sourcesUpdateCommand(args: SourcesUpdateArgs): Promise<void> {
  const config = await loadConfig();
  const targets = args.alias
    ? config.sources.filter((s) => s.alias === args.alias)
    : config.sources;

  if (args.alias && targets.length === 0) {
    log.warn(`没有名为 ${args.alias} 的 source`);
    process.exit(1);
  }
  if (targets.length === 0) {
    log.info('当前没有注册任何远程模板仓库');
    return;
  }

  for (const s of targets) {
    const spin = spinner(`正在刷新 ${colors.cyan(s.alias)} ← ${s.url} ...`);
    try {
      await fetchSource(s.alias, s.url);
      spin.succeed(`已刷新 ${colors.cyan(s.alias)}`);
    } catch (err) {
      spin.fail(`刷新 ${s.alias} 失败`);
      log.error(
        `无法拉取：${s.url}`,
        process.env.LLSCREATE_DEBUG ? err : (err as Error)?.message,
      );
    }
  }
}
