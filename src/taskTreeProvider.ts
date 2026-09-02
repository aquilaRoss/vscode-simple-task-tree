import * as vscode from 'vscode';
import { DeclaredTask, readDeclaredTasks } from './taskFile';

type TreeNode = FolderNode | TaskNode;

class FolderNode {
	readonly kind = 'folder';
	constructor(public readonly folder: vscode.WorkspaceFolder) {}
}

class TaskNode {
	readonly kind = 'task';
	constructor(public readonly task: DeclaredTask) {}
}

export class TaskTreeProvider implements vscode.TreeDataProvider<TreeNode> {
	private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: TreeNode): vscode.TreeItem {
		if (element.kind === 'folder') {
			const item = new vscode.TreeItem(element.folder.name, vscode.TreeItemCollapsibleState.Expanded);
			item.contextValue = 'folder';
			item.iconPath = new vscode.ThemeIcon('folder');
			return item;
		}

		const item = new vscode.TreeItem(element.task.label, vscode.TreeItemCollapsibleState.None);
		item.contextValue = 'task';
		item.iconPath = new vscode.ThemeIcon('play');
		item.command = {
			command: 'simpleTaskTree.runTask',
			title: 'Run Task',
			arguments: [element.task],
		};
		return item;
	}

	async getChildren(element?: TreeNode): Promise<TreeNode[]> {
		const folders = vscode.workspace.workspaceFolders ?? [];

		if (!element) {
			if (folders.length === 0) {
				return [];
			}
			if (folders.length === 1) {
				return this.taskNodesForFolder(folders[0]);
			}
			return folders.map((folder) => new FolderNode(folder));
		}

		if (element.kind === 'folder') {
			return this.taskNodesForFolder(element.folder);
		}

		return [];
	}

	private async taskNodesForFolder(folder: vscode.WorkspaceFolder): Promise<TaskNode[]> {
		const config = vscode.workspace.getConfiguration('simpleTaskTree', folder);
		const sortOrder = config.get<string>('sortOrder', 'tasksJson');

		const tasks = await readDeclaredTasks(folder);
		if (sortOrder === 'alphabetical') {
			tasks.sort((a, b) => a.label.localeCompare(b.label));
		}
		return tasks.map((task) => new TaskNode(task));
	}
}
