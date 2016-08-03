export interface AnimationEditorState {
  revision: number;
}

export interface ExtraData {
  container: HTMLElement;
  workspace: any;
  workspaceHasMount: boolean;
}

export interface SerializedData {
  blocklyXml: string;
}
