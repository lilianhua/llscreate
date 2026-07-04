export type PromptType = 'input' | 'confirm' | 'select' | 'checkbox' | 'password';

export interface Choice {
  name: string;
  value: string;
}

export interface PromptSpec {
  name: string;
  type: PromptType;
  message: string;
  default?: unknown;
  choices?: (string | Choice)[];
}

export interface TemplateHooks {
  preCopy?: string[];
  postCopy?: string[];
}

export interface TemplateConfig {
  name: string;
  description: string;
  category?: string;
  tags?: string[];
  prompts?: PromptSpec[];
  ignore?: string[];
  hooks?: TemplateHooks;
  /** 生成后打印的下一步提示。不设则默认走 `${pm} install` + `${pm} run dev`。 */
  hints?: string[];
}

export interface TemplateEntry {
  /** 模板唯一 ID：builtin 模板为 name，源模板为 alias/name */
  id: string;
  /** 模板名（不含 source 前缀） */
  name: string;
  description: string;
  category?: string;
  tags?: string[];
  /** 模板根目录（包含 template/ 子目录和 llscreate.template.json） */
  dir: string;
  /** 来源标识：'builtin' 或 source alias */
  source: string;
  config: TemplateConfig;
}
