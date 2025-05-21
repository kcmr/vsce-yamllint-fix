# 🧩 YamlLint Fix Extension - Project Specs

## 🎯 Objective

Create a VS Code extension that integrates `yamllint` for linting and `yamlfix` for automatic or on-demand fixing of `.yaml`/`.yml` files and any file recognized as YAML by VS Code.

## 🧰 Key Tools

- [`yamllint`](https://yamllint.readthedocs.io/en/stable/): Static analysis tool for YAML files.
- [`yamlfix`](https://github.com/lyz-code/yamlfix): Automatic formatter for YAML files.
- [`execa`](https://github.com/sindresorhus/execa): For safe execution of external processes (imported dynamically for compatibility).
- VS Code API (`vscode`): For integration with the editor, command registration, diagnostics, etc.
- TypeScript.

## ⚙️ Current Behavior

### Configuration
- The extension automatically detects a `.yamllint` file in the project root for configuration.
- Alternatively, configuration can be set globally or per workspace via VS Code settings.
- Paths to the executables (`yamllint`, `yamlfix`) are configurable.

### Linting
- On save or via command, `yamllint` is run on the file.
- Errors and warnings are shown in the Problems panel and inline using VS Code diagnostics.
- Diagnostic links point directly to the relevant rule documentation.

### Fixing
- `yamlfix` can be run:
  - Automatically on save (if enabled in settings).
  - Manually via the command palette ("Fix file", "Fix all files in workspace").
- The extension updates the editor content if modifications are made.
- Notifications inform the user of the result.

### Workspace Fix Logic
- The command "Fix all files in workspace" now:
  - Fixes all files with `.yaml` or `.yml` extension.
  - Also includes any open file in the editor whose `languageId` is `yaml` (even if it has no extension, e.g., `.yamllint`).

## 📁 Project Structure

```
vsce-yamllint-fix/
├── src/
│   ├── extension.ts      # Main entry point
│   ├── linter.ts         # Runs yamllint
│   ├── fixer.ts          # Runs yamlfix
│   ├── config.ts         # Loads and manages configuration
│
├── test/                 # Test files and manual test instructions
├── package.json          # Extension configuration
├── tsconfig.json
├── README.md
└── specs.md
```

## 🧪 Commands

- `Fix file` — Fixes the current YAML file
- `Fix all files in workspace` — Fixes all YAML files in the workspace (including open files detected as YAML)

## 🛠️ Implementation Notes

- All imports use standard TypeScript/Node.js syntax. `execa` is imported dynamically for compatibility with both CommonJS and ESM environments.
- Diagnostic links to yamllint rules are precise, even for rules with hyphens in their names.
- The extension is robust to errors and provides clear user feedback.

