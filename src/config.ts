import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

export interface YamlLintFixConfig {
  yamllintPath: string
  yamlfixPath: string
  autoFixOnSave: boolean
  configFile: string
}

/** @see https://yamllint.readthedocs.io/en/stable/configuration.html#configuration */
const DEFAULT_YAMLLINT_CONFIG_FILE_NAMES = ['.yamllint', '.yamllint.yaml', '.yamllint.yml'] as const

export function getConfig(): YamlLintFixConfig {
  const config = vscode.workspace.getConfiguration('yamlLintFix')
  return {
    yamllintPath: config.get('yamllintPath') || 'yamllint',
    yamlfixPath: config.get('yamlfixPath') || 'yamlfix',
    autoFixOnSave: config.get('autoFixOnSave') || false,
    configFile: config.get('configFile'),
  }
}

export async function findConfigFile(
  workspaceFolder: vscode.WorkspaceFolder
): Promise<string | undefined> {
  const config = getConfig()

  const fileNames: string[] = [...DEFAULT_YAMLLINT_CONFIG_FILE_NAMES]
  if (config.configFile !== undefined && config.configFile !== '') {
    fileNames.unshift(config.configFile)
  }

  for (const fileName of fileNames) {
    const configPath = path.join(workspaceFolder.uri.fsPath, fileName)
    try {
      await fs.promises.access(configPath)
      return configPath
    } catch {
      // The file does not exist.
    }
  }

  return undefined
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
