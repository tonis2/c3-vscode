import * as path from 'path';
import { workspace } from 'vscode';
import { Trace } from 'vscode-jsonrpc';
import fs from "fs";

import { LanguageClient } from 'vscode-languageclient/node';

import os from "os";

let client;
const c3Config = workspace.getConfiguration('c3.lsp');
const c3LSPClientConfig = workspace.getConfiguration('c3lspclient.lsp');

export function activate(context) {
	let executable = c3LSPClientConfig.get('path');
	let enabled = c3LSPClientConfig.get('enable');

	if (enabled == false) return;

	// let project_jsons = [];
	// for (folder of workspace.workspaceFolders) {
	// 	fs.readFile(path.join(folder.uri.path,"project.json"), (err, data) => {
	// 		if(!err) console.log(JSON.parse(data));
	// 	});
	// }

	if (!executable) {
		switch (os.platform()) {
			case "win32": {
				executable = path.join(context.extensionPath, "c3-lsp-windows-amd64.exe");
				break;
			}
			case "darwin": {
				executable = path.join(context.extensionPath, "c3-lsp-darwin-arm64");
				break;
			}
			case "linux": {
				executable = path.join(context.extensionPath, "c3-lsp-linux-amd64");
				break;
			}
		}
	}
	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used

	let args = [];

	if (c3Config.get('sendCrashReports')) {
		args.push('--send-crash-reports');
	}

	if (c3Config.get('c3.path')) {
		args.push('--c3c-path=' + c3Config.get('c3.path'));
	}

	if (c3Config.get('c3.stdlibPath')) {
		args.push('--stdlib-path=' + c3Config.get('c3.stdlibPath'));
	}

	if (c3Config.get('log.path')) {
		args.push('--log-path=' + c3Config.get('log.path'));
	}

	if (c3Config.get('c3.version')) {
		args.push('--lang-version=' + c3Config.get('c3.version'));
	}

	if (c3Config.get('debug')) {
		args.push('--debug');
	}

	if (c3Config.get('diagnosticsDelay')) {
		args.push('--diagnostics-delay=' + c3Config.get('diagnosticsDelay'));
	}

	const serverOptions = {
		run: {
			command: executable,
			args: args,
		},
		debug: {
			command: executable,
			args: args,
			options: { execArgv: ['--nolazy', '--inspect=6009'] }
		}
	}
	// Options to control the language client
	const clientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'c3' }],
		synchronize: {
			// Notify the server about file changes to '.c3' or '.c3i' files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/*.{c3,c3i}'),
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'C3LSP',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.setTrace(Trace.Verbose);
	client.start();
}

export function deactivate() {
	if (!client) {
		return undefined;
	}
	return client.stop();
}