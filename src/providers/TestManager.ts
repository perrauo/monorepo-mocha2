import {
  CancellationToken,
  Range,
  TestController,
  TestRunProfileKind,
  tests,
  TestTag,
  Uri,
  commands,
  TestRunRequest,
  workspace,
  TestItem,
  WorkspaceFolder,
} from "vscode";
import {basename, relative} from "path";
import {DEBUG_TEST_COMMAND, RUN_TEST_COMMAND} from "../common/Constants";
import {createRangeObject, getRootPath} from "../common/Helpers";
import {ConfigurationProvider} from "./ConfigurationProvider";
import {codeParser, TestEntryPoint} from "./CodeParser";
import {getMatchingConfig, getWorkingDirectory} from "../runners/MochaRunner";
import {TestRunMode} from "../commands/RunTestCommand";

export let testController: TestController | undefined = undefined;

export const TEST = "test";
export const TEST_SUITE = "testSuite";
export const FOLDER = "folder";

export const getTestRoot = (
  config: ConfigurationProvider,
  rootPath: WorkspaceFolder,
  fileName: string,
  controller: TestController,
  ): TestItem => {
  const rootFilePath = rootPath.uri.fsPath;
  const matchingConfig = getMatchingConfig(config, fileName);
  const relativeFilename = relative(rootFilePath, fileName);
  const root = getWorkingDirectory(rootPath, matchingConfig, config.useTSConfig, relativeFilename);
  const relativeRoot = relative(rootFilePath, root) || '<root>';
  let rootItem = undefined;
  controller.items.forEach((item) => {
    if (item.label === relativeRoot) {
      rootItem = item;
    }
  });
  if (!rootItem) {
    const uri = Uri.file(root);
    rootItem = controller.createTestItem(relativeRoot, relativeRoot, uri);
    rootItem.tags = [new TestTag(FOLDER)];
    controller.items.add(rootItem);
  }
  return rootItem;
};

const getTestRunMode = (tag: TestTag): TestRunMode => {
  switch (tag.id) {
    case TEST_SUITE:
      return TestRunMode.file;
    case TEST:
      return TestRunMode.suite;
    default:
      return TestRunMode.folder;
  }
};

const executeTest = async  (request: TestRunRequest, command: string) => {
  const {include} = request;
      if (include) {
        await Promise.all(include.map((item): Promise<void> => {
          if (item.uri) {
            const rootPath = getRootPath(item.uri);
            const fileName = item.uri.fsPath;
            const testName = item.label;
            const [tag] = item.tags;
            const runMode = getTestRunMode(tag);
            return commands.executeCommand(command,
              rootPath, fileName, testName, runMode,
            ) as Promise<void>;
          }

          return Promise.resolve();
        }));
      }
};

export const discoverTests = async (testController: TestController) => {
  testController.items.forEach(item => testController?.items.delete(item.id));
    const loadingItem = testController?.createTestItem('mocha-mono-searching', 'Searching for tests...');
    testController.items.add(loadingItem);
    const [first] = workspace.workspaceFolders || [];
    const config = new ConfigurationProvider(first);

    await Promise.all(config.testExtensions.map(async (extension) => {
      const files = await workspace.findFiles(`**/*${extension}`, `**/node_modules/**`);
      files.map(file => {
        if (testController) {
        const fileName = file.fsPath;
        const label = basename(fileName);
        const id = fileName;
        
        const item = testController.createTestItem(id, label, file);
        if (item) {
          item.tags = [new TestTag(TEST_SUITE)];
          item.canResolveChildren = true;
        }
        const rootItem = getTestRoot(config, first, fileName, testController,);
        rootItem.children.add(item);
        return item;
      }});
      testController?.items.delete(loadingItem.id);
    }));
};

export const initTestController = (): TestController => {
  testController = tests.createTestController(
		'e68621e5-0cbd-4bbd-87cc-a8cea71f0648',
		'Mocha Tests'
	);

  testController.resolveHandler = async (item: TestItem | undefined) => {
    if (item && item.uri) {
      const document = await workspace.openTextDocument(item.uri);
      codeParser(document.getText(), (entryPoint: TestEntryPoint) => {
        const {loc: {start}, testName} = entryPoint;
        const testCase = testController?.createTestItem(
          `${item.uri?.fsPath}-${testName}`,
          testName,
          item.uri,
        );

        if (testCase) {
          const range = createRangeObject(start, document);
          testCase.tags = [new TestTag(TEST)];
          testCase.range = range;
          item.children.add(testCase);
        }
      });
    }
  };

  testController.refreshHandler = async (token: CancellationToken) => {
    if (testController) {
      await discoverTests(testController);
    }
	};

	testController.createRunProfile(
		'Run Mocha Tests', 
		TestRunProfileKind.Run, 
		async (request, token) => executeTest(request, RUN_TEST_COMMAND),
	);

  testController.createRunProfile(
		'Debug Mocha Tests', 
		TestRunProfileKind.Debug, 
		async (request, token) => executeTest(request, DEBUG_TEST_COMMAND),
	);

  return testController;
};

export const addTestFile = (
  rootPath: WorkspaceFolder,
  config: ConfigurationProvider,
  fileName: string,
  testName: string,
  uri: Uri,
  range: Range,
) => {
  if (testController) {
    const root = getTestRoot(config, rootPath , fileName, testController);
    let parent = root.children.get(fileName);
    if (!parent) {
      
      parent = testController.createTestItem(fileName, basename(fileName), uri);
      parent.tags = [new TestTag(TEST_SUITE)];
      root.children.add(parent);
    }
    const item = testController.createTestItem(
      `${fileName}-${testName}`,
      testName,
      uri,
    );
    item.range = range;
    item.tags = [new TestTag(TEST)];
    parent.children.add(
      item
    );
  }
};
