import {Terminal, TerminalOptions, window} from "vscode";

export class TerminalProvider {
  private activeTerminal: Terminal | undefined;

  public get(
    terminalOptions: TerminalOptions,
    rootPath: string
  ): Terminal {
    if (this.activeTerminal) {
      this.activeTerminal.dispose();
    }

    this.activeTerminal = window.createTerminal({
      ...terminalOptions,
    });
    this.activeTerminal.sendText(`cd ${rootPath}`, true);

    return this.activeTerminal;
  }
}