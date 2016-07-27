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

export interface User {
  id: string;
  username: string;
}

export interface ForkItem {
  id: string;
  name: string;
  owner: User;
}

export interface ModelFileDocument {
  id: string;
  name: string;
  owner: User;
  thumbnail: string;
  modifiedAt: string;
  isPublic: boolean;
  forkParent: ForkItem;
  forked: number;
  likeCount: number;
  commentCount: number;
}

/*
 * DO NOT CHANGE NAME OF THIS ENUM PROPERTIES.
 * THIS IS SAVED IN PERSISTENT FILES.
 */
export enum ModelFileType {
  DEFAULT,
  TROVE,
}

/*
 * DO NOT CHANGE NAME OF THIS ENUM PROPERTIES.
 * THIS IS SAVED IN PERSISTENT FILES.
 */
export enum MaterialMapType {
  DEFAULT,
  ALL,
  TROVE_TYPE,
  TROVE_ALPHA,
  TROVE_SPECULAR,
}
