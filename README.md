# YamlLint Fix

A VS Code extension that integrates `yamllint` for linting and `yamlfix` for fixing YAML files.

## Features

- Automatic linting of YAML files on save, with errors shown automatically in the editor and the Problems panel
- Manual fixing of YAML files on save (optional, can be enabled in settings)
- Manual fixing of current file or all files in workspace
- Support for custom `.yamllint` configuration files
- Configurable paths for `yamllint` and `yamlfix` executables

## Requirements

- [yamllint](https://yamllint.readthedocs.io/en/stable/) installed and available in PATH
- [yamlfix](https://github.com/lyz-code/yamlfix) installed and available in PATH

## Installation

1. Install the required tools:
   ```bash
   pip install yamllint yamlfix
   ```

2. Install the extension from the VS Code marketplace or build from source:
   ```bash
   npm install
   npm run compile
   ```

## Configuration

The extension can be configured through VS Code settings:

- `yamlLintFix.yamllintPath`: Path to yamllint executable (default: "yamllint")
- `yamlLintFix.yamlfixPath`: Path to yamlfix executable (default: "yamlfix")
- `yamlLintFix.autoFixOnSave`: Automatically fix YAML files on save (default: false; can be enabled in settings)
- `yamlLintFix.configFile`: Path to yamllint configuration file (default: ".yamllint")

## Usage

### Commands

- `YamlLintFix: Fix file` - Fix the current YAML file
- `YamlLintFix: Fix all files in workspace` - Fix all YAML files in the workspace

### Configuration File

Place a `.yamllint` file in your project root to configure yamllint rules. 
A file with a different name can be specified in the extension settings.

Example:

```yaml
extends: default

rules:
  line-length: disable
  truthy:
    allowed-values: ['true', 'false', 'yes', 'no']
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the [MIT License](LICENSE).