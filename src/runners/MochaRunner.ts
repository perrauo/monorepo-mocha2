import {join, relative, sep, dirname, resolve} from 'path';
import {existsSync, watchFile, readFileSync, rmSync, unwatchFile} from 'fs';
import * as uuid from 'uuid';
import {XMLParser} from 'fast-xml-parser';
import {debug, DebugSession, Disposable, TestItem, TestRun, WorkspaceFolder} from "vscode";
import {ConfigurationProvider, TestLocationConfiguration} from "../providers/ConfigurationProvider";
import {TerminalProvider} from "../providers/TerminalProvider";
import {TestRunMode} from "../commands/RunTestCommand";
import { registerTestResults } from "../providers/TestManager";

export const findTSConfig = (dir: string, root: string): string | undefined => {
  const tsconfig = join(dir, "tsconfig.json");
    if (existsSync(tsconfig)) {
      return dirname(tsconfig);
    }
    if (dir === root) {
      return undefined;
    } else {
      return findTSConfig(resolve(dir, '..'), root);
    }
};   

export const getWorkingDirectory = (rootPath: WorkspaceFolder, config: TestLocationConfiguration | undefined, useTSConfig: boolean, filePath: string) => {
  if (config) {
    return join(rootPath.uri.fsPath, config.cwd || config.rootPath);
  }

  if (useTSConfig) {
    const root = rootPath.uri.fsPath;
    const tsconfig = findTSConfig(dirname(join(root,filePath)), root);
    if (tsconfig) {
      return tsconfig;
    }
  }

  return rootPath.uri.fsPath;
};

export const getMatchingConfig = (
  provider: ConfigurationProvider,
  fileName: string,
  ) => {
  const configs = provider.testConfigurations;
    const matchingConfig = configs?.find(config => {
      const a = fileName.replace(/\\/g, "/");
      const b = config.rootPath.replace(/\\/g, "/");
      return a.startsWith(b);
    });
    return matchingConfig;
  };
export class MochaTestRunner  {
  public name: string = "mocha";
  public path: string = join("node_modules", ".bin", this.name);
  public terminalProvider: TerminalProvider;
  public configurationProvider: ConfigurationProvider;

  constructor(
    configurationProvider: ConfigurationProvider,
    terminalProvider: TerminalProvider,
    path?: string
  ) {
    this.terminalProvider = terminalProvider;
    this.configurationProvider = configurationProvider;

    if (path) {
      this.path = path;
    } else {
      const overrideMochaPath = configurationProvider.pathToMocha;
      if (overrideMochaPath) {
        this.path = overrideMochaPath;
      }
    }
  }

  async trackResults(
    rootPath: WorkspaceFolder,
    fileName: string,
    testName: string,
    runMode: TestRunMode,
    outFile: string,
    testRun: TestRun,
    item: TestItem,
  ) : Promise<void> {
    return new Promise<void>((resolve, reject) => {
      testRun.started(item);
      watchFile(outFile, {}, () => {
        try {
          if (existsSync(outFile)) {
            const fileData = readFileSync(outFile, 'utf8');
            const parser = new XMLParser({ignoreAttributes: false});
            const results = parser.parse(fileData);
            registerTestResults(join(rootPath.uri.fsPath, fileName), testName, runMode, results, testRun, item);
            unwatchFile(outFile);
            rmSync(outFile);
          }
        } catch(e) {
          console.error(e);
        }
        resolve();
      });
    });
  }

  public async runTest(
    rootPath: WorkspaceFolder,
    fileName: string,
    testName: string,
    debug: boolean,
    runMode: TestRunMode,
    testRun?: TestRun,
    item?: TestItem,
  ): Promise<boolean> {
    const additionalArguments = this.configurationProvider.defaultArguments;
    

    const matchingConfig = getMatchingConfig(this.configurationProvider, fileName);
    const debugTimeout = this.configurationProvider.debugTimeout;
    const useTSConfig = this.configurationProvider.useTSConfig;
    const cwd = getWorkingDirectory(rootPath, matchingConfig, useTSConfig, fileName);
    const mochaCmd = relative(cwd, join(rootPath.uri.fsPath, this.path));
    const testPath = relative(cwd, join(rootPath.uri.fsPath, fileName)); 
    const args: string[] = [
      mochaCmd.startsWith('\\.') ? mochaCmd : `.${sep}${mochaCmd}`,
    ];

    if (runMode === TestRunMode.suite) {
      if (testName.indexOf("'")) {
        args.push(
          '--grep',
          `'"${testName.replace(/['|"]/g, ".")}"'`,
        );
      } else {
        args.push(
          '--fgrep',
          `'"${testName}"'`,
        );
      }
    }

    if (debug) {
      args.push("--inspect");
    }

    if (matchingConfig) {
      args.push(matchingConfig.additionalArguments);
    } else if (additionalArguments) {
      args.push(additionalArguments);
    }

    if (runMode === TestRunMode.folder) {
      const globs = this.configurationProvider.testExtensions.map(ext => `**/*${ext}`);
      args.push(globs.join(','));
    } else {
      args.push(`.${sep}${testPath}`);
    }

    const promises = [];

    if (this.configurationProvider.trackResultsInline && testRun && item) {
      const outFile = `${join(cwd, `test-results-${uuid.v4()}.xml`)}`;
      args.push("--reporter", "xunit", "--reporter-option", `output=${outFile}`);
      promises.push(this.trackResults(rootPath, fileName, testName, runMode, outFile, testRun, item));
    }

    const command = args.join(' ');
    const terminal = this.terminalProvider.get(
      `Mocha  - ${testName}`, 
      {
        cwd, 
        env: matchingConfig?.env,
      },
      cwd,
    );
    terminal.sendText(command, true);
    terminal.show(true);

    if (debug) {
      await this.debugAlt(rootPath, testName, debugTimeout);
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }

    return Promise.resolve(true);
  }

  public async debugAlt(
    rootPath: WorkspaceFolder,
    testName: string,
    debugTimeout: number,
   ) {
    const debuggerConfigName = `Debug ${testName}`;
		const debuggerConfig = {
			name: debuggerConfigName,
			type: 'pwa-node',
			request: 'attach',
			continueOnAttach: true,
			autoAttachChildProcesses: false,
			resolveSourceMapLocations: [
				"!**/node_modules/**",
			],
			skipFiles: [
				"<node_internals>/**"
			]
		};

		const debugSessionPromise = new Promise<DebugSession>((resolve, reject) => {
			let subscription: Disposable | undefined = debug.onDidStartDebugSession((debugSession: any) => {
				if ((debugSession.name === debuggerConfigName) && subscription) {
					resolve(debugSession);
					subscription.dispose();
					subscription = undefined;
				}
			});

			setTimeout(() => {
				if (subscription) {
					reject(new Error('Debug session failed to start within 5 seconds'));
					subscription.dispose();
					subscription = undefined;
				}
			}, debugTimeout);
		});

		const started = await debug.startDebugging(rootPath, debuggerConfig);
		if (started) {
			return await debugSessionPromise;
		} else {
			throw new Error('Debug session couldn\'t be started');
		}
  }
}