import * as vscode from 'vscode'
import { getConfig } from './config'
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
      await fixer.fixWorkspace()
    }
  )

  context.subscriptions.push(fixCommand, fixWorkspaceCommand, diagnosticCollection)

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      const config = getConfig()
      if (config.autoFixOnSave) {
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
        await linter.lintDocument(event.document)
      }
    })
  )

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration('yamlLintFix')) {
        for (const editor of vscode.window.visibleTextEditors) {
          if (isValidLanguage(editor.document.languageId)) {
            linter.lintDocument(editor.document)
          }
        }
      }
    })
  )

  // Initial lint of open YAML documents
  for (const editor of vscode.window.visibleTextEditors) {
    if (isValidLanguage(editor.document.languageId)) {
      linter.lintDocument(editor.document)
    }
  }

  vscode.window.setStatusBarMessage('YamlLint Fix extension activated', 3000)
}

export function deactivate() {
  console.log('YamlLint Fix extension is now deactivated')
}
