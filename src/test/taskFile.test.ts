import * as assert from 'assert';
import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { readDeclaredTasks } from '../taskFile';

suite('readDeclaredTasks', () => {
	let workspaceDir: string;
	let folder: vscode.WorkspaceFolder;

	setup(async () => {
		workspaceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'simple-task-tree-'));
		await fs.mkdir(path.join(workspaceDir, '.vscode'), { recursive: true });
		const uri = vscode.Uri.file(workspaceDir);
		folder = { uri, name: 'fixture', index: 0 };
	});

	teardown(async () => {
		await fs.rm(workspaceDir, { recursive: true, force: true });
	});

	test('returns only labelled tasks declared in tasks.json', async () => {
		const tasksJson = {
			version: '2.0.0',
			tasks: [
				{ label: 'Build', type: 'shell', command: 'echo build' },
				{ label: 'Test', type: 'shell', command: 'echo test' },
			],
		};
		await fs.writeFile(path.join(workspaceDir, '.vscode', 'tasks.json'), JSON.stringify(tasksJson));

		const tasks = await readDeclaredTasks(folder);

		assert.deepStrictEqual(
			tasks.map((t) => t.label),
			['Build', 'Test']
		);
	});

	test('falls back to taskName for legacy entries', async () => {
		const tasksJson = {
			version: '2.0.0',
			tasks: [{ taskName: 'Legacy', type: 'shell', command: 'echo legacy' }],
		};
		await fs.writeFile(path.join(workspaceDir, '.vscode', 'tasks.json'), JSON.stringify(tasksJson));

		const tasks = await readDeclaredTasks(folder);

		assert.deepStrictEqual(
			tasks.map((t) => t.label),
			['Legacy']
		);
	});

	test('returns an empty list when tasks.json is missing', async () => {
		const tasks = await readDeclaredTasks(folder);
		assert.deepStrictEqual(tasks, []);
	});

	test('ignores tasks without a label', async () => {
		const tasksJson = {
			version: '2.0.0',
			tasks: [{ type: 'shell', command: 'echo anonymous' }],
		};
		await fs.writeFile(path.join(workspaceDir, '.vscode', 'tasks.json'), JSON.stringify(tasksJson));

		const tasks = await readDeclaredTasks(folder);
		assert.deepStrictEqual(tasks, []);
	});
});
