import * as vscode from 'vscode';
import { parseTree, findNodeAtLocation, Node } from 'jsonc-parser';

export interface DeclaredTask {
	label: string;
	folder: vscode.WorkspaceFolder;
}

/**
 * Reads task labels straight out of .vscode/tasks.json for a folder, bypassing
 * VS Code's task providers so shell/npm/etc auto-detected tasks never appear.
 */
export async function readDeclaredTasks(folder: vscode.WorkspaceFolder): Promise<DeclaredTask[]> {
	const uri = vscode.Uri.joinPath(folder.uri, '.vscode', 'tasks.json');
	let text: string;
	try {
		const bytes = await vscode.workspace.fs.readFile(uri);
		text = Buffer.from(bytes).toString('utf8');
	} catch {
		return [];
	}

	const root = parseTree(text);
	if (!root) {
		return [];
	}
	const tasksNode = findNodeAtLocation(root, ['tasks']);
	if (!tasksNode || tasksNode.type !== 'array' || !tasksNode.children) {
		return [];
	}

	const result: DeclaredTask[] = [];
	for (const taskNode of tasksNode.children) {
		const label = readLabel(taskNode);
		if (label) {
			result.push({ label, folder });
		}
	}
	return result;
}

function readLabel(taskNode: Node): string | undefined {
	const labelNode = findNodeAtLocation(taskNode, ['label']) ?? findNodeAtLocation(taskNode, ['taskName']);
	if (labelNode && typeof labelNode.value === 'string') {
		return labelNode.value;
	}
	return undefined;
}
