import ejs from 'ejs';

export interface RenderContext {
  [key: string]: unknown;
}

/**
 * 用 EJS 渲染字符串。渲染失败时返回原字符串（避免用户的代码里出现意外的 <% 时整个生成挂掉）。
 */
export function renderString(template: string, data: RenderContext): string {
  try {
    return ejs.render(template, data, {
      async: false,
      // 文件不存在于 EJS 文件系统里，关闭 include 文件解析
      filename: undefined,
    });
  } catch {
    return template;
  }
}

/**
 * 渲染文件名 / 目录名。
 * 约定：__var__ 会被替换为 ctx.var 的值（仅字符串/数字）。
 * 多个 placeholder 会被依次替换。未匹配的 __xxx__ 保持原样。
 */
export function renderFilename(name: string, ctx: RenderContext): string {
  let result = name;
  for (const [key, value] of Object.entries(ctx)) {
    if (value === undefined || value === null) continue;
    if (typeof value !== 'string' && typeof value !== 'number') continue;
    const placeholder = `__${key}__`;
    if (result.includes(placeholder)) {
      result = result.split(placeholder).join(String(value));
    }
  }
  // 支持嵌套：__answers.xxx__
  const answers = ctx.answers;
  if (answers && typeof answers === 'object') {
    for (const [key, value] of Object.entries(answers as Record<string, unknown>)) {
      if (typeof value !== 'string' && typeof value !== 'number') continue;
      const placeholder = `__answers.${key}__`;
      if (result.includes(placeholder)) {
        result = result.split(placeholder).join(String(value));
      }
    }
  }
  return result;
}
