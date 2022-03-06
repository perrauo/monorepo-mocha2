import {workspace, WorkspaceConfiguration, WorkspaceFolder} from "vscode";
import {EXTENSION_NS} from "../common/Constants";

export interface TestLocationConfiguration {
  rootPath: string;
  additionalArguments: string;
  env?: Record<string, string>;
  cwd?: string;
}

export class ConfigurationProvider {
  public configuration: WorkspaceConfiguration;

  constructor(rootPath: WorkspaceFolder | typeof workspace) {
    const scope = rootPath === workspace ? undefined : (rootPath as WorkspaceFolder).uri;
    this.configuration = workspace.getConfiguration(EXTENSION_NS, scope);
  }

  get defaultArguments(): string | undefined {
    return this.configuration.get("defaultArguments") || '--require ts-node/register';
  }

  get testConfigurations(): TestLocationConfiguration[] | undefined {
    return this.configuration.get("testRoots") || [];
  }

  get testExtensions(): string[] {
    return this.configuration.get("extensions") || ['.test.ts'];
  }

  get useTSConfig(): boolean {
    return this.configuration.get("useTSConfig") || true;
  }

  get debugTimeout(): number {
    return this.configuration.get("debugTimeout") || 10000;
  }
}
