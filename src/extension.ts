import * as vscode from 'vscode'
import { YamlFixer } from './fixer'
import { YamlLinter } from './linter'

export function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('yaml')
  const linter = new YamlLinter(diagnosticCollection)
  const fixer = new YamlFixer()

  const fixCommand = vscode.commands.registerCommand('vsce-yamllint-fix.fixFile', async () => {
    console.log('Fix command triggered')
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
    'vsce-yamllint-fix.fixWorkspace',
    async () => {
      console.log('Fix workspace command triggered')
      await fixer.fixWorkspace()
    }
  )

  context.subscriptions.push(fixCommand, fixWorkspaceCommand, diagnosticCollection)

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      const config = vscode.workspace.getConfiguration('vsceYamllintFix')
      if (config.get('autoFixOnSave')) {
        console.log('Auto-fix enabled, fixing document')
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
      if (e.affectsConfiguration('vsceYamllintFix')) {
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
