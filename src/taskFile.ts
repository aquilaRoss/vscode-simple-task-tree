import * as vscode from 'vscode';

export interface DeclaredTask {
	label: string;
	folder: vscode.WorkspaceFolder;
}

interface TaskEntry {
	label?: unknown;
	taskName?: unknown;
}

interface TasksJson {
	tasks?: TaskEntry[];
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

	let parsed: TasksJson;
	try {
		parsed = JSON.parse(stripJsonComments(text));
	} catch {
		return [];
	}

	if (!Array.isArray(parsed.tasks)) {
		return [];
	}

	const result: DeclaredTask[] = [];
	for (const entry of parsed.tasks) {
		const label = readLabel(entry);
		if (label) {
			result.push({ label, folder });
		}
	}
	return result;
}

function readLabel(entry: TaskEntry): string | undefined {
	if (typeof entry.label === 'string') {
		return entry.label;
	}
	if (typeof entry.taskName === 'string') {
		return entry.taskName;
	}
	return undefined;
}

/**
 * tasks.json allows // and /* comments and trailing commas (JSONC). Strips
 * comments outside of strings so the result can go through JSON.parse; a
 * trailing-comma-tolerant regex pass then removes those too.
 */
function stripJsonComments(text: string): string {
	let result = '';
	let inString = false;
	let inLineComment = false;
	let inBlockComment = false;

	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		const next = text[i + 1];

		if (inLineComment) {
			if (char === '\n') {
				inLineComment = false;
				result += char;
			}
			continue;
		}

		if (inBlockComment) {
			if (char === '*' && next === '/') {
				inBlockComment = false;
				i++;
			}
			continue;
		}

		if (inString) {
			result += char;
			if (char === '\\') {
				result += next;
				i++;
			} else if (char === '"') {
				inString = false;
			}
			continue;
		}

		if (char === '"') {
			inString = true;
			result += char;
		} else if (char === '/' && next === '/') {
			inLineComment = true;
			i++;
		} else if (char === '/' && next === '*') {
			inBlockComment = true;
			i++;
		} else {
			result += char;
		}
	}

	return result.replace(/,(\s*[}\]])/g, '$1');
}
