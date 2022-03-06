import {relative} from "path";
import {WorkspaceFolder} from "vscode";
import {ConfigurationProvider} from "../providers/ConfigurationProvider";
import {TerminalProvider} from "../providers/TerminalProvider";

import {MochaTestRunner} from "../runners/MochaRunner";

export enum TestRunMode {
  folder,
  file,
  suite,
}

async function executeTest(
  rootPath: WorkspaceFolder,
  fileName: string,
  testName: string,
  runMode: TestRunMode,
  isDebug: boolean,
): Promise<boolean> {
  const relativeFilename = relative(rootPath.uri.fsPath, fileName);

  const terminalProvider = new TerminalProvider();
  const configurationProvider = new ConfigurationProvider(rootPath);
  
  const testRunner = new MochaTestRunner(configurationProvider, terminalProvider);
  if (isDebug) {
    return testRunner.runTest(rootPath, relativeFilename, testName, true, runMode);
  } else {
    return testRunner.runTest(rootPath, relativeFilename, testName, false, runMode);
  }
}

const runTest = async(
  rootPath: WorkspaceFolder,
  fileName: string,
  testName: string,
  runMode: TestRunMode): Promise<boolean> => {

  return executeTest(rootPath, fileName, testName, runMode, false);
};

const debugTest = async(
  rootPath: WorkspaceFolder,
  fileName: string,
  testName: string,
  runMode: TestRunMode): Promise<boolean> => {

  return executeTest(rootPath, fileName, testName, runMode, true);
};

export {runTest, debugTest};