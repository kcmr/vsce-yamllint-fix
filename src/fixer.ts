import { execa } from 'execa'
import * as vscode from 'vscode'
import { findConfigFile, getConfig } from './config'
import { isValidLanguage } from './languages'

interface FixResult {
  success: boolean
  error?: string
}

export class YamlFixer {
  public async fixDocument(document: vscode.TextDocument): Promise<boolean> {
    if (!this.shouldFixDocument(document)) {
      return false
    }

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
    if (!workspaceFolder) {
      return false
    }

    try {
      const result = await this.runYamlfix(document, workspaceFolder)
      return this.handleFixResult(document, result)
    } catch (error: unknown) {
      return this.handleFixError(document, error)
    }
  }

  private shouldFixDocument(document: vscode.TextDocument): boolean {
    const isUnSaved = document.isUntitled
    const isYaml = isValidLanguage(document.languageId)

    return !isUnSaved && isYaml
  }

  private async runYamlfix(
    document: vscode.TextDocument,
    workspaceFolder: vscode.WorkspaceFolder
  ): Promise<FixResult> {
    const config = getConfig()
    const configFile = await findConfigFile(workspaceFolder)

    const args = []
    if (configFile) {
      args.push('--config-file', configFile)
    }
    args.push(document.uri.fsPath)

    // Set YAMLFIX_WHITELINES to '1' to preserve blank lines in the YAML file.
    // This is an opinionated default to preserve the original format of the YAML files as much as possible.
    // See: https://lyz-code.github.io/yamlfix/#whitelines-adjusting
    const env = {
      ...process.env,
      YAMLFIX_WHITELINES: '1',
    }

    const result = await execa(config.yamlfixPath, args, {
      reject: false,
      env,
    })
    return {
      success: result.exitCode === 0,
      error: result.stderr,
    }
  }

  private handleFixResult(document: vscode.TextDocument, result: FixResult): boolean {
    if (result.success) {
      return true
    }

    this.showError(document, result.error || 'Unknown error')
    return false
  }

  private handleFixError(document: vscode.TextDocument, error: unknown): boolean {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    this.showError(document, errorMessage)
    return false
  }

  private showError(document: vscode.TextDocument, errorMessage: string): void {
    vscode.window.showErrorMessage(`YamlLint fixing failed: ${errorMessage}`)
  }

  public async fixWorkspace(): Promise<void> {
    const yamlFiles = await this.findYamlFiles()
    await this.fixAllFiles(yamlFiles)
    this.showCompletionMessage()
  }

  private async findYamlFiles(): Promise<vscode.Uri[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders) {
      return []
    }

    const yamlFiles = await vscode.workspace.findFiles('**/*.{yaml,yml}')
    const yamlFilePaths = new Set(yamlFiles.map((uri) => uri.fsPath))

    // Add open files in the editor with supported languageIds that are not already in the list
    for (const editor of vscode.window.visibleTextEditors) {
      const doc = editor.document
      if (isValidLanguage(doc.languageId) && !yamlFilePaths.has(doc.uri.fsPath)) {
        yamlFiles.push(doc.uri)
        yamlFilePaths.add(doc.uri.fsPath)
      }
    }

    return yamlFiles
  }

  private async fixAllFiles(files: vscode.Uri[]): Promise<void> {
    for (const file of files) {
      const document = await vscode.workspace.openTextDocument(file)
      await this.fixDocument(document)
    }
  }

  private showCompletionMessage(): void {
    vscode.window.showInformationMessage('YamlLint fixing completed for all files in workspace')
  }
}
