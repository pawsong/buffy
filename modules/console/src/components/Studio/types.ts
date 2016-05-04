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
