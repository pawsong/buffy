import { SerializedGameMap } from './classes/GameMap';

export interface SerializedLocalServer {
  myId: string;
  maps: SerializedGameMap[];
}

export interface Scripts {
  [index: string]: string[];
}

export interface ProjectData {
  server: SerializedLocalServer;
  blocklyXml: string;
  scripts: Scripts;
}

export interface Project extends ProjectData {
  name: string;
  desc: string;
}
