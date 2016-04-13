import { SerializedGameMap } from './classes/GameMap';

export interface SerializedLocalServer {
  myId: string;
  maps: SerializedGameMap[];
}

export interface Project {
  name: string;
  desc: string;
  server: SerializedLocalServer;
  blocklyXml: string;
  scripts: { [index: string]: string[] };
}
