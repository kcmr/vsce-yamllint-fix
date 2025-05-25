import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

export interface YamlLintFixConfig {
  yamllintPath: string
  yamlfixPath: string
  autoFixOnSave: boolean
  configFile: string
}

export function getConfig(): YamlLintFixConfig {
  const config = vscode.workspace.getConfiguration('yamlLintFix')
  return {
    yamllintPath: config.get('yamllintPath') || 'yamllint',
    yamlfixPath: config.get('yamlfixPath') || 'yamlfix',
    autoFixOnSave: config.get('autoFixOnSave') || false,
    configFile: config.get('configFile') || '.yamllint',
  }
}

export async function findConfigFile(
  workspaceFolder: vscode.WorkspaceFolder
): Promise<string | undefined> {
  const config = getConfig()
  const configPath = path.join(workspaceFolder.uri.fsPath, config.configFile)
  try {
    await fs.promises.access(configPath)
    return configPath
  } catch {
    return undefined
  }
}

export async function ensureConfigFile(
  document: vscode.TextDocument,
  showMessage = true
): Promise<boolean> {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
  if (!workspaceFolder) {
    return false
  }

  const configFile = await findConfigFile(workspaceFolder)
  if (configFile) {
    return true
  }

  if (showMessage) {
    showConfigFileMissingMessage()
  }
  return false
}

export async function ensureConfigFileForWorkspace(): Promise<boolean> {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders) {
    return false
  }

  for (const folder of workspaceFolders) {
    const configFile = await findConfigFile(folder)
    if (!configFile) {
      showConfigFileMissingMessage()
      return false
    }
  }

  return true
}

function showConfigFileMissingMessage(): void {
  const configFile = getConfig().configFile
  vscode.window.showInformationMessage(
    `YAML linting is not available. Please create a ${configFile} configuration file in your workspace root.`
  )
}
