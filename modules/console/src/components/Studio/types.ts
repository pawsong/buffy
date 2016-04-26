export enum FileType {
  CODE,
  DESIGN,
  ROBOT,
}

export interface FileFilter {
  type: FileType; // If omitted, do not filter by type.
}

export interface FileDescriptor {
  id: string;
  name: string;
  type: FileType;
}
