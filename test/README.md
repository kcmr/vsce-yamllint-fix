# Test Files for YamlLint Fix Extension

This directory contains test files to verify the functionality of the YamlLint Fix extension.

## Test Files

### valid.yaml
A properly formatted YAML file that should pass all linting checks. Use this to verify that the extension correctly identifies valid YAML files.

### invalid.yaml
A YAML file with intentional formatting issues that should trigger various linting warnings and errors:
- Inconsistent indentation
- Mixed quote styles
- Line length exceeding limits
- Incorrect list formatting

### .yamllint
A custom configuration file for yamllint that:
- Disables line length warnings
- Configures allowed truthy values
- Sets indentation rules
- Disables document start checks
- Enables trailing spaces checks

## How to Test

1. Open this directory in VS Code
2. Install the required tools if not already installed:
   ```bash
   pip install yamllint yamlfix
   ```
3. Install the extension
4. Open `invalid.yaml` and try the following:
   - Save the file to trigger automatic linting and see errors appear automatically in the Problems panel and inline in the editor.
   - Use the command palette to run "Fix file"
   - Use the command palette to run "Fix all files in workspace"
   - Optionally, enable the "fix on save" feature by setting `yamlLintFix.autoFixOnSave` to `true` in your VS Code settings.

## Expected Results

- `valid.yaml` should show no linting errors
- `invalid.yaml` should show multiple linting errors that appear automatically without needing to run any linting commands manually, and can be fixed using the extension's fix commands
- After running the fix commands, the files should be properly formatted according to the rules in `.yamllint`

## Debugging the Extension

You can test the extension manually by opening this project in VS Code and launching the debug mode (F5). This will open a new VS Code window with the extension loaded, where you can perform manual tests on the example files.
