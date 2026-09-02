import * as vscode from 'vscode';
import { DeclaredTask } from './taskFile';

/**
 * Resolves a label parsed from tasks.json to the real vscode.Task VS Code knows
 * how to execute, rather than reimplementing task execution ourselves.
 */
export async function runDeclaredTask(declared: DeclaredTask): Promise<void> {
	const allTasks = await vscode.tasks.fetchTasks();
	const match = allTasks.find(
		(task) => task.name === declared.label && task.scope !== vscode.TaskScope.Global && folderMatches(task, declared.folder)
	);

	if (!match) {
		vscode.window.showErrorMessage(`Simple Task Tree: could not resolve task "${declared.label}" to run it.`);
		return;
	}

	await vscode.tasks.executeTask(match);
}

function folderMatches(task: vscode.Task, folder: vscode.WorkspaceFolder): boolean {
	const scope = task.scope;
	if (!scope || scope === vscode.TaskScope.Global || scope === vscode.TaskScope.Workspace) {
		return true;
	}
	return scope.uri.toString() === folder.uri.toString();
}
