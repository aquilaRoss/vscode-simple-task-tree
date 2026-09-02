# Contributor rules

- Scope: this extension reads tasks from `.vscode/tasks.json` only. Do not add
  detection of npm scripts, shell scripts, Makefiles, or any other task
  source. If VS Code's `tasks.fetchTasks()` would surface it, it does not
  belong in the tree.
- Keep dependencies minimal. Before adding a package, ask whether the same
  result is reasonably achievable with the VS Code API or a few lines of
  code.
- No local build/test setup is maintained in this repo. All builds, lint, and
  tests run via GitHub Actions (`.github/workflows`). Push to a branch or run
  the `Build` workflow manually to get a `.vsix`.
- TypeScript, strict mode. Match the existing code style (tabs, single
  quotes).
- Commit messages: short, one line.
- No em-dashes, no emoji, in code, comments, or commit messages.
