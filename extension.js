import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';
import { Trace } from 'vscode-jsonrpc';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

import os from "os";

let client;
const config = workspace.getConfiguration('c3lspclient.lsp');

export function activate(context) {
	let executable = config.get('path');
	let enabled = config.get('enable');

	if (enabled == false) return;

	if (!executable) {
		switch(os.platform()) {
			case "win32": {
				executable = path.join(context.extensionPath, "c3-lsp-windows");
				break;
			}
			case "darwin": {
				executable = path.join(context.extensionPath, "c3-lsp-macos");
				break;
			}
			case "linux": {
				executable = path.join(context.extensionPath, "c3-lsp-linux");
				break;
			}
		}
	}
	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used

	let args = [];
	
	if (config.get('sendCrashReports')) {
		args.push('--send-crash-reports');
	}

    if (config.get('log.path').length > 0) {
        args.push('--log-path ' + config.get('log.path'));
    }

    if (config.get('c3.version')) {
        args.push('--lang-version '+ config.get('c3.version'));
    }

	const serverOptions = {
		run: {
			command: executable,
			args: args,
		},
		debug: {
			command:executable,
			args: args,
			options: { execArgv: ['--nolazy', '--inspect=6009'] }
		}
	}
	// Options to control the language client
	const clientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'c3' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.c3')
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
	return client.stop();
}