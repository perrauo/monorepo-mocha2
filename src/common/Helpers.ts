import {TextDocument, Uri, workspace, WorkspaceFolder} from 'vscode';

export const getRootPath = (uri : Uri): WorkspaceFolder | typeof workspace => {
  const activeWorkspace = workspace.getWorkspaceFolder(uri);

  if (activeWorkspace) {
    return activeWorkspace;
  }

  return workspace;
};

interface BabelCodeLocation {
  line: number;
}

export const createRangeObject = ({ line }: BabelCodeLocation, document: TextDocument) => document.lineAt(line - 1).range;
