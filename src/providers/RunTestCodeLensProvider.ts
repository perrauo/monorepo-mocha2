import {CancellationToken, CodeLens, CodeLensProvider, TextDocument, TestController, WorkspaceFolder} from 'vscode';
import {TestRunMode} from '../commands/RunTestCommand';
import {DEBUG_TEST_COMMAND, RUN_TEST_COMMAND } from '../common/Constants';
import {createRangeObject, getRootPath} from '../common/Helpers';
import {codeParser, TestEntryPoint} from './CodeParser';
import {ConfigurationProvider} from './ConfigurationProvider';
import {addTestFile, getTestRoot, testController} from './TestManager';

export class RunTestCodeLensProvider implements CodeLensProvider {
  provideCodeLenses(
    document: TextDocument,
    token: CancellationToken,
  ): CodeLens[] | Thenable<CodeLens[]> {
    const rootPath = getRootPath(document.uri);
    const configurationProvider = new ConfigurationProvider(rootPath);
    const extensions = configurationProvider.testExtensions;
    const {fileName} = document;
    const matching = extensions.filter(ext => fileName.endsWith(ext));
    const isTest = matching.length > 0;
    const results: CodeLens[] = [];
    if (isTest) {
      if (testController) {
        const root = getTestRoot(
          configurationProvider,
          rootPath as WorkspaceFolder,
          fileName,
          testController,
        );
        const parent = root.children.get(fileName);
        if (parent) {
          parent.children.forEach((child) => parent.children.delete(child.id));
        }
      }
      codeParser(document.getText(), (entryPoint: TestEntryPoint) => {
        const {loc: {start}, testName} = entryPoint;  
        const range = createRangeObject(start, document);
        
        addTestFile(rootPath as WorkspaceFolder, configurationProvider, fileName, testName, document.uri, range);

        results.push(new CodeLens(range, {
          title: 'Run test',
          command: RUN_TEST_COMMAND,
          arguments: [rootPath, fileName, testName, TestRunMode.suite],
        }));

        results.push(new CodeLens(range, {
          title: 'Debug test',
          command: DEBUG_TEST_COMMAND,
          arguments: [rootPath, fileName, testName, TestRunMode.suite]
        }));
      });
    }

    return results;
  }
}
