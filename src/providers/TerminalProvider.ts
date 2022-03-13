import {Terminal, TerminalOptions, window} from "vscode";

export class TerminalProvider {
  private getMatchingTerminal(name: string) : Terminal | undefined {
    return window.terminals.find(terminal => terminal.name === name);
  }

  private getOrCreateTerminal(name: string, terminalOptions: TerminalOptions): Terminal {
    const existingTerminal = this.getMatchingTerminal(name);

    return existingTerminal || window.createTerminal({
      name,
      ...terminalOptions,
    });
  }

  public get(
    name: string,
    terminalOptions: TerminalOptions,
    rootPath: string
  ): Terminal {
    
    const activeTerminal = this.getOrCreateTerminal(name, terminalOptions);
    
    activeTerminal.sendText(`cd ${rootPath}`, true);

    return activeTerminal;
  }
}