import * as vscode from 'vscode'
import { findConfigFile, getConfig } from './config'

export class YamlFixer {
  public async fixDocument(document: vscode.TextDocument): Promise<boolean> {
    if (document.languageId !== 'yaml' && document.languageId !== 'yml') {
      return false
    }

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
    if (!workspaceFolder) {
      return false
    }

    const config = getConfig()
    const configFile = await findConfigFile(workspaceFolder)

    try {
      const { execa } = await import('execa')
      const args = []
      if (configFile) {
        args.push('--config-file', configFile)
      }
      args.push(document.uri.fsPath)

      const result = await execa(config.yamlfixPath, args, { reject: false })

      if (result.exitCode === 0) {
        return true
      }

      this.processError(document, result.stderr || 'Unknown error')
      return false
    } catch (error) {
      if (error instanceof Error) {
        this.processError(document, error.message)
      }
      return false
    }
  }

  private processError(document: vscode.TextDocument, errorMessage: string): void {
    vscode.window.showErrorMessage(`YAML fixing failed: ${errorMessage}`)
  }

  public async fixWorkspace(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders) {
      return
    }

    const yamlFiles = await vscode.workspace.findFiles('**/*.{yaml,yml}')

    for (const file of yamlFiles) {
      const document = await vscode.workspace.openTextDocument(file)
      await this.fixDocument(document)
    }

    vscode.window.showInformationMessage('YAML fixing completed for all files in workspace')
  }

  public dispose(): void {
    // No diagnostic collection to dispose
  }
}
