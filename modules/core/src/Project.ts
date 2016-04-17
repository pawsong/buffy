import { SerializedGameMap } from './classes/GameMap';
import { Scripts } from './types';

export interface SerializedLocalServer {
  myId: string;
  maps: SerializedGameMap[];
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
