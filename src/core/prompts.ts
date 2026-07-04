import { checkbox, confirm, input, password, select } from '@inquirer/prompts';
import type { Choice, PromptSpec } from './types.js';

export interface RunPromptsOptions {
  /** 命令行预填值：有就不再问 */
  overrides?: Record<string, unknown>;
  /** --yes：全部用默认值（无 default 时跳过） */
  useDefaults?: boolean;
}

export async function runPrompts(
  specs: PromptSpec[],
  options: RunPromptsOptions = {},
): Promise<Record<string, unknown>> {
  const answers: Record<string, unknown> = {};
  const overrides = options.overrides ?? {};

  for (const spec of specs) {
    if (spec.name in overrides) {
      answers[spec.name] = overrides[spec.name];
      continue;
    }

    if (options.useDefaults) {
      answers[spec.name] = spec.default;
      continue;
    }

    switch (spec.type) {
      case 'input':
        answers[spec.name] = await input({
          message: spec.message,
          default: typeof spec.default === 'string' ? spec.default : undefined,
        });
        break;
      case 'confirm':
        answers[spec.name] = await confirm({
          message: spec.message,
          default: typeof spec.default === 'boolean' ? spec.default : false,
        });
        break;
      case 'select':
        answers[spec.name] = await select({
          message: spec.message,
          choices: normalizeChoices(spec.choices ?? []),
          default: typeof spec.default === 'string' ? spec.default : undefined,
        });
        break;
      case 'checkbox': {
        const picked = await checkbox({
          message: spec.message,
          choices: normalizeChoices(spec.choices ?? []),
          default: Array.isArray(spec.default) ? (spec.default as string[]) : undefined,
        });
        answers[spec.name] = picked;
        break;
      }
      case 'password':
        answers[spec.name] = await password({ message: spec.message });
        break;
    }
  }

  return answers;
}

function normalizeChoices(choices: (string | Choice)[]): Choice[] {
  return choices.map((c) => (typeof c === 'string' ? { name: c, value: c } : c));
}
