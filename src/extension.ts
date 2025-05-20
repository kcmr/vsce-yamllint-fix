import * as vscode from 'vscode'
import { YamlFixer } from './fixer'
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
      const config = vscode.workspace.getConfiguration('yamlLintFix')
      if (config.get('autoFixOnSave')) {
        const success = await fixer.fixDocument(document)
        if (success) {
          await document.save()
        }
      }
    })
  )

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(async (event) => {
      if (event.document.languageId === 'yaml') {
        await linter.lintDocument(event.document)
      }
    })
  )

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration('yamlLintFix')) {
        for (const editor of vscode.window.visibleTextEditors) {
          if (editor.document.languageId === 'yaml') {
            linter.lintDocument(editor.document)
          }
        }
      }
    })
  )

  // Initial lint of open YAML documents
  for (const editor of vscode.window.visibleTextEditors) {
    if (editor.document.languageId === 'yaml') {
      linter.lintDocument(editor.document)
    }
  }

  vscode.window.setStatusBarMessage('YAML Lint & Fix extension activated', 3000)
}

export function deactivate() {
  console.log('YAML Lint & Fix extension is now deactivated')
}
