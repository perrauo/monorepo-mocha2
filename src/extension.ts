import * as vscode from 'vscode';
import {debugTest, runTest} from './commands/RunTestCommand';
import {DEBUG_TEST_COMMAND, RUN_TEST_COMMAND} from './common/Constants';
import {RunTestCodeLensProvider} from './providers/RunTestCodeLensProvider';
import {discoverTests, initTestController} from './providers/TestManager';

export async function activate(context: vscode.ExtensionContext) {
	
	const testController = initTestController();
	context.subscriptions.push(testController);

	await discoverTests(testController);

	const selector :vscode.DocumentSelector = {
		language: 'typescript',
		scheme: 'file',
	};

	context.subscriptions.push(
		vscode.languages.registerCodeLensProvider(
				selector, new RunTestCodeLensProvider()));

	vscode.commands.registerCommand(RUN_TEST_COMMAND, runTest);
  vscode.commands.registerCommand(DEBUG_TEST_COMMAND, debugTest);
}

export function deactivate() {}
