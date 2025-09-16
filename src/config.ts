import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs/promises'
import * as vscode from 'vscode'

const DEFAULT_YAMLLINT_CONFIG_FILE_NAMES = ['.yamllint', '.yamllint.yaml', '.yamllint.yml'] as const

export function getConfig() {
  const config = vscode.workspace.getConfiguration('yamlLintFix')

  const yamllintPath = config.get('yamllintPath') ?? 'yamllint'
  if (typeof yamllintPath !== 'string') {
    throw new Error('The configuration setting of "yamllintPath" must be a string.')
  }

  const yamlfixPath = config.get('yamlfixPath') ?? 'yamlfix'
  if (typeof yamlfixPath !== 'string') {
    throw new Error('The configuration setting of "yamlfixPath" must be a string.')
  }

  const autoFixOnSave = config.get('autoFixOnSave') ?? 'yamlfix'
  if (typeof autoFixOnSave !== 'boolean') {
    throw new Error('The configuration setting of "autoFixOnSave" must be a boolean.')
  }

  const configFile = config.get('configFile')
  if (configFile !== undefined && typeof configFile !== 'string') {
    throw new Error('The configuration setting of "configFile" must be a string or undefined.')
  }

  return {
    yamllintPath,
    yamlfixPath,
    autoFixOnSave,
    configFile,
  }
}

/**
 * Implements the same logic that yamllint uses to find configuration files.
 * However, parent directory traversal is intentionally not implemented to
 * reduce complexity.
 *
 * @see https://yamllint.readthedocs.io/en/stable/configuration.html#configuration
 */
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
    const configPathExists = await exists(configPath)
    if (configPathExists) {
      return configPath
    }
  }

  const YAMLLINT_CONFIG_FILE = process.env.YAMLLINT_CONFIG_FILE
  if (YAMLLINT_CONFIG_FILE !== undefined && YAMLLINT_CONFIG_FILE !== '') {
    const configPath = YAMLLINT_CONFIG_FILE
    const configPathExists = await exists(configPath)
    if (configPathExists) {
      return configPath
    }
  }

  const XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME
  if (XDG_CONFIG_HOME !== undefined && XDG_CONFIG_HOME !== '') {
    const configPath = path.join(XDG_CONFIG_HOME, 'yamllint', 'config')
    const configPathExists = await exists(configPath)
    if (configPathExists) {
      return configPath
    }
  }

  const homeDir = os.homedir()
  const configPath = path.join(homeDir, '.config', 'yamllint', 'config')
  const configPathExists = await exists(configPath)
  if (configPathExists) {
    return configPath
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

/**
 * Helper function to see if the given file path exists. This will work with files, directories,
 * links, and so on.
 */
async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
