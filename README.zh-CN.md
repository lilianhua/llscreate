# llscreate

> 一个命令快速创建 Vue / React / Next.js / TypeScript 项目，并支持挂载远程模板仓库。

[English](./README.md) | [中文](./README.zh-CN.md)

## 为什么做这个

`create-vite`、`create-next-app` 这类官方脚手架都很好，但每一个只能创建自己那一种框架。`llscreate` 把常见 JS/TS 技术栈统一到**一条命令**，并且支持挂载自己的模板仓库（团队内部 starter、个人收藏、开源模板合集），通过命名空间区分。

```bash
llscreate vue my-app         # 用内置 vue 模板
llscreate myco/react app     # 用你挂的 myco 仓库里的 react 模板
```

## 安装

**npm 全局安装**（`llscreate` 这个名字目前在 npm 上还没被占用，发完之后就能这么装）：

```bash
npm install -g llscreate
# 或者不安装直接用：
npx llscreate vue my-app
```

**从源码安装**（暂时方案，或用于本地开发）：

```bash
git clone https://github.com/lilianhua/llscreate.git
cd llscreate
pnpm install
pnpm build
npm link            # 把 llscreate 软链到全局
```

## 快速开始

```bash
llscreate vue my-app
llscreate react my-app
llscreate next my-app
llscreate ts my-app
llscreate java my-app
llscreate go my-app
llscreate rust my-app

llscreate list      # 列出所有可用模板（内置 + 远程）
```

省略项目名时会进入交互式询问。

可选参数：
- `-y, --yes` —— 跳过向导，使用默认值（需要显式给项目名）
- `--pm <npm|pnpm|yarn|bun>` —— 指定生成完成后提示里推荐的包管理器

## 内置模板

| 模板 | 技术栈 |
|---|---|
| `vue` | Vue 3 + Vite + TypeScript |
| `react` | React 19 + Vite + TypeScript |
| `next` | Next.js 15（App Router）+ TypeScript |
| `ts` | TypeScript + tsx（直接可运行） |
| `java` | Maven + JDK 21 |
| `go` | Go 1.23 |
| `rust` | Rust + Cargo（Edition 2021） |

## 远程模板仓库（sources）

这是 `llscreate` 跟 `create-vite` / `create-next-app` 的差异化点：可以挂任何 git 仓库作为模板源，通过命名空间使用其中的模板。

### 注册一个 source

```bash
llscreate source add <alias> <url>
```

`<url>` 透传给 [giget](https://github.com/unjs/giget)，所以这些写法都能用：

- `github:owner/repo`
- `gitlab:owner/repo`
- `bitbucket:owner/repo`
- `https://github.com/owner/repo`
- `github:owner/repo/subdir#branch`（指定子目录 + 锁定分支/tag）

示例：

```bash
llscreate source add myco github:my-company/llscreate-templates
llscreate myco/react app    # 用 myco 仓库里的 react 模板
```

### 管理子命令

```bash
llscreate source list                # 列出已注册的远程仓库
llscreate source update [alias]      # 重新拉取；省略 alias 则刷新全部
llscreate source remove <alias>      # 注销并删除本地缓存
```

远程模板的 ID 是 `<alias>/<模板名>`。如果远程模板跟内置模板重名，**内置优先**；想用远程的同名模板必须写完整 ID `<alias>/<name>`。

## 自己造一个模板仓库

source 仓库就是一个包含若干模板的目录，结构跟本仓库的 `templates/` 子目录完全一致：

```
your-template-repo/
  vue-starter/
    llscreate.template.json
    template/
      package.json
      src/...
  react-starter/
    llscreate.template.json
    template/...
```

### `llscreate.template.json`

```json
{
  "name": "vue-starter",
  "description": "带 router + pinia 的 Vue starter",
  "category": "frontend",
  "tags": ["vue", "router", "pinia"],
  "prompts": [
    {
      "name": "authorName",
      "type": "input",
      "message": "作者名（写到 README 和 package.json）",
      "default": "Anonymous"
    }
  ],
  "ignore": []
}
```

支持的 prompt 类型：`input`、`confirm`、`select`、`checkbox`、`password`。

### 模板渲染

`template/` 子树下的所有文件用 [EJS](https://ejs.co/) 渲染。可用变量：

| 变量 | 含义 |
|---|---|
| `<%= projectName %>` | 项目名（来自位置参数或交互式输入） |
| `<%= answers.<promptName> %>` | `prompts` 里任一问题的回答 |
| `<%= author %>` | 来自 `~/.llscreate/config.json`，或 answer 兜底 |
| `<%= license %>` | 来自 `~/.llscreate/config.json`（默认 `MIT`） |
| `<%= packageManager %>` | 来自命令行参数或 `~/.llscreate/config.json` |

文件名和目录名支持 `__var__` 占位（比如 `__projectName__/index.ts`），适合把项目名嵌到路径里。

### 关于 tarball 的一个细节

giget 拉取仓库时会自动剥离 tarball 的顶层目录。这恰好匹配 GitHub / GitLab 自动生成的 tarball 结构（`<repo>-<branch>/files...`），所以直接挂公开仓库开箱即用。如果你自己提供 tarball，记得加一层包装目录。

## 配置

位于 `~/.llscreate/`：

```
~/.llscreate/
  config.json     # author / email / license / packageManager / sources[]
  cache/          # 每个 source 一个子目录
```

`config.json` 示例：

```json
{
  "author": "张三",
  "license": "MIT",
  "packageManager": "pnpm",
  "sources": [
    { "alias": "myco", "url": "github:my-company/templates", "addedAt": "..." }
  ]
}
```

环境变量：

- `LLSCREATE_CONFIG_DIR` —— 覆盖配置目录位置
- `LLSCREATE_DEBUG` —— 出错时打印完整堆栈

## 路线图

- [x] 内置模板：`vue`、`react`、`next`、`ts`、`java`、`go`、`rust`
- [x] 远程模板仓库（`source add/remove/list/update`）
- [ ] 私有仓库鉴权（`--token` 参数）
- [ ] 模板 hooks（`preCopy` / `postCopy`）

## 协议

MIT
