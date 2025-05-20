import * as vscode from 'vscode';
import * as path from 'path';
import { getConfig, findConfigFile } from './config';

export class YamlLinter {
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor(diagnosticCollection: vscode.DiagnosticCollection) {
        this.diagnosticCollection = diagnosticCollection;
        console.log('this.diagnosticCollection: ', this.diagnosticCollection);
    }

    public async lintDocument(document: vscode.TextDocument): Promise<void> {
        console.log('languageId:', document.languageId);
        
        if (document.isUntitled) {
            return;
        }
        if (document.languageId !== 'yaml' && document.languageId !== 'yml') {
            return;
        }

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) {
            return;
        }

        const config = getConfig();
        const configFile = await findConfigFile(workspaceFolder);

        try {
            const { execa } = await import('execa');
            const args = ['--format', 'parsable'];
            if (configFile) {
                args.push('-c', configFile);
            }
            args.push(document.uri.fsPath);

            const { stdout } = await execa(config.yamllintPath, args);
            this.processLintOutput(document, stdout);
        } catch (error: any) {
            if (error instanceof Error) {
                let errorMessage = 'YAML linting failed. Check the Problems panel for details.';
                if ('stderr' in error && error.stderr) {
                    errorMessage += `\n${error.stderr}`;
                }
                if (error.message.includes('yamllint')) {
                    const output = error.message.split('\n').slice(1).join('\n');
                    this.processLintOutput(document, output);
                } else {
                    vscode.window.showErrorMessage(errorMessage);
                    this.diagnosticCollection.delete(document.uri);
                }
            }
        }
    }

    private processLintOutput(document: vscode.TextDocument, output: string): void {
        console.log('Processing lint output:', output);
        const diagnostics: vscode.Diagnostic[] = [];
        const lines = output.split('\n');
        const regex = /^(.*?):(\d+):(\d+): \[(error|warning|info)\] (.*)$/;

        for (const line of lines) {
            if (!line.trim()) continue;

            const match = regex.exec(line);
            if (!match) {
                console.error(`Failed to parse yamllint output line: ${line}`);
                continue;
            }

            const [_, file, lineNum, col, level, message] = match;

            // Normalize both paths before comparison
            if (path.resolve(file) !== path.resolve(document.uri.fsPath)) {
                continue;
            }

            const lineIndex = parseInt(lineNum, 10) - 1;
            const colIndex = parseInt(col, 10) - 1;

            if (isNaN(lineIndex) || isNaN(colIndex)) {
                console.error(`Invalid line or column number in yamllint output line: ${line}`);
                continue;
            }

            const range = new vscode.Range(
                lineIndex,
                colIndex,
                lineIndex,
                colIndex + 1
            );

            let severity: vscode.DiagnosticSeverity;
            if (level === 'error') {
                severity = vscode.DiagnosticSeverity.Error;
            } else if (level === 'warning') {
                severity = vscode.DiagnosticSeverity.Warning;
            } else if (level === 'info') {
                severity = vscode.DiagnosticSeverity.Information;
            } else {
                severity = vscode.DiagnosticSeverity.Warning;
            }

            const diagnostic = new vscode.Diagnostic(range, message, severity);
            diagnostic.source = 'yamllint';
            diagnostic.code = {
                value: message.split(' ')[0],
                target: vscode.Uri.parse('https://yamllint.readthedocs.io/en/stable/rules.html')
            };
            diagnostics.push(diagnostic);
        }

        console.log('diagnostics length: ', diagnostics.length);
        this.diagnosticCollection.set(document.uri, diagnostics);
        console.log(`Diagnostics set for ${document.uri.fsPath}`, diagnostics);

        if (diagnostics.length > 0) {
            const errorCount = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error).length;
            const warningCount = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Warning).length;
            
            let message = '';
            if (errorCount > 0) {
                message += `${errorCount} error${errorCount > 1 ? 's' : ''}`;
            }
            if (warningCount > 0) {
                if (message) message += ' and ';
                message += `${warningCount} warning${warningCount > 1 ? 's' : ''}`;
            }
            message += ' found. Check the Problems panel for details.';
            
            vscode.window.showInformationMessage(message);
        }
    }

    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
} 