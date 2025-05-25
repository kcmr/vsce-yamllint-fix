import * as vscode from 'vscode'
import { ensureConfigFile, ensureConfigFileForWorkspace, getConfig } from './config'
import { YamlFixer } from './fixer'
import { isValidLanguage } from './languages'
import { YamlLinter } from './linter'

export function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('yaml')
  const linter = new YamlLinter(diagnosticCollection)
  const fixer = new YamlFixer()

  const fixCommand = vscode.commands.registerCommand('yamlLintFix.fixFile', async () => {
    const editor = vscode.window.activeTextEditor
    if (editor) {
      if (!(await ensureConfigFile(editor.document))) {
        return
      }
      const success = await fixer.fixDocument(editor.document)
      if (success) {
        await editor.document.save()
        await linter.lintDocument(editor.document)
      }
    }
  })

  const fixWorkspaceCommand = vscode.commands.registerCommand(
    'yamlLintFix.fixWorkspace',
    async () => {
      if (!(await ensureConfigFileForWorkspace())) {
        return
      }
      await fixer.fixWorkspace()
    }
  )

  context.subscriptions.push(fixCommand, fixWorkspaceCommand, diagnosticCollection)

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      const config = getConfig()
      if (config.autoFixOnSave) {
        if (!(await ensureConfigFile(document))) {
          return
        }
        const success = await fixer.fixDocument(document)
        if (success) {
          await document.save()
        }
      }
    })
  )

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(async (event) => {
      if (isValidLanguage(event.document.languageId)) {
        if (!(await ensureConfigFile(event.document, false))) {
          return
        }
        await linter.lintDocument(event.document)
      }
    })
  )

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('yamlLintFix')) {
        for (const editor of vscode.window.visibleTextEditors) {
          if (isValidLanguage(editor.document.languageId)) {
            linter.lintDocument(editor.document).catch((error) => {
              console.error('Error linting document:', error)
            })
          }
        }
      }
    })
  )

  // Initial lint of open YAML documents to show problems in the panel
  lintOpenYamlDocuments(linter)

  vscode.window.setStatusBarMessage('YamlLint Fix extension activated', 3000)
}

function lintOpenYamlDocuments(linter: YamlLinter) {
  for (const editor of vscode.window.visibleTextEditors) {
    if (isValidLanguage(editor.document.languageId)) {
      linter.lintDocument(editor.document).catch((error) => {
        console.error('Error linting document:', error)
      })
    }
  }
}

export function deactivate() {
  console.log('YamlLint Fix extension is now deactivated')
}
