export enum FileType {
  ALL,
  CODE,
  DESIGN,
  ROBOT,
}

export interface FileDescriptor {
  id: string;
  name: string;
  type: FileType;
}
