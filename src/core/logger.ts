import ora, { type Ora } from 'ora';
import colors from 'picocolors';

type Level = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LEVEL_ORDER: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

let currentLevel: Level = process.env.LLSCREATE_DEBUG ? 'debug' : 'info';

export function setLevel(level: Level): void {
  currentLevel = level;
}

function shouldLog(level: Level): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[currentLevel];
}

export const log = {
  debug(msg: string): void {
    if (shouldLog('debug')) console.error(colors.dim(msg));
  },

  info(msg: string): void {
    if (shouldLog('info')) console.log(msg);
  },

  success(msg: string): void {
    if (shouldLog('info')) console.log(colors.green('✓ ') + msg);
  },

  warn(msg: string): void {
    if (shouldLog('warn')) console.error(colors.yellow('! ') + msg);
  },

  error(msg: string, err?: unknown): void {
    if (!shouldLog('error')) return;
    console.error(colors.red('✗ ') + msg);
    if (err instanceof Error && currentLevel === 'debug') {
      console.error(colors.dim(err.stack ?? err.message));
    } else if (typeof err === 'string') {
      console.error(colors.dim(err));
    }
  },

  raw(msg: string): void {
    console.log(msg);
  },
};

export function spinner(text: string): Ora {
  return ora({ text, stream: process.stderr }).start();
}

export { colors };
