export enum FileType {
  ALL,
  CODE,
  MODEL,
  ROBOT,
  WORLD,
}

export interface SourceFile<T, U> {
  id: string;
  name: string;
  type: FileType;
  created: boolean;
  modified: boolean;
  readonly: boolean;
  savedBody: T;
  body: T;
  extra?: U;
}
