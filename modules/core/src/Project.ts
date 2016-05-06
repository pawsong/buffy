import { SerializedGameMap } from './classes/GameMap';
import { SerializedGameObject } from './classes/GameObject';
import { Scripts } from './types';

export interface SerializedLocalServer {
  zones: SerializedGameMap[];
  objects: SerializedGameObject[];
}

export interface ProjectData {
  server: SerializedLocalServer;
  blocklyXml: string;
  scripts: Scripts;
  voxels: any;
}

export interface Project extends ProjectData {
  name: string;
  desc: string;
}
