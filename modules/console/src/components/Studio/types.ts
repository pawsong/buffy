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

export interface RobotInstance {
  id: string;
  name: string;
  mapName: string;
}

export interface ZoneInstance {
  id: string;
  name: string;
  width: number;
  depth: number;
}
