# Contributing to YamlLint Fix

Thank you for your interest in contributing to YamlLint Fix! To keep the project healthy and maintainable, please follow these guidelines:

## Development
- Use the Node.js version specified in the `engines` field of `package.json` or in the `.nvmrc` file.
- Install dependencies with:
  ```sh
  npm ci
  ```

## 1. Create an Issue
- Before starting any work, [create an issue](https://github.com/yourusername/yamllint-fix/issues) describing the bug or feature you want to address.
- Wait for feedback or approval before submitting a pull request.

## 2. Fork and Branch
- Fork the repository to your own GitHub account.
- Create a new branch for your fix or feature, ideally named after the issue (e.g. `fix/line-length-rule` or `feature/workspace-fix-all`).

## 3. Make Your Changes
- Make your changes in your branch.
- Ensure your code follows the existing style and passes linting/formatting checks.

## 4. Use Conventional Commits
- All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.
- Example: `fix(linter): correct rule name extraction for diagnostics`

## 5. Pull Request
- Open a pull request (PR) from your branch to the `main` branch of this repository.
- Reference the related issue in your PR description (e.g. `Closes #42`).
- Provide a clear description of your changes and any relevant context.

## 6. Review and Merge
- Your PR will be reviewed by a maintainer.
- Please respond to feedback and make any requested changes.
- Once approved, your PR will be merged.

---

Thank you for helping improve YamlLint Fix! 