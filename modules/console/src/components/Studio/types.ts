export enum FileType {
  ALL,
  CODE,
  DESIGN,
  ROBOT,
  ZONE,
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
  state: any;
}

export interface RobotState {
  codes: string[];
  design: string;
}

export interface RobotInstance {
  id: string;
  name: string;
  mapName: string;
  templateId: string;
}

export interface ZoneInstance {
  id: string;
  name: string;
  width: number;
  depth: number;
}
