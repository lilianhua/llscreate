# llscreate

> Fast scaffolder for Vue / React / Next.js / TypeScript projects — with remote template registry support.

[English](./README.md) | [中文](./README.zh-CN.md)

## Why

`create-vite`, `create-next-app`, etc. are great — but each only scaffolds its own framework. `llscreate` gives you a single command for the common JS/TS stacks **and** lets you register your own template collections (team-internal starters, personal favorites, open-source packs) under a namespace.

```bash
llscreate vue my-app         # built-in Vue template
llscreate myco/react app     # template from your own registry
```

## Install

**Once published to npm** (name `llscreate` is currently free):

```bash
npm install -g llscreate
# or use without installing:
npx llscreate vue my-app
```

**From source** (for now, or for development):

```bash
git clone https://github.com/lilianhua/llscreate.git
cd llscreate
pnpm install
pnpm build
npm link            # makes `llscreate` available globally
```

## Quick start

```bash
llscreate vue my-app
llscreate react my-app
llscreate next my-app
llscreate ts my-app
llscreate java my-app
llscreate go my-app
llscreate rust my-app

llscreate list      # show all available templates (built-in + remote)
```

If you omit the project name, you'll be prompted for it.

Flags:
- `-y, --yes` — skip prompts and use defaults (requires explicit project name)
- `--pm <npm|pnpm|yarn|bun>` — override the package manager mentioned in post-generation hints

## Built-in templates

| Template | Stack |
|---|---|
| `vue` | Vue 3 + Vite + TypeScript |
| `react` | React 19 + Vite + TypeScript |
| `next` | Next.js 15 (App Router) + TypeScript |
| `ts` | TypeScript + tsx (directly runnable) |
| `java` | Maven + JDK 21 |
| `go` | Go 1.23 |
| `rust` | Rust + Cargo (Edition 2021) |

## Remote template sources

This is what differentiates `llscreate` from `create-vite` / `create-next-app`: you can mount any git repository as a template source and use its templates by namespace.

### Register a source

```bash
llscreate source add <alias> <url>
```

`<url>` is passed through to [giget](https://github.com/unjs/giget), so all of these work:

- `github:owner/repo`
- `gitlab:owner/repo`
- `bitbucket:owner/repo`
- `https://github.com/owner/repo`
- `github:owner/repo/subdir#branch` (subdirectory + ref pinning)

Example:

```bash
llscreate source add myco github:my-company/llscreate-templates
llscreate myco/react app    # uses myco's react template
```

### Manage sources

```bash
llscreate source list                # show all registered sources
llscreate source update [alias]      # re-fetch; omit alias to refresh all
llscreate source remove <alias>      # unregister + delete local cache
```

Templates from a registered source are namespaced as `<alias>/<template-name>`. Built-in templates win on bare-name collisions — to use a remote template that shares a name with a built-in, write it as `<alias>/<name>`.

## Building your own template repo

A source repository is just a directory of templates, structured the same way as the `templates/` folder in this repo:

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
  "description": "My Vue starter with router + pinia",
  "category": "frontend",
  "tags": ["vue", "router", "pinia"],
  "prompts": [
    {
      "name": "authorName",
      "type": "input",
      "message": "Author name (used in README and package.json)",
      "default": "Anonymous"
    }
  ],
  "ignore": []
}
```

Supported prompt types: `input`, `confirm`, `select`, `checkbox`, `password`.

### Template rendering

Files under `template/` are rendered with [EJS](https://ejs.co/). Available variables:

| Variable | Meaning |
|---|---|
| `<%= projectName %>` | project name (from positional arg or prompt) |
| `<%= answers.<promptName> %>` | any answer from the `prompts` config |
| `<%= author %>` | from `~/.llscreate/config.json`, or answer fallback |
| `<%= license %>` | from `~/.llscreate/config.json` (default `MIT`) |
| `<%= packageManager %>` | from CLI flag or `~/.llscreate/config.json` |

File and directory names support `__var__` placeholders (e.g. `__projectName__/index.ts`), which is useful when the project name itself needs to appear in a path.

### A note on tarballs

When giget fetches a repo, it strips the top-level directory of the resulting tarball. This matches GitHub's / GitLab's auto-generated tarballs (`<repo>-<branch>/files...`), so public repos work out of the box. If you're serving a custom tarball, include a wrapper directory.

## Configuration

Stored under `~/.llscreate/`:

```
~/.llscreate/
  config.json     # author / email / license / packageManager / sources[]
  cache/          # one subdir per registered source
```

Example `config.json`:

```json
{
  "author": "Jane Doe",
  "license": "MIT",
  "packageManager": "pnpm",
  "sources": [
    { "alias": "myco", "url": "github:my-company/templates", "addedAt": "..." }
  ]
}
```

Environment variables:

- `LLSCREATE_CONFIG_DIR` — override the config directory
- `LLSCREATE_DEBUG` — print full stack traces on errors

## Roadmap

- [x] Built-in templates: `vue`, `react`, `next`, `ts`, `java`, `go`, `rust`
- [x] Remote template sources (`source add/remove/list/update`)
- [ ] Private repo auth (`--token` flag)
- [ ] Template hooks (`preCopy` / `postCopy`)

## License

MIT
