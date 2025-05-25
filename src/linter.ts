import * as path from 'path'
import { execa } from 'execa'
import * as vscode from 'vscode'
import { ensureConfigFile, findConfigFile, getConfig } from './config'
import { isValidLanguage } from './languages'

interface LintResult {
  file: string
  line: number
  column: number
  level: 'error' | 'warning' | 'info'
  message: string
}

export class YamlLinter {
  private diagnosticCollection: vscode.DiagnosticCollection
  private readonly severityMap = new Map([
    ['error', vscode.DiagnosticSeverity.Error],
    ['warning', vscode.DiagnosticSeverity.Warning],
    ['info', vscode.DiagnosticSeverity.Information],
  ])

  constructor(diagnosticCollection: vscode.DiagnosticCollection) {
    this.diagnosticCollection = diagnosticCollection
  }

  public async lintDocument(document: vscode.TextDocument): Promise<void> {
    if (!(await this.shouldLintDocument(document))) {
      return
    }

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
    if (!workspaceFolder) {
      return
    }

    try {
      const output = await this.runYamllint(document, workspaceFolder)
      this.processLintOutput(document, output)
    } catch (error: unknown) {
      this.handleLintError(error, document)
    }
  }

  private async shouldLintDocument(document: vscode.TextDocument): Promise<boolean> {
    const isUnSaved = document.isUntitled
    const isYaml = isValidLanguage(document.languageId)

    if (isUnSaved || !isYaml) {
      return false
    }

    return ensureConfigFile(document, false)
  }

  private async runYamllint(
    document: vscode.TextDocument,
    workspaceFolder: vscode.WorkspaceFolder
  ): Promise<string> {
    const config = getConfig()
    const configFile = await findConfigFile(workspaceFolder)

    const args = ['--format', 'parsable']
    if (configFile) {
      args.push('-c', configFile)
    }
    args.push(document.uri.fsPath)

    const { stdout } = await execa(config.yamllintPath, args)
    return stdout
  }

  private handleLintError(error: unknown, document: vscode.TextDocument): void {
    if (!(error instanceof Error)) {
      return
    }

    let errorMessage = 'YAML linting failed. Check the Problems panel for details.'
    if ('stderr' in error && error.stderr) {
      errorMessage += `\n${error.stderr}`
    }

    if (error.message.includes('yamllint')) {
      const output = error.message.split('\n').slice(1).join('\n')
      this.processLintOutput(document, output)
    } else {
      vscode.window.showErrorMessage(errorMessage)
      this.diagnosticCollection.delete(document.uri)
    }
  }

  private processLintOutput(document: vscode.TextDocument, output: string): void {
    const diagnostics = this.parseLintOutput(document, output)
    this.diagnosticCollection.set(document.uri, diagnostics)
  }

  private parseLintOutput(document: vscode.TextDocument, output: string): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = []
    const lines = output.split('\n')
    const regex = /^(.*?):(\d+):(\d+): \[(error|warning|info)\] (.*)$/

    for (const line of lines) {
      if (!line.trim()) continue

      const result = this.parseLintLine(line, regex, document)
      if (result) {
        diagnostics.push(this.createDiagnostic(result))
      }
    }

    return diagnostics
  }

  private parseLintLine(
    line: string,
    regex: RegExp,
    document: vscode.TextDocument
  ): LintResult | null {
    const match = regex.exec(line)
    if (!match) {
      console.error(`Failed to parse yamllint output line: ${line}`)
      return null
    }

    const [_, file, lineNum, col, level, message] = match

    // Normalize both paths before comparison
    if (path.resolve(file) !== path.resolve(document.uri.fsPath)) {
      return null
    }

    const lineIndex = parseInt(lineNum, 10) - 1
    const colIndex = parseInt(col, 10) - 1

    if (Number.isNaN(lineIndex) || Number.isNaN(colIndex)) {
      console.error(`Invalid line or column number in yamllint output line: ${line}`)
      return null
    }

    return {
      file,
      line: lineIndex,
      column: colIndex,
      level: level as 'error' | 'warning' | 'info',
      message,
    }
  }

  private createDiagnostic(result: LintResult): vscode.Diagnostic {
    const range = new vscode.Range(result.line, result.column, result.line, result.column + 1)
    const severity = this.getDiagnosticSeverity(result.level)

    const diagnostic = new vscode.Diagnostic(range, result.message, severity)
    diagnostic.source = 'yamllint'

    const { rule, urlPath } = this.extractRuleName(result.message)

    diagnostic.code = {
      value: rule || result.message,
      target: urlPath
        ? vscode.Uri.parse(
            `https://yamllint.readthedocs.io/en/stable/rules.html#module-yamllint.rules.${urlPath}`
          )
        : vscode.Uri.parse('https://yamllint.readthedocs.io/en/stable/rules.html'),
    }

    return diagnostic
  }

  private extractRuleName(message: string): { rule: string; urlPath: string } {
    const match = message.match(/\(([^)]+)\)$/)
    if (match) {
      const rule = match[1]
      const urlPath = rule.toLowerCase().replace(/-/g, '_')
      return { rule, urlPath }
    }
    return { rule: '', urlPath: '' }
  }

  private getDiagnosticSeverity(level: 'error' | 'warning' | 'info'): vscode.DiagnosticSeverity {
    return this.severityMap.get(level) ?? vscode.DiagnosticSeverity.Warning
  }

  public dispose(): void {
    this.diagnosticCollection.dispose()
  }
}
