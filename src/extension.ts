import * as vscode from 'vscode';
import { TaskTreeProvider } from './taskTreeProvider';
import { runDeclaredTask } from './runTask';
import { DeclaredTask } from './taskFile';

export function activate(context: vscode.ExtensionContext): void {
	const provider = new TaskTreeProvider();

	const view = vscode.window.createTreeView('simpleTaskTree.view', {
		treeDataProvider: provider,
	});

	context.subscriptions.push(
		view,
		vscode.commands.registerCommand('simpleTaskTree.refresh', () => provider.refresh()),
		vscode.commands.registerCommand('simpleTaskTree.runTask', (task: DeclaredTask) => runDeclaredTask(task))
	);

	const watcher = vscode.workspace.createFileSystemWatcher('**/.vscode/tasks.json');
	context.subscriptions.push(
		watcher,
		watcher.onDidChange(() => provider.refresh()),
		watcher.onDidCreate(() => provider.refresh()),
		watcher.onDidDelete(() => provider.refresh()),
		vscode.workspace.onDidChangeWorkspaceFolders(() => provider.refresh()),
		vscode.workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration('simpleTaskTree')) {
				provider.refresh();
			}
		})
	);
}

export function deactivate(): void {
	// no-op
}
