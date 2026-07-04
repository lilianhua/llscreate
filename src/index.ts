import cac from 'cac';
import { createCommand } from './commands/create.js';
import { listCommand } from './commands/list.js';
import {
  sourcesAddCommand,
  sourcesListCommand,
  sourcesRemoveCommand,
  sourcesUpdateCommand,
} from './commands/sources.js';

const version = '0.1.0';

const cli = cac('llscreate');

cli
  .command('<template> [name]', '用指定模板创建项目')
  .alias('create')
  .option('-y, --yes', '跳过向导，全部使用默认值（需要显式项目名）')
  .option('--pm <manager>', '包管理器：npm | pnpm | yarn | bun')
  .allowUnknownOptions()
  .action(async (template: string, name: string | undefined, options: Record<string, unknown>) => {
    await createCommand({ template, name, ...options });
  });

cli
  .command('list', '列出所有可用模板')
  .option('-c, --category <cat>', '按分类过滤')
  .action(async (options: { category?: string }) => {
    await listCommand(options);
  });

cli
  .command('source <action> [a] [b]', '管理远程模板仓库（add/remove/list/update）')
  .action(async (action: string, a?: string, b?: string) => {
    switch (action) {
      case 'add':
        if (!a || !b) {
          console.error('✗ 用法：llscreate source add <alias> <url>');
          process.exit(1);
        }
        await sourcesAddCommand({ alias: a, url: b });
        break;
      case 'remove':
        if (!a) {
          console.error('✗ 用法：llscreate source remove <alias>');
          process.exit(1);
        }
        await sourcesRemoveCommand({ alias: a });
        break;
      case 'list':
        await sourcesListCommand();
        break;
      case 'update':
        await sourcesUpdateCommand({ alias: a });
        break;
      default:
        console.error(`✗ 未知的 source 子命令：${action}`);
        console.error('  可用：add / remove / list / update');
        process.exit(1);
    }
  });

cli.help();
cli.version(version);

try {
  cli.parse();
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`✗ ${msg}`);
  console.error('  运行 `llscreate --help` 查看用法');
  process.exit(1);
}
