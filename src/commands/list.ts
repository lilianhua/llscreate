import { loadConfig } from '../core/config.js';
import { colors, log } from '../core/logger.js';
import { getSourceCacheDir } from '../core/sources.js';
import { listAllTemplates } from '../core/registry.js';

export interface ListArgs {
  category?: string;
}

export async function listCommand(args: ListArgs = {}): Promise<void> {
  let all = await listAllTemplates();
  if (args.category) {
    all = all.filter((t) => t.category === args.category);
  }

  const config = await loadConfig();
  const loadedSources = new Set(all.map((t) => t.source));
  const missingSources: string[] = [];
  for (const s of config.sources) {
    if (!loadedSources.has(s.alias)) {
      const cache = await getSourceCacheDir(s.alias);
      if (cache === null) missingSources.push(s.alias);
    }
  }

  if (all.length === 0 && missingSources.length === 0) {
    log.info(args.category ? `分类 [${args.category}] 下没有模板` : '当前没有可用模板');
    return;
  }

  const groups = groupBy(all, (t) => t.source);
  for (const [source, items] of groups) {
    log.raw(colors.bold(colors.green(`● ${source}`)));
    for (const t of items) {
      const name = colors.cyan(t.id.padEnd(22));
      const desc = t.description;
      log.raw(`  ${name} ${desc}`);
      if (t.tags && t.tags.length > 0) {
        log.raw(colors.dim(`${' '.repeat(24)}tags: ${t.tags.join(', ')}`));
      }
    }
    log.raw('');
  }

  for (const alias of missingSources) {
    log.raw(colors.bold(colors.yellow(`● ${alias}`)));
    log.raw(
      colors.yellow(`  cache missing — 运行：llscreate source update ${alias}`),
    );
    log.raw('');
  }
}

function groupBy<T>(arr: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of arr) {
    const k = keyFn(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k)?.push(item);
  }
  return map;
}
