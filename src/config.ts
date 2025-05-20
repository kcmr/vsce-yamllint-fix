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
  const config = vscode.workspace.getConfiguration('vsceYamllintFix')
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
