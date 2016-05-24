export enum FileType {
  ALL,
  CODE,
  MODEL,
  ROBOT,
  WORLD,
}

export interface FileDescriptor {
  id: string;
  name: string;
  type: FileType;
}

export interface SourceFile {
  id: string;
  name: string;
  type: FileType;
  created: boolean;
  modified: boolean;
  readonly: boolean;
  savedState: any;
  state: any;
  extraData?: any;
}

export interface SourceFileDB {
  [index: string]: SourceFile;
}

export interface RobotState {
  codes: string[];
  design: string;
}
