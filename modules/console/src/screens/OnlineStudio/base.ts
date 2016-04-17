interface Map {
  id: string;
  name: string;
  width: number;
  depth: number;
}

export interface GameUser {
  id: string;
  name: string;
  owner: string;
  mesh: string;
  home: Map;
  loc: {
    map: string;
    pos: Position;
  },
}
