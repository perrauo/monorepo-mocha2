import {relative} from "path";
import {TestItem, TestRun, WorkspaceFolder} from "vscode";
import {ConfigurationProvider} from "../providers/ConfigurationProvider";
import {TerminalProvider} from "../providers/TerminalProvider";
import { startTestRun, testController } from "../providers/TestManager";

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
  testRun?: TestRun,
  item?: TestItem,
): Promise<boolean> {
  const relativeFilename = relative(rootPath.uri.fsPath, fileName);

  const terminalProvider = new TerminalProvider();
  const configurationProvider = new ConfigurationProvider(rootPath);
  
  let run = testRun;
  if (testController && item) {
    run = startTestRun(testController, runMode, item, {
      include: [item],
      exclude: [],
      profile: undefined,
    });
  }

  const testRunner = new MochaTestRunner(configurationProvider, terminalProvider);
  if (isDebug) {
    return testRunner.runTest(rootPath, relativeFilename, testName, true, runMode, run, item);
  } else {
    return testRunner.runTest(rootPath, relativeFilename, testName, false, runMode, run, item);
  }
}

const runTest = async(
  rootPath: WorkspaceFolder,
  fileName: string,
  testName: string,
  runMode: TestRunMode,
  testRun?: TestRun,
  item?: TestItem,
): Promise<boolean> => {

  return executeTest(rootPath, fileName, testName, runMode, false, testRun, item);
};

const debugTest = async(
  rootPath: WorkspaceFolder,
  fileName: string,
  testName: string,
  runMode: TestRunMode,
  testRun?: TestRun,
  item?: TestItem,
): Promise<boolean> => {

  return executeTest(rootPath, fileName, testName, runMode, true, testRun, item);
};

export {runTest, debugTest};