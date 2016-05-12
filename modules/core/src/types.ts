export interface Scripts {
  [index: string]: string[];
}

export interface Mesh {
  vertices: any[];
  faces: any[];
}

export type Position = [number /* x */, number /* y */, number /* z */];
export type Direction = [number /* x */, number /* y */, number /* z */];

export interface Color {
  r: number; g: number; b: number;
}
